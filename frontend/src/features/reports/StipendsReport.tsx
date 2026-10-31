import { FileX2 } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../../api";
import { EmptyState, Input, Select } from "../../components/ui";
import { monthStart, money, today } from "../../format";
import { printStipendReceipts } from "../../lib/printStipends";
import { useParish } from "../../parish";
import type { StipendsResult } from "../../types";
import { StipendSheet } from "../stipends/StipendReceipt";
import { FilterBar } from "./ReportActions";
import { periodRangeText } from "./ReportSheet";

/** Reporte de estipendios: un comprobante por estipendio, con el mismo formato de impresión del listado de ingresos. */
export function StipendsReport() {
  const { parish } = useParish();
  const [from, setFrom] = useState(monthStart());
  const [to, setTo] = useState(today());
  const [by, setBy] = useState<"intention" | "registered">("intention");
  const [result, setResult] = useState<StipendsResult | null>(null);
  const [subtitle, setSubtitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function run() {
    setLoading(true);
    setError("");
    try {
      setResult(await api<StipendsResult>(`/reports/stipends?${new URLSearchParams({ from, to, by })}`));
      setSubtitle(`${periodRangeText(from, to)} · por fecha de ${by === "intention" ? "realización" : "registro"}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => void run(), []); // eslint-disable-line react-hooks/exhaustive-deps

  const rows = result?.rows ?? [];
  return (
    <div className="space-y-5">
      <FilterBar onRun={run} onPrint={() => void printStipendReceipts(rows, parish, `Estipendios ${from} a ${to}`)} loading={loading} canPrint={rows.length > 0} error={error}>
        <Input label="Desde" type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} />
        <Input label="Hasta" type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} />
        <Select label="Filtrar por fecha de" value={by} onChange={(e) => setBy(e.target.value as typeof by)} className="w-52">
          <option value="intention">Realización de la intención</option>
          <option value="registered">Registro del ingreso</option>
        </Select>
      </FilterBar>
      {result && !rows.length && <EmptyState icon={FileX2} title="Sin estipendios">No hay estipendios para los filtros elegidos.</EmptyState>}
      {rows.length > 0 && (
        <>
          <p className="text-sm text-muted">{result!.totals.count} estipendio(s) · {subtitle} · Total {money(result!.totals.total)}. «Imprimir» saca un comprobante de media hoja carta por estipendio, dos por hoja.</p>
          <StipendSheet rows={rows} parish={parish} />
        </>
      )}
    </div>
  );
}
