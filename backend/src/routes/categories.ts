import { Router } from "express";
import { z } from "zod";
import { MASTER_WRITE_ROLES, requireRole } from "../auth.js";
import { pool } from "../db.js";
import { HttpError } from "../errors.js";

/** Configuración por categoría: valor sugerido, si se puede cambiar, si maneja fecha y si es obligatoria. */
export const categoriesRouter = Router();
const table = (kind: string) => {
  if (kind !== "income" && kind !== "expense") throw new HttpError(404, "Recurso no encontrado.");
  return kind === "income" ? "income_categories" : "expense_categories";
};
const SEL = (t: string) => `SELECT id, code, name, has_default_amount AS "hasDefaultAmount",
  default_amount_editable AS "defaultAmountEditable", uses_date AS "usesDate", date_required AS "dateRequired" FROM ${t}`;

categoriesRouter.get("/:kind", async (req, res) => {
  res.json((await pool.query(`${SEL(table(String(req.params.kind)))} ORDER BY id`)).rows);
});

const body = z.object({
  hasDefaultAmount: z.boolean(), defaultAmountEditable: z.boolean(),
  usesDate: z.boolean(), dateRequired: z.boolean(),
});

categoriesRouter.patch("/:kind/:id", requireRole(...MASTER_WRITE_ROLES), async (req, res) => {
  const t = table(String(req.params.kind));
  const b = body.parse(req.body);
  const kind = String(req.params.kind);
  const movementTable = kind === "income" ? "incomes" : "expenses";
  const typeTable = kind === "income" ? "income_types" : "expense_types";
  const categoryId = Number(req.params.id);
  const current = (await pool.query(`SELECT date_required FROM ${t} WHERE id=$1`, [categoryId])).rows[0];
  if (!current) throw new HttpError(404, "Categoría no encontrada.");
  let missingEventDateCount = 0;
  if (b.usesDate && b.dateRequired && !current.date_required) {
    const count = await pool.query(
      `SELECT count(*)::int AS count FROM ${movementTable} m JOIN ${typeTable} ty ON ty.id=m.${kind === "income" ? "income_type_id" : "expense_type_id"} WHERE ty.category_id=$1 AND m.event_date IS NULL`,
      [categoryId],
    );
    missingEventDateCount = count.rows[0].count;
  }
  // Coherencia: las opciones dependientes se apagan con su interruptor padre
  const editable = b.hasDefaultAmount ? b.defaultAmountEditable : true;
  const required = b.usesDate ? b.dateRequired : false;
  const { rows } = await pool.query(
    `UPDATE ${t} SET has_default_amount=$2, default_amount_editable=$3, uses_date=$4, date_required=$5 WHERE id=$1 RETURNING id`,
    [categoryId, b.hasDefaultAmount, editable, b.usesDate, required],
  );
  if (!rows[0]) throw new HttpError(404, "Categoría no encontrada.");
  // Sin valor sugerido en la categoría, sus tipos no conservan uno
  if (!b.hasDefaultAmount) {
    const tt = req.params.kind === "income" ? "income_types" : "expense_types";
    await pool.query(`UPDATE ${tt} SET default_amount=NULL WHERE category_id=$1`, [rows[0].id]);
  }
  res.json({ ...(await pool.query(`${SEL(t)} WHERE id=$1`, [rows[0].id])).rows[0], missingEventDateCount });
});
