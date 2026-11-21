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
const typeTable = (kind: string) => (kind === "income" ? "income_types" : "expense_types");
/** Categorías que el código usa por su código (comprobantes de estipendio): no se pueden renombrar ni borrar. */
const PROTECTED = ["ESTIPENDIO"];
const SEL = (t: string) => {
  const tt = t === "income_categories" ? "income_types" : "expense_types";
  return `SELECT c.id, c.code, c.name, c.has_default_amount AS "hasDefaultAmount",
  c.default_amount_editable AS "defaultAmountEditable", c.uses_date AS "usesDate", c.date_required AS "dateRequired",
  (SELECT count(*)::int FROM ${tt} x WHERE x.category_id = c.id) AS "typeCount",
  (c.code = ANY($$PROT$$)) AS "protected" FROM ${t} c`.replace("$$PROT$$", `ARRAY[${PROTECTED.map((x) => `'${x}'`).join(",")}]`);
};

const slug = (name: string) =>
  name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 24) || "CATEGORIA";

async function assertNameFree(t: string, name: string, exceptId = 0) {
  const { rows } = await pool.query(`SELECT 1 FROM ${t} WHERE lower(name) = lower($1) AND id <> $2`, [name, exceptId]);
  if (rows[0]) throw new HttpError(409, "Ya existe una categoría con ese nombre.");
}

categoriesRouter.get("/:kind", async (req, res) => {
  res.json((await pool.query(`${SEL(table(String(req.params.kind)))} ORDER BY c.id`)).rows);
});

const nameField = z.string({ required_error: "El nombre es obligatorio" }).trim().min(1, "El nombre es obligatorio").max(60, "Máximo 60 caracteres");
const body = z.object({
  name: nameField.optional(),
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
  const current = (await pool.query(`SELECT code, date_required FROM ${t} WHERE id=$1`, [categoryId])).rows[0];
  if (!current) throw new HttpError(404, "Categoría no encontrada.");
  if (b.name !== undefined) {
    if (PROTECTED.includes(current.code)) throw new HttpError(409, "El nombre de esta categoría no se puede cambiar porque el sistema la usa en los comprobantes.");
    await assertNameFree(t, b.name, categoryId);
  }
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
    `UPDATE ${t} SET has_default_amount=$2, default_amount_editable=$3, uses_date=$4, date_required=$5, name=COALESCE($6, name) WHERE id=$1 RETURNING id`,
    [categoryId, b.hasDefaultAmount, editable, b.usesDate, required, b.name ?? null],
  );
  if (!rows[0]) throw new HttpError(404, "Categoría no encontrada.");
  // Sin valor sugerido en la categoría, sus tipos no conservan uno
  if (!b.hasDefaultAmount) {
    const tt = req.params.kind === "income" ? "income_types" : "expense_types";
    await pool.query(`UPDATE ${tt} SET default_amount=NULL WHERE category_id=$1`, [rows[0].id]);
  }
  res.json({ ...(await pool.query(`${SEL(t)} WHERE c.id=$1`, [rows[0].id])).rows[0], missingEventDateCount });
});

// Crear categoría: el código se genera a partir del nombre y no cambia después
categoriesRouter.post("/:kind", requireRole(...MASTER_WRITE_ROLES), async (req, res) => {
  const t = table(String(req.params.kind));
  const b = body.extend({ name: nameField }).parse(req.body);
  await assertNameFree(t, b.name);
  const base = slug(b.name);
  let code = base;
  for (let i = 2; (await pool.query(`SELECT 1 FROM ${t} WHERE code=$1`, [code])).rows[0]; i++) code = `${base}_${i}`;
  const { rows } = await pool.query(
    `INSERT INTO ${t} (code, name, has_default_amount, default_amount_editable, uses_date, date_required) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
    [code, b.name, b.hasDefaultAmount, b.hasDefaultAmount ? b.defaultAmountEditable : true, b.usesDate, b.usesDate ? b.dateRequired : false],
  );
  res.status(201).json({ ...(await pool.query(`${SEL(t)} WHERE c.id=$1`, [rows[0].id])).rows[0], missingEventDateCount: 0 });
});

// Eliminar: solo si no tiene tipos asociados
categoriesRouter.delete("/:kind/:id", requireRole(...MASTER_WRITE_ROLES), async (req, res) => {
  const kind = String(req.params.kind);
  const t = table(kind);
  const id = Number(req.params.id);
  const cur = (await pool.query(`SELECT code FROM ${t} WHERE id=$1`, [id])).rows[0];
  if (!cur) throw new HttpError(404, "Categoría no encontrada.");
  if (PROTECTED.includes(cur.code)) throw new HttpError(409, "Esta categoría la usa el sistema y no se puede eliminar.");
  const n = (await pool.query(`SELECT count(*)::int AS n FROM ${typeTable(kind)} WHERE category_id=$1`, [id])).rows[0].n;
  if (n > 0) throw new HttpError(409, `La categoría tiene ${n} tipo(s) asociado(s). Muévelos a otra categoría o elimínalos primero.`);
  await pool.query(`DELETE FROM ${t} WHERE id=$1`, [id]);
  res.status(204).end();
});
