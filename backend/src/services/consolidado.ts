import { pool } from "../db.js";
import { HttpError } from "../errors.js";
import { KINDS, type Kind } from "../kinds.js";

const r2 = (n: number) => Math.round(n * 100) / 100;

interface Row {
  id: number; date: string; type: string; category: string; categoryName: string;
  account: string | null; eventDate: string | null; description: string | null; amount: number; fixedAmount: boolean; usesDate: boolean;
  responsible: string | null; idType: string | null; idNumber: string | null;
}

async function rowsFor(kind: Kind, periodId: number): Promise<Row[]> {
  const k = KINDS[kind];
  const intention = "m.event_date";
  const { rows } = await pool.query(
    `SELECT m.id, m.date, t.name AS type, c.code AS category, c.name AS "categoryName",
            t.account_code AS account, ${intention} AS "eventDate", m.description, m.amount,
            (c.has_default_amount AND NOT c.default_amount_editable) AS "fixedAmount",
            c.uses_date AS "usesDate",
            m.responsible_name AS responsible, m.id_type AS "idType", m.id_number AS "idNumber"
       FROM ${k.mov} m JOIN ${k.type} t ON t.id = m.${k.fk} JOIN ${k.cat} c ON c.id = t.category_id
      WHERE m.period_id = $1 ORDER BY m.date, m.id`,
    [periodId],
  );
  return rows;
}

export async function buildConsolidado(periodId: number) {
  const { rows } = await pool.query("SELECT id, year, month, status FROM periods WHERE id = $1", [periodId]);
  if (!rows[0]) throw new HttpError(404, "Período no encontrado.");
  const [incomes, expenses] = await Promise.all([rowsFor("income", periodId), rowsFor("expense", periodId)]);
  const sum = (list: Row[], cat?: string) =>
    r2(list.filter((r) => !cat || r.category === cat).reduce((a, r) => a + r.amount, 0));
  const ingresos = sum(incomes);
  const egresos = sum(expenses);
  const categoriesFor = async (kind: Kind) => {
    const table = kind === "income" ? "income_categories" : "expense_categories";
    const { rows } = await pool.query(`SELECT code, name, uses_date AS "usesDate" FROM ${table} ORDER BY id`);
    return rows as { code: string; name: string; usesDate: boolean }[];
  };
  const [incomeCategories, expenseCategories] = await Promise.all([categoriesFor("income"), categoriesFor("expense")]);
  const categoryTotals = (list: Row[], cats: { code: string; name: string; usesDate: boolean }[]) => cats.map((c) => {
    const matching = list.filter((r) => r.category === c.code);
    return { code: c.code, name: c.name, count: matching.length, total: sum(list, c.code) };
  });
  const totals = {
    ingresos, egresos, saldo: r2(ingresos - egresos),
    incomeByCategory: categoryTotals(incomes, incomeCategories),
    expenseByCategory: categoryTotals(expenses, expenseCategories),
    // Compatibilidad con consumidores anteriores; los totales dinámicos son la fuente oficial.
    estipendio: sum(incomes, "ESTIPENDIO"), donacion: sum(incomes, "DONACION"),
    servicio: sum(expenses, "SERVICIO"), gasto: sum(expenses, "GASTO"),
  };
  return { period: rows[0] as { id: number; year: number; month: number; status: string }, incomes, expenses, incomeCategories, expenseCategories, totals };
}

const esc = (v: unknown) => {
  const s = v == null ? "" : String(v);
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const line = (...cells: unknown[]) => cells.map(esc).join(";");

/** CSV con ';' y BOM (se abre bien en Excel en configuración regional en español). */
export function consolidadoToCsv(d: Awaited<ReturnType<typeof buildConsolidado>>) {
  const head = ["Fecha", "Tipo", "Categoría", "Cuenta contable", "Fecha asociada", "Responsable", "Identificación", "Descripción", "Valor fijo", "Monto"];
  const body = (list: Row[]) =>
    list.map((r) => line(r.date, r.type, r.categoryName, r.account, r.eventDate, r.responsible, r.idType ? `${r.idType} ${r.idNumber ?? ""}`.trim() : "", r.description, r.fixedAmount ? "Sí" : "No", r.amount));
  const t = d.totals;
  const tot = (label: string, v: number) => line(label, "", "", "", "", "", "", "", "", v);
  const categoryLines = (items: { name: string; count: number; total: number }[]) => items.map((c) => tot(`Total ${c.name} (${c.count})`, c.total));
  return [
    line(`Consolidado ${d.period.year}-${String(d.period.month).padStart(2, "0")}`, `Estado: ${d.period.status}`),
    "",
    line("INGRESOS"), line(...head), ...body(d.incomes),
    ...categoryLines(t.incomeByCategory), tot("TOTAL INGRESOS", t.ingresos),
    "",
    line("EGRESOS"), line(...head), ...body(d.expenses),
    ...categoryLines(t.expenseByCategory), tot("TOTAL EGRESOS", t.egresos),
    "",
    tot("SALDO DEL PERÍODO", t.saldo),
  ].join("\r\n");
}
