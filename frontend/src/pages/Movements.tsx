import { useCallback, useEffect, useState } from "react";
import { api, send } from "../api";
import { PageHeader } from "../components/layout/PageHeader";
import { Alert, Select, useConfirm, useToast } from "../components/ui";
import { MovementForm, type MovementInput } from "../features/movements/MovementForm";
import { MovementsTable } from "../features/movements/MovementsTable";
import { money, periodLabel } from "../format";
import type { Movement, Period, TypeRow } from "../types";

export default function Movements({ kind }: { kind: "incomes" | "expenses" }) {
  const isIncome = kind === "incomes";
  const toast = useToast();
  const confirm = useConfirm();
  const [periods, setPeriods] = useState<Period[]>([]);
  const [types, setTypes] = useState<TypeRow[]>([]);
  const [rows, setRows] = useState<Movement[]>([]);
  const [periodId, setPeriodId] = useState<number | null>(null);
  const [editing, setEditing] = useState<Movement | null>(null);
  const [error, setError] = useState("");

  const period = periods.find((p) => p.id === periodId) ?? null;
  const total = rows.reduce((a, r) => a + r.amount, 0);

  useEffect(() => {
    setPeriodId(null);
    Promise.all([api<Period[]>("/periods"), api<TypeRow[]>(isIncome ? "/income-types" : "/expense-types")])
      .then(([ps, ts]) => {
        setPeriods(ps);
        setTypes(ts);
        setPeriodId((ps.find((p) => p.status === "OPEN") ?? ps[0])?.id ?? null);
      })
      .catch((e) => setError(e.message));
  }, [isIncome]);

  const load = useCallback(() => {
    if (periodId === null) return setRows([]);
    api<Movement[]>(`/${kind}?periodId=${periodId}`).then(setRows).catch((e) => setError(e.message));
  }, [kind, periodId]);
  useEffect(load, [load]);
  useEffect(() => setEditing(null), [periodId]);

  async function save(body: MovementInput) {
    await (editing ? send(`/${kind}/${editing.id}`, "PATCH", body) : send(`/${kind}`, "POST", body));
    toast.success(editing ? "Cambios guardados" : "Registro creado");
    setEditing(null);
    load();
  }

  async function remove(m: Movement) {
    const ok = await confirm({ title: "Eliminar registro", message: `Se eliminará ${m.typeName} por ${money(m.amount)}. Esta acción no se puede deshacer.`, confirmLabel: "Eliminar", tone: "danger" });
    if (!ok) return;
    try { await send(`/${kind}/${m.id}`, "DELETE"); toast.success("Registro eliminado"); load(); } catch (e) { setError((e as Error).message); }
  }

  return (
    <>
      <PageHeader
        title={isIncome ? "Ingresos" : "Egresos"}
        description={period ? `Total del período: ${money(total)}` : undefined}
        actions={
          periods.length > 0 && (
            <Select label="Período" value={periodId ?? ""} onChange={(e) => setPeriodId(Number(e.target.value))} className="w-56">
              {periods.map((p) => <option key={p.id} value={p.id}>{periodLabel(p)} · {p.status === "OPEN" ? "abierto" : "cerrado"}</option>)}
            </Select>
          )
        }
      />
      <div className="space-y-5">
        {error && <Alert tone="error">{error}</Alert>}
        {!periods.length && <Alert tone="info">Aún no hay períodos. Abre el primero en la sección Períodos.</Alert>}
        {period?.status === "OPEN" && (
          <MovementForm key={`${period.id}-${editing?.id ?? "new"}`} types={types} period={period} isIncome={isIncome} editing={editing} onSubmit={save} onCancel={() => setEditing(null)} />
        )}
        {period?.status === "CLOSED" && <Alert tone="warning">Este período está cerrado: solo lectura.</Alert>}
        <MovementsTable
          rows={rows} isIncome={isIncome} onDelete={remove}
          onEdit={(m) => { setEditing(m); window.scrollTo({ top: 0, behavior: "smooth" }); }}
        />
      </div>
    </>
  );
}
