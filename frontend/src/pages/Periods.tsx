import { useCallback, useEffect, useState, type FormEvent } from "react";
import { api, download, send } from "../api";
import { useAuth } from "../auth";
import { money, MONTHS, pad, periodLabel } from "../format";
import type { Period, Totals } from "../types";

export default function Periods() {
  const { me } = useAuth();
  const canReopen = me!.role !== "secretario";
  const now = new Date();
  const [periods, setPeriods] = useState<Period[]>([]);
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [summary, setSummary] = useState<{ period: Period; totals: Totals } | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(() => api<Period[]>("/periods").then(setPeriods).catch((e) => setError(e.message)), []);
  useEffect(() => void load(), [load]);

  const run = async (fn: () => Promise<unknown>) => {
    setError("");
    try { await fn(); await load(); } catch (e) { setError((e as Error).message); }
  };

  const open = (e: FormEvent) => { e.preventDefault(); void run(() => send("/periods", "POST", { year, month })); };
  const showSummary = (p: Period) => run(async () => setSummary(await api(`/periods/${p.id}/summary`)));

  return (
    <>
      <h1>Períodos</h1>
      <p className="muted">Puede haber como máximo 2 períodos abiertos a la vez, y deben ser meses consecutivos.</p>
      {error && <p className="error" role="alert">{error}</p>}

      <form className="card toolbar" onSubmit={open}>
        <label>Mes
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
        </label>
        <label>Año
          <input type="number" min={2000} max={2100} value={year} onChange={(e) => setYear(Number(e.target.value))} />
        </label>
        <button className="primary" type="submit">Abrir período</button>
      </form>

      <div className="table-wrap">
        <table>
          <thead><tr><th>Período</th><th>Estado</th><th></th></tr></thead>
          <tbody>
            {periods.map((p) => (
              <tr key={p.id}>
                <td>{periodLabel(p)}</td>
                <td><span className={`badge ${p.status === "OPEN" ? "open" : "closed"}`}>{p.status === "OPEN" ? "Abierto" : "Cerrado"}</span></td>
                <td className="row-actions">
                  {p.status === "OPEN" && <button onClick={() => confirm(`¿Cerrar ${periodLabel(p)}?`) && run(() => send(`/periods/${p.id}/close`, "POST"))}>Cerrar mes</button>}
                  {p.status === "CLOSED" && canReopen && <button onClick={() => run(() => send(`/periods/${p.id}/reopen`, "POST"))}>Reabrir</button>}
                  <button onClick={() => showSummary(p)}>Ver resumen</button>
                  <button onClick={() => run(() => download(`/periods/${p.id}/consolidado.csv`, `consolidado-${p.year}-${pad(p.month)}.csv`))}>Descargar consolidado</button>
                </td>
              </tr>
            ))}
            {!periods.length && <tr><td colSpan={3} className="muted">Abre el primer período para empezar a registrar.</td></tr>}
          </tbody>
        </table>
      </div>

      {summary && (
        <div className="card summary">
          <h2>Resumen de {periodLabel(summary.period)}</h2>
          <dl>
            <dt>Intenciones</dt><dd>{money(summary.totals.intencion)}</dd>
            <dt>Donaciones</dt><dd>{money(summary.totals.donacion)}</dd>
            <dt>Total ingresos</dt><dd><strong>{money(summary.totals.ingresos)}</strong></dd>
            <dt>Servicios</dt><dd>{money(summary.totals.servicio)}</dd>
            <dt>Gastos</dt><dd>{money(summary.totals.gasto)}</dd>
            <dt>Total egresos</dt><dd><strong>{money(summary.totals.egresos)}</strong></dd>
            <dt>Saldo</dt><dd><strong>{money(summary.totals.saldo)}</strong></dd>
          </dl>
        </div>
      )}
    </>
  );
}
