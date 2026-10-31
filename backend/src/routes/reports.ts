import { Router } from "express";
import { z } from "zod";
import { pool } from "../db.js";
import { KINDS } from "../kinds.js";

export const reportsRouter = Router(); // todos los roles autenticados

const r2 = (n: number) => Math.round(n * 100) / 100;
const opt = <T extends z.ZodTypeAny>(s: T) => z.preprocess((v) => (v === "" ? undefined : v), s.optional());
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida (AAAA-MM-DD)");
const rangeOk = (q: { from?: string; to?: string }) => !q.from || !q.to || q.from <= q.to;
const rangeMsg = { message: "La fecha inicial no puede ser posterior a la final." };

interface Row { amount: number; category: string; categoryName: string }
function summarize<T extends Row>(rows: T[]) {
  const map = new Map<string, { code: string; name: string; count: number; total: number }>();
  for (const r of rows) {
    const e = map.get(r.category) ?? { code: r.category, name: r.categoryName, count: 0, total: 0 };
    e.count += 1;
    e.total = r2(e.total + r.amount);
    map.set(r.category, e);
  }
  return { count: rows.length, total: r2(rows.reduce((a, r) => a + r.amount, 0)), byCategory: [...map.values()] };
}

// Ingresos o egresos con filtros: rango de fechas, categoría y tipo
const movementsQ = z
  .object({
    kind: z.enum(["income", "expense"]),
    from: opt(isoDate), to: opt(isoDate),
    categoryId: opt(z.coerce.number().int().positive()),
    typeId: opt(z.coerce.number().int().positive()),
  })
  .refine(rangeOk, rangeMsg);

reportsRouter.get("/movements", async (req, res) => {
  const q = movementsQ.parse(req.query);
  const k = KINDS[q.kind];
  const intention = q.kind === "income" ? "m.intention_date" : "NULL::date";
  const { rows } = await pool.query(
    `SELECT m.id, m.date, t.name AS type, c.code AS category, c.name AS "categoryName",
            t.account_code AS account, m.description, ${intention} AS "intentionDate", m.amount,
            m.responsible_name AS responsible, m.id_type AS "idType", m.id_number AS "idNumber"
       FROM ${k.mov} m JOIN ${k.type} t ON t.id = m.${k.fk} JOIN ${k.cat} c ON c.id = t.category_id
      WHERE ($1::date IS NULL OR m.date >= $1) AND ($2::date IS NULL OR m.date <= $2)
        AND ($3::int IS NULL OR t.category_id = $3) AND ($4::int IS NULL OR m.${k.fk} = $4)
      ORDER BY m.date, m.id`,
    [q.from ?? null, q.to ?? null, q.categoryId ?? null, q.typeId ?? null],
  );
  res.json({ rows, totals: summarize(rows) });
});

// Intenciones por rango de fechas: por fecha de realización (por defecto) o de registro
const intentionsQ = z
  .object({ from: opt(isoDate), to: opt(isoDate), by: z.enum(["intention", "registered"]).default("intention") })
  .refine(rangeOk, rangeMsg);

reportsRouter.get("/intentions", async (req, res) => {
  const q = intentionsQ.parse(req.query);
  const field = q.by === "intention" ? "m.intention_date" : "m.date"; // lista blanca, no viene del cliente
  const { rows } = await pool.query(
    `SELECT m.id, m.date, m.intention_date AS "intentionDate", t.name AS type, c.code AS category,
            c.name AS "categoryName", m.description, m.amount
       FROM incomes m JOIN income_types t ON t.id = m.income_type_id JOIN income_categories c ON c.id = t.category_id
      WHERE c.code = 'INTENCION' AND ($1::date IS NULL OR ${field} >= $1) AND ($2::date IS NULL OR ${field} <= $2)
      ORDER BY m.intention_date, m.id`,
    [q.from ?? null, q.to ?? null],
  );
  res.json({ rows, totals: summarize(rows) });
});
