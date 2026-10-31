import { Download } from "lucide-react";
import { useEffect, useState } from "react";
import { api, download } from "../../api";
import { Alert, Button, Select } from "../../components/ui";
import { money, pad, periodLabel } from "../../format";
import { printReport } from "../../lib/print";
import type { Consolidado, Period, ReportTotals } from "../../types";
import { FilterBar } from "./ReportActions";
import { ReportSheet } from "./ReportSheet";
import { ReportTable } from "./ReportTable";

const section = (rows: Consolidado["incomes"], a: string, b: string): ReportTotals => {
  const mk = (code: string, name: string) => { const r = rows.filter((x) => x.category === code); return { code, name, count: r.length, total: Math.round(r.reduce((s, x) => s + x.amount, 0) * 100) / 100 }; };
  return { count: rows.length, total: Math.round(rows.reduce((s, x) => s + x.amount, 0) * 100) / 100, byCategory: [mk(a, a === "INTENCION" ? "Intenciones" : "Servicios"), mk(b, b === "DONACION" ? "Donaciones" : "Gastos")] };
};

function Totals({ t, label }: { t: ReportTotals; label: string }) {
  return (
    <dl className="ml-auto mt-3 grid w-full max-w-xs grid-cols-[1fr_auto] gap-x-6 gap-y-1.5 text-sm print:break-inside-avoid">
      {t.byCategory.map((c) => <div key={c.code} className="contents"><dt className="text-muted">{c.name} ({c.count})</dt><dd className="text-right tabular-nums">{money(c.total)}</dd></div>)}
      <dt className="border-t border-line pt-1.5 font-semibold">{label}</dt>
      <dd className="border-t border-line pt-1.5 text-right font-semibold tabular-nums">{money(t.total)}</dd>
    </dl>
  );
}

/** Consolidado de un mes: ingresos, egresos y saldo. */
export function MonthlyReport() {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [periodId, setPeriodId] = useState("");
  const [data, setData] = useState<Consolidado | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api<Period[]>("/periods").then((ps) => { setPeriods(ps); if (ps[0]) setPeriodId(String(ps[0].id)); }).catch((e) => setError(e.message));
  }, []);

  async function run(id = periodId) {
    if (!id) return;
    setLoading(true);
    setError("");
    try { setData(await api<Consolidado>(`/periods/${id}/consolidado`)); } catch (e) { setError((e as Error).message); } finally { setLoading(false); }
  }
  useEffect(() => void run(), [periodId]); // eslint-disable-line react-hooks/exhaustive-deps

  const p = data?.period;
  const title = p ? `Consolidado de ${periodLabel(p)}` : "Consolidado mensual";

  return (
    <div className="space-y-5">
      <FilterBar onRun={() => run()} onPrint={() => printReport(`Consolidado ${p?.year}-${pad(p?.month ?? 0)}`)} loading={loading} canPrint={!!data} error={error}>
        <Select label="Mes" value={periodId} onChange={(e) => setPeriodId(e.target.value)} className="w-56">
          {periods.map((x) => <option key={x.id} value={x.id}>{periodLabel(x)} · {x.status === "OPEN" ? "abierto" : "cerrado"}</option>)}
        </Select>
        {p && <Button onClick={() => download(`/periods/${p.id}/consolidado.csv`, `consolidado-${p.year}-${pad(p.month)}.csv`)}><Download className="h-4 w-4" aria-hidden="true" />CSV</Button>}
      </FilterBar>
      {!periods.length && <Alert tone="info" className="print:hidden">Aún no hay períodos para reportar.</Alert>}
      {data && p && (
        <ReportSheet title={title} subtitle={p.status === "OPEN" ? "Período abierto: las cifras pueden cambiar" : "Período cerrado"}>
          <h3 className="mb-2 text-lg">Ingresos</h3>
          <ReportTable rows={data.incomes} columns={["date", "type", "category", "account", "intentionDate", "description"]} />
          {data.incomes.length > 0 && <Totals t={section(data.incomes, "INTENCION", "DONACION")} label="Total ingresos" />}
          <h3 className="mb-2 mt-8 text-lg">Egresos</h3>
          <ReportTable rows={data.expenses} columns={["date", "type", "category", "account", "description"]} />
          {data.expenses.length > 0 && <Totals t={section(data.expenses, "SERVICIO", "GASTO")} label="Total egresos" />}
          <div className="mt-8 flex items-baseline justify-between rounded-lg border border-line bg-mist/60 px-5 py-4 print:break-inside-avoid">
            <span className="font-serif text-lg">Saldo del período</span>
            <span className="font-serif text-2xl font-semibold tabular-nums text-primary">{money(data.totals.saldo)}</span>
          </div>
        </ReportSheet>
      )}
    </div>
  );
}
