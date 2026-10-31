import { Router } from "express";
import type { PoolClient } from "pg";
import { z } from "zod";
import { pool, tx } from "../db.js";
import { HttpError } from "../errors.js";
import { KINDS, type Kind } from "../kinds.js";
import { requireOpenPeriodForDate } from "../services/periods.js";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida (AAAA-MM-DD)");

const bodySchema = z.object({
  typeId: z.number().int().positive(),
  date: isoDate,
  amount: z.number().positive().multipleOf(0.01),
  description: z.string().trim().max(1000).nullish(),
  intentionDate: isoDate.nullish(),
});

export function movementsRouter(kind: Kind) {
  const k = KINDS[kind];
  const r = Router();
  const intentionSel = kind === "income" ? "m.intention_date" : "NULL::date";

  const select = `SELECT m.id, m.${k.fk} AS "typeId", t.name AS "typeName", c.code AS "categoryCode",
      c.name AS "categoryName", t.account_code AS "accountCode", m.date, m.amount, m.description,
      ${intentionSel} AS "intentionDate", m.period_id AS "periodId", p.status AS "periodStatus"
    FROM ${k.mov} m JOIN ${k.type} t ON t.id = m.${k.fk} JOIN ${k.cat} c ON c.id = t.category_id
    JOIN periods p ON p.id = m.period_id`;

  /** Valida tipo/categoría y la regla de intención. Devuelve valores normalizados. */
  async function normalize(c: PoolClient, b: z.infer<typeof bodySchema>, mustBeActive: boolean) {
    const { rows } = await c.query(
      `SELECT t.active, cat.code FROM ${k.type} t JOIN ${k.cat} cat ON cat.id = t.category_id WHERE t.id = $1`,
      [b.typeId],
    );
    if (!rows[0]) throw new HttpError(422, "El tipo seleccionado no existe.");
    if (mustBeActive && !rows[0].active) throw new HttpError(422, "El tipo seleccionado está inactivo.");
    const isIntention = k.intentionCode !== null && rows[0].code === k.intentionCode;
    const description = b.description?.trim() || null;
    if (isIntention && (!b.intentionDate || !description))
      throw new HttpError(422, "Una intención requiere la fecha en que se realizará y la descripción (mención/petición).");
    return { description, intentionDate: isIntention ? b.intentionDate! : null };
  }

  async function existing(c: PoolClient, id: number) {
    const { rows } = await c.query(
      `SELECT m.id, m.${k.fk} AS "typeId", p.status, p.year, p.month FROM ${k.mov} m JOIN periods p ON p.id = m.period_id WHERE m.id = $1 FOR UPDATE OF m`,
      [id],
    );
    if (!rows[0]) throw new HttpError(404, "Movimiento no encontrado.");
    if (rows[0].status !== "OPEN")
      throw new HttpError(409, `El período ${rows[0].year}-${String(rows[0].month).padStart(2, "0")} está cerrado.`);
    return rows[0] as { id: number; typeId: number };
  }

  r.get("/", async (req, res) => {
    const periodId = req.query.periodId ? Number(req.query.periodId) : null;
    const { rows } = await pool.query(
      `${select} WHERE ($1::int IS NULL OR m.period_id = $1) ORDER BY m.date DESC, m.id DESC`,
      [periodId],
    );
    res.json(rows);
  });

  r.post("/", async (req, res) => {
    const b = bodySchema.parse(req.body);
    const id = await tx(async (c) => {
      const periodId = await requireOpenPeriodForDate(c, b.date);
      const n = await normalize(c, b, true);
      const cols = [k.fk, "period_id", "date", "amount", "description", "created_by"];
      const vals: unknown[] = [b.typeId, periodId, b.date, b.amount, n.description, req.user!.id];
      if (kind === "income") { cols.push("intention_date"); vals.push(n.intentionDate); }
      const { rows } = await c.query(
        `INSERT INTO ${k.mov} (${cols.join(",")}) VALUES (${vals.map((_, i) => `$${i + 1}`).join(",")}) RETURNING id`,
        vals,
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
      const periodId = await requireOpenPeriodForDate(c, b.date);
      const n = await normalize(c, b, b.typeId !== cur.typeId);
      const sets = [`${k.fk}=$2`, "period_id=$3", "date=$4", "amount=$5", "description=$6", "updated_at=now()"];
      const vals: unknown[] = [id, b.typeId, periodId, b.date, b.amount, n.description];
      if (kind === "income") { sets.push("intention_date=$7"); vals.push(n.intentionDate); }
      await c.query(`UPDATE ${k.mov} SET ${sets.join(",")} WHERE id=$1`, vals);
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
