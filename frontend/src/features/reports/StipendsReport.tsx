import { useEffect, useState } from "react";
import { api } from "../../api";
import { Input, Select } from "../../components/ui";
import { monthStart, today } from "../../format";
import { printReport } from "../../lib/print";
import type { ReportResult } from "../../types";
import { FilterBar } from "./ReportActions";
import { ReportSheet, TotalsBlock, periodRangeText } from "./ReportSheet";
import { ReportTable } from "./ReportTable";

/** Estipendios por rango de fechas (por fecha de realización de la intención o de registro). */
export function StipendsReport() {
  const [from, setFrom] = useState(monthStart());
  const [to, setTo] = useState(today());
  const [by, setBy] = useState<"intention" | "registered">("intention");
  const [result, setResult] = useState<ReportResult | null>(null);
  const [subtitle, setSubtitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function run() {
    setLoading(true);
    setError("");
    try {
      setResult(await api<ReportResult>(`/reports/stipends?${new URLSearchParams({ from, to, by })}`));
      setSubtitle(`${periodRangeText(from, to)} · por fecha de ${by === "intention" ? "realización" : "registro"}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => void run(), []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-5">
      <FilterBar onRun={run} onPrint={() => printReport(`Estipendios ${from} a ${to}`)} loading={loading} canPrint={!!result?.rows.length} error={error}>
        <Input label="Desde" type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} />
        <Input label="Hasta" type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} />
        <Select label="Filtrar por fecha de" value={by} onChange={(e) => setBy(e.target.value as typeof by)} className="w-52">
          <option value="intention">Realización de la intención</option>
          <option value="registered">Registro del ingreso</option>
        </Select>
      </FilterBar>
      {result && (
        <ReportSheet title="Reporte de estipendios" subtitle={subtitle}>
          <ReportTable rows={result.rows} columns={["intentionDate", "date", "type", "description"]} />
          {result.rows.length > 0 && <TotalsBlock totals={result.totals} label="Total estipendios" />}
        </ReportSheet>
      )}
    </div>
  );
}
