import { Router } from "express";
import { z } from "zod";
import { MASTER_WRITE_ROLES, requireRole } from "../auth.js";
import { pool } from "../db.js";
import { HttpError } from "../errors.js";
import { KINDS, type Kind } from "../kinds.js";

// El componente envía los <select> como string -> coerce.
const bodySchema = z.object({
  code: z.string().trim().min(1).max(30),
  name: z.string().trim().min(1).max(120),
  categoryId: z.coerce.number().int().positive(),
  accountCode: z.string().trim().max(40).nullish(),
  active: z.boolean().optional(),
});

/**
 * Router compatible con createRestAdapter (@joseparedesc/master-crud):
 *  GET /?search=&status=  · GET /:id · POST / · PATCH /:id · PATCH /:id/active
 *  GET /:id/references -> [{description,count}] · DELETE /:id (409 + referencedBy si está en uso)
 * Los ids se devuelven como string porque MasterEntity.id es string.
 */
export function mastersRouter(kind: Kind) {
  const k = KINDS[kind];
  const label = kind === "income" ? "ingresos registrados" : "egresos registrados";
  const select = `SELECT t.id::text AS id, t.code, t.name, t.category_id::text AS "categoryId",
      c.code AS "categoryCode", c.name AS "categoryName", t.account_code AS "accountCode", t.active,
      t.created_at AS "createdAt", COALESCE(t.created_by::text, '') AS "createdBy",
      t.updated_at AS "updatedAt", COALESCE(t.updated_by::text, '') AS "updatedBy"
    FROM ${k.type} t JOIN ${k.cat} c ON c.id = t.category_id`;
  const r = Router();
  const write = requireRole(...MASTER_WRITE_ROLES);

  const getOne = async (id: number) => {
    const { rows } = await pool.query(`${select} WHERE t.id = $1`, [id]);
    if (!rows[0]) throw new HttpError(404, "Registro no encontrado.");
    return rows[0];
  };
  const refCount = async (id: number) => {
    const { rows } = await pool.query(`SELECT count(*)::int AS n FROM ${k.mov} WHERE ${k.fk} = $1`, [id]);
    return rows[0].n as number;
  };
  const referencedBy = (n: number) => (n > 0 ? [{ description: label, count: n }] : []);

  r.get("/", async (req, res) => {
    const search = String(req.query.search ?? "").trim();
    const status = req.query.status === "active" || req.query.status === "inactive" ? req.query.status : "all";
    const { rows } = await pool.query(
      `${select}
       WHERE ($1::text = '' OR t.name ILIKE '%' || $1 || '%' OR t.code ILIKE '%' || $1 || '%')
         AND ($2::text = 'all' OR t.active = ($2::text = 'active'))
       ORDER BY t.name`,
      [search, status],
    );
    res.json(rows);
  });

  r.get("/:id", async (req, res) => {
    res.json(await getOne(Number(req.params.id)));
  });

  r.post("/", write, async (req, res) => {
    const b = bodySchema.parse(req.body);
    // Solo el contador define la cuenta contable
    const account = req.user!.role === "contador" ? b.accountCode || null : null;
    const { rows } = await pool.query(
      `INSERT INTO ${k.type} (code, name, category_id, account_code, active, created_by, updated_by)
       VALUES ($1,$2,$3,$4,$5,$6,$6) RETURNING id`,
      [b.code, b.name, b.categoryId, account, b.active ?? true, req.user!.id],
    );
    res.status(201).json(await getOne(rows[0].id));
  });

  r.patch("/:id", write, async (req, res) => {
    const id = Number(req.params.id);
    const current = await getOne(id);
    const b = bodySchema.partial().parse(req.body);
    if (b.categoryId !== undefined && String(b.categoryId) !== current.categoryId && (await refCount(id)) > 0)
      throw new HttpError(409, "No se puede cambiar la categoría de un registro que ya tiene movimientos.");
    if (b.code !== undefined && b.code !== current.code && (await refCount(id)) > 0)
      throw new HttpError(409, "No se puede cambiar el código de un registro que ya tiene movimientos.");
    const account =
      req.user!.role === "contador" && b.accountCode !== undefined ? b.accountCode || null : current.accountCode;
    await pool.query(
      `UPDATE ${k.type} SET code=$2, name=$3, category_id=$4, account_code=$5, updated_by=$6, updated_at=now() WHERE id=$1`,
      [id, b.code ?? current.code, b.name ?? current.name, b.categoryId ?? current.categoryId, account, req.user!.id],
    );
    res.json(await getOne(id));
  });

  r.patch("/:id/active", write, async (req, res) => {
    const id = Number(req.params.id);
    const { active } = z.object({ active: z.boolean() }).parse(req.body);
    await getOne(id);
    await pool.query(`UPDATE ${k.type} SET active=$2, updated_by=$3, updated_at=now() WHERE id=$1`, [id, active, req.user!.id]);
    res.json(await getOne(id));
  });

  r.get("/:id/references", async (req, res) => {
    res.json(referencedBy(await refCount(Number(req.params.id))));
  });

  r.delete("/:id", write, async (req, res) => {
    const id = Number(req.params.id);
    await getOne(id);
    const n = await refCount(id);
    if (n > 0)
      throw new HttpError(409, "El registro está en uso y no se puede eliminar.", { referencedBy: referencedBy(n) });
    await pool.query(`DELETE FROM ${k.type} WHERE id=$1`, [id]);
    res.status(204).end();
  });

  return r;
}
