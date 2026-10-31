import { useEffect, useState } from "react";
import { api } from "../../api";
import { Input, Select } from "../../components/ui";
import { monthStart, today } from "../../format";
import { printReport } from "../../lib/print";
import type { Category, ReportResult, TypeRow } from "../../types";
import { FilterBar } from "./ReportActions";
import { ReportSheet, TotalsBlock, periodRangeText } from "./ReportSheet";
import { ReportTable } from "./ReportTable";

/** Ingresos o egresos, filtrados por rango de fechas, categoría y tipo. */
export function MovementsReport({ kind }: { kind: "income" | "expense" }) {
  const isIncome = kind === "income";
  const [from, setFrom] = useState(monthStart());
  const [to, setTo] = useState(today());
  const [categoryId, setCategoryId] = useState("");
  const [typeId, setTypeId] = useState("");
  const [cats, setCats] = useState<Category[]>([]);
  const [types, setTypes] = useState<TypeRow[]>([]);
  const [result, setResult] = useState<ReportResult | null>(null);
  const [subtitle, setSubtitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const title = isIncome ? "Reporte de ingresos" : "Reporte de egresos";

  async function run() {
    setLoading(true);
    setError("");
    try {
      const q = new URLSearchParams({ kind, from, to, categoryId, typeId });
      setResult(await api<ReportResult>(`/reports/movements?${q}`));
      const parts = [periodRangeText(from, to)];
      const cat = cats.find((c) => String(c.id) === categoryId);
      const typ = types.find((t) => t.id === typeId);
      if (cat) parts.push(`Categoría: ${cat.name}`);
      if (typ) parts.push(`Tipo: ${typ.name}`);
      setSubtitle(parts.join(" · "));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    Promise.all([api<Category[]>(`/categories/${kind}`), api<TypeRow[]>(isIncome ? "/income-types" : "/expense-types")])
      .then(([c, t]) => { setCats(c); setTypes(t); })
      .catch((e) => setError(e.message));
    void run();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const typeOptions = types.filter((t) => !categoryId || t.categoryId === categoryId);

  return (
    <div className="space-y-5">
      <FilterBar onRun={run} onPrint={() => printReport(`${title} ${from} a ${to}`)} loading={loading} canPrint={!!result?.rows.length} error={error}>
        <Input label="Desde" type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} />
        <Input label="Hasta" type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} />
        <Select label="Categoría" value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setTypeId(""); }} className="w-44">
          <option value="">Todas</option>
          {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
        <Select label="Tipo" value={typeId} onChange={(e) => setTypeId(e.target.value)} className="w-52">
          <option value="">Todos</option>
          {typeOptions.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </Select>
      </FilterBar>
      {result && (
        <ReportSheet title={title} subtitle={subtitle}>
          <ReportTable rows={result.rows} columns={isIncome ? ["date", "type", "category", "account", "intentionDate", "responsible", "identification", "description"] : ["date", "type", "category", "account", "responsible", "identification", "description"]} />
          {result.rows.length > 0 && <TotalsBlock totals={result.totals} />}
        </ReportSheet>
      )}
    </div>
  );
}
