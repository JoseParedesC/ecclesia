import { pool } from "../db.js";
import { HttpError } from "../errors.js";
import { KINDS, type Kind } from "../kinds.js";

const r2 = (n: number) => Math.round(n * 100) / 100;

interface Row {
  id: number; date: string; type: string; category: string; categoryName: string;
  account: string | null; intentionDate: string | null; description: string | null; amount: number;
  responsible: string | null; idType: string | null; idNumber: string | null;
}

async function rowsFor(kind: Kind, periodId: number): Promise<Row[]> {
  const k = KINDS[kind];
  const intention = kind === "income" ? "m.intention_date" : "NULL::date";
  const { rows } = await pool.query(
    `SELECT m.id, m.date, t.name AS type, c.code AS category, c.name AS "categoryName",
            t.account_code AS account, ${intention} AS "intentionDate", m.description, m.amount,
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
  const totals = {
    estipendio: sum(incomes, "ESTIPENDIO"),
    donacion: sum(incomes, "DONACION"),
    ingresos,
    servicio: sum(expenses, "SERVICIO"),
    gasto: sum(expenses, "GASTO"),
    egresos,
    saldo: r2(ingresos - egresos),
  };
  return { period: rows[0] as { id: number; year: number; month: number; status: string }, incomes, expenses, totals };
}

const esc = (v: unknown) => {
  const s = v == null ? "" : String(v);
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const line = (...cells: unknown[]) => cells.map(esc).join(";");

/** CSV con ';' y BOM (se abre bien en Excel en configuración regional en español). */
export function consolidadoToCsv(d: Awaited<ReturnType<typeof buildConsolidado>>) {
  const head = ["Fecha", "Tipo", "Categoría", "Cuenta contable", "Fecha de realización", "Responsable", "Identificación", "Descripción", "Monto"];
  const body = (list: Row[]) =>
    list.map((r) => line(r.date, r.type, r.categoryName, r.account, r.intentionDate, r.responsible, r.idType ? `${r.idType} ${r.idNumber ?? ""}`.trim() : "", r.description, r.amount));
  const t = d.totals;
  const tot = (label: string, v: number) => line(label, "", "", "", "", "", "", "", v);
  return [
    line(`Consolidado ${d.period.year}-${String(d.period.month).padStart(2, "0")}`, `Estado: ${d.period.status}`),
    "",
    line("INGRESOS"), line(...head), ...body(d.incomes),
    tot("Total estipendios", t.estipendio), tot("Total donaciones", t.donacion), tot("TOTAL INGRESOS", t.ingresos),
    "",
    line("EGRESOS"), line(...head), ...body(d.expenses),
    tot("Total servicios", t.servicio), tot("Total gastos", t.gasto), tot("TOTAL EGRESOS", t.egresos),
    "",
    tot("SALDO DEL PERÍODO", t.saldo),
  ].join("\r\n");
}
