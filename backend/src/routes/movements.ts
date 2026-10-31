import { Router } from "express";
import type { PoolClient } from "pg";
import { z } from "zod";
import { pool, tx } from "../db.js";
import { HttpError } from "../errors.js";
import { KINDS, type Kind } from "../kinds.js";
import { todayISO } from "../services/dates.js";
import { requireOpenPeriodForDate } from "../services/periods.js";
import { refineIdNumber, responsibleShape } from "../services/responsible.js";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida (AAAA-MM-DD)");

const bodySchema = z
  .object({
    typeId: z.number().int().positive(),
    date: isoDate.optional(), // en ingresos se ignora: la fecha de registro es la fecha actual y no se edita
    amount: z.number().positive().multipleOf(0.01),
    description: z.string().trim().max(1000).nullish(),
    intentionDate: isoDate.nullish(),
    ...responsibleShape,
  })
  .superRefine(refineIdNumber);

export function movementsRouter(kind: Kind) {
  const k = KINDS[kind];
  const r = Router();
  const intentionSel = kind === "income" ? "m.intention_date" : "NULL::date";

  const select = `SELECT m.id, m.${k.fk} AS "typeId", t.name AS "typeName", c.code AS "categoryCode",
      c.name AS "categoryName", t.account_code AS "accountCode", m.date, m.amount, m.description,
      ${intentionSel} AS "intentionDate", m.period_id AS "periodId", p.status AS "periodStatus",
      m.responsible_name AS "responsible", m.address, m.id_type AS "idType", m.id_number AS "idNumber",
      m.contact_phone AS "phone", m.email, m.created_at AS "createdAt", COALESCE(u.name, u.email) AS "registeredBy"
    FROM ${k.mov} m JOIN ${k.type} t ON t.id = m.${k.fk} JOIN ${k.cat} c ON c.id = t.category_id
    JOIN periods p ON p.id = m.period_id LEFT JOIN users u ON u.id = m.created_by`;

  /** Valida tipo/categoría y la regla de estipendio. Devuelve valores normalizados. */
  async function normalize(c: PoolClient, b: z.infer<typeof bodySchema>, mustBeActive: boolean) {
    const { rows } = await c.query(
      `SELECT t.active, cat.code FROM ${k.type} t JOIN ${k.cat} cat ON cat.id = t.category_id WHERE t.id = $1`,
      [b.typeId],
    );
    if (!rows[0]) throw new HttpError(422, "El tipo seleccionado no existe.");
    if (mustBeActive && !rows[0].active) throw new HttpError(422, "El tipo seleccionado está inactivo.");
    const isStipend = k.stipendCode !== null && rows[0].code === k.stipendCode;
    const description = b.description?.trim() || null;
    if (isStipend && (!b.intentionDate || !description))
      throw new HttpError(422, "Un estipendio requiere la fecha en que se realizará la intención y la descripción (mención/petición).");
    return { description, intentionDate: isStipend ? b.intentionDate! : null };
  }

  async function existing(c: PoolClient, id: number) {
    const { rows } = await c.query(
      `SELECT m.id, m.${k.fk} AS "typeId", m.date, p.status, p.year, p.month FROM ${k.mov} m JOIN periods p ON p.id = m.period_id WHERE m.id = $1 FOR UPDATE OF m`,
      [id],
    );
    if (!rows[0]) throw new HttpError(404, "Movimiento no encontrado.");
    if (rows[0].status !== "OPEN")
      throw new HttpError(409, `El período ${rows[0].year}-${String(rows[0].month).padStart(2, "0")} está cerrado.`);
    return rows[0] as { id: number; typeId: number; date: string };
  }

  /**
   * Fecha del movimiento. Ingreso: la fecha actual al crear, y se conserva al editar (no es editable).
   * Egreso: la envía el cliente.
   */
  function movementDate(b: z.infer<typeof bodySchema>, current?: string) {
    const date = kind === "income" ? current ?? todayISO() : b.date;
    if (!date) throw new HttpError(422, "La fecha es obligatoria.");
    return date;
  }

  /** Columnas de la tabla de movimientos a partir del cuerpo validado (los nombres salen del código, no del cliente). */
  function columns(b: z.infer<typeof bodySchema>, periodId: number, date: string, n: Awaited<ReturnType<typeof normalize>>) {
    const data: Record<string, unknown> = {
      [k.fk]: b.typeId,
      period_id: periodId,
      date,
      amount: b.amount,
      description: n.description,
      responsible_name: b.responsible,
      address: b.address,
      id_type: b.idType,
      id_number: b.idNumber,
      contact_phone: b.phone,
      email: b.email ?? null,
    };
    if (kind === "income") data.intention_date = n.intentionDate;
    return data;
  }

  // Listado con búsqueda (responsable, identificación, tipo, descripción) y filtros por período y tipo
  r.get("/", async (req, res) => {
    const periodId = req.query.periodId ? Number(req.query.periodId) : null;
    const typeId = req.query.typeId ? Number(req.query.typeId) : null;
    const search = String(req.query.search ?? "").trim();
    const { rows } = await pool.query(
      `${select}
        WHERE ($1::int IS NULL OR m.period_id = $1)
          AND ($2::int IS NULL OR m.${k.fk} = $2)
          AND ($3::text = '' OR m.responsible_name ILIKE '%' || $3 || '%' OR m.id_number ILIKE '%' || $3 || '%'
               OR t.name ILIKE '%' || $3 || '%' OR m.description ILIKE '%' || $3 || '%')
        ORDER BY m.date DESC, m.id DESC`,
      [periodId, typeId, search],
    );
    res.json(rows);
  });

  // Detalle de un registro (lo usa la pantalla de edición)
  r.get("/:id", async (req, res) => {
    const { rows } = await pool.query(`${select} WHERE m.id = $1`, [Number(req.params.id)]);
    if (!rows[0]) throw new HttpError(404, "Movimiento no encontrado.");
    res.json(rows[0]);
  });

  r.post("/", async (req, res) => {
    const b = bodySchema.parse(req.body);
    const id = await tx(async (c) => {
      const date = movementDate(b);
      const periodId = await requireOpenPeriodForDate(c, date);
      const n = await normalize(c, b, true);
      const data = { ...columns(b, periodId, date, n), created_by: req.user!.id };
      const cols = Object.keys(data);
      const { rows } = await c.query(
        `INSERT INTO ${k.mov} (${cols.join(",")}) VALUES (${cols.map((_, i) => `$${i + 1}`).join(",")}) RETURNING id`,
        Object.values(data),
      );
      return rows[0].id as number;
    });
    res.status(201).json((await pool.query(`${select} WHERE m.id = $1`, [id])).rows[0]);
  });

  r.patch("/:id", async (req, res) => {
    const id = Number(req.params.id);
    const b = bodySchema.parse(req.body);
    await tx(async (c) => {
      const cur = await existing(c, id);
      const date = movementDate(b, cur.date);
      const periodId = await requireOpenPeriodForDate(c, date);
      const n = await normalize(c, b, b.typeId !== cur.typeId);
      const data = columns(b, periodId, date, n);
      const cols = Object.keys(data);
      await c.query(
        `UPDATE ${k.mov} SET ${cols.map((col, i) => `${col}=$${i + 2}`).join(",")}, updated_at=now() WHERE id=$1`,
        [id, ...Object.values(data)],
      );
    });
    res.json((await pool.query(`${select} WHERE m.id = $1`, [id])).rows[0]);
  });

  r.delete("/:id", async (req, res) => {
    const id = Number(req.params.id);
    await tx(async (c) => {
      await existing(c, id);
      await c.query(`DELETE FROM ${k.mov} WHERE id=$1`, [id]);
    });
    res.status(204).end();
  });

  return r;
}
