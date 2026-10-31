import { useCallback, useEffect, useState } from "react";
import { api, download, send } from "../api";
import { useAuth } from "../auth";
import { PageHeader } from "../components/layout/PageHeader";
import { Alert, useConfirm, useToast } from "../components/ui";
import { pad, periodLabel } from "../format";
import { OpenPeriodForm } from "../features/periods/OpenPeriodForm";
import { PeriodSummary } from "../features/periods/PeriodSummary";
import { PeriodsTable } from "../features/periods/PeriodsTable";
import type { Period, Totals } from "../types";

export default function Periods() {
  const { me } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const [periods, setPeriods] = useState<Period[]>([]);
  const [summary, setSummary] = useState<{ period: Period; totals: Totals } | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(() => api<Period[]>("/periods").then(setPeriods).catch((e) => setError(e.message)), []);
  useEffect(() => void load(), [load]);

  const loadSummary = (p: Period) => api<{ period: Period; totals: Totals }>(`/periods/${p.id}/summary`).then(setSummary);

  async function run(fn: () => Promise<unknown>, ok: string, id: number | null = null) {
    setError("");
    setBusyId(id);
    try {
      await fn();
      toast.success(ok);
      await load();
      if (summary) await loadSummary(summary.period);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  const open = async (year: number, month: number) => {
    setOpening(true);
    await run(() => send("/periods", "POST", { year, month }), "Período abierto");
    setOpening(false);
  };

  const close = async (p: Period) => {
    const ok = await confirm({ title: `Cerrar ${periodLabel(p)}`, message: "Ya no se podrán registrar ni modificar movimientos de este mes hasta que alguien con permiso lo reabra.", confirmLabel: "Cerrar mes" });
    if (ok) run(() => send(`/periods/${p.id}/close`, "POST"), "Período cerrado", p.id);
  };

  return (
    <>
      <PageHeader title="Períodos" description="Puede haber como máximo 2 períodos abiertos a la vez, y deben ser meses consecutivos." />
      <div className="space-y-5">
        {error && <Alert tone="error">{error}</Alert>}
        <OpenPeriodForm onOpen={open} busy={opening} />
        <PeriodsTable
          periods={periods} canReopen={me!.role !== "secretario"} busyId={busyId}
          onClose={close}
          onReopen={(p) => run(() => send(`/periods/${p.id}/reopen`, "POST"), "Período reabierto", p.id)}
          onSummary={(p) => loadSummary(p).catch((e) => setError(e.message))}
          onDownload={(p) => run(() => download(`/periods/${p.id}/consolidado.csv`, `consolidado-${p.year}-${pad(p.month)}.csv`), "Consolidado descargado")}
        />
        {summary && <PeriodSummary key={summary.period.id} period={summary.period} totals={summary.totals} />}
      </div>
    </>
  );
}
