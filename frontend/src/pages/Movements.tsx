import { Plus, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api, send } from "../api";
import { PageHeader } from "../components/layout/PageHeader";
import { Alert, Button, Input, Select, useConfirm, useToast } from "../components/ui";
import { MovementsTable } from "../features/movements/MovementsTable";
import { receiptNumber } from "../features/stipends/StipendReceipt";
import { money, periodLabel } from "../format";
import { printStipendReceipts } from "../lib/printStipends";
import { useParish } from "../parish";
import type { Movement, Period, TypeRow } from "../types";

/** Listado de ingresos o egresos. El formulario vive en su propia pantalla (/new y /:id/edit). */
export default function Movements({ kind }: { kind: "incomes" | "expenses" }) {
  const isIncome = kind === "incomes";
  const base = isIncome ? "/incomes" : "/expenses";
  const navigate = useNavigate();
  const toast = useToast();
  const { parish } = useParish();
  const confirm = useConfirm();
  const [params, setParams] = useSearchParams();
  const [periods, setPeriods] = useState<Period[]>([]);
  const [types, setTypes] = useState<TypeRow[]>([]);
  const [rows, setRows] = useState<Movement[]>([]);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [typeId, setTypeId] = useState("");
  const [error, setError] = useState("");

  const periodId = params.get("period") ? Number(params.get("period")) : null;
  const period = periods.find((p) => p.id === periodId) ?? null;
  const total = rows.reduce((a, r) => a + r.amount, 0);
  const choosePeriod = (id: number | null) => setParams(id === null ? {} : { period: String(id) }, { replace: true });

  useEffect(() => {
    setSearch(""); setQuery(""); setTypeId(""); setError("");
    Promise.all([api<Period[]>("/periods"), api<TypeRow[]>(isIncome ? "/income-types" : "/expense-types")])
      .then(([ps, ts]) => {
        setPeriods(ps);
        setTypes(ts);
        if (!ps.some((p) => p.id === periodId)) choosePeriod((ps.find((p) => p.status === "OPEN") ?? ps[0])?.id ?? null);
      })
      .catch((e) => setError(e.message));
  }, [isIncome]); // eslint-disable-line react-hooks/exhaustive-deps

  // Búsqueda con retardo, como en los maestros
  useEffect(() => {
    const t = setTimeout(() => setQuery(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(() => {
    if (periodId === null) return setRows([]);
    const q = new URLSearchParams({ periodId: String(periodId), search: query, typeId });
    api<Movement[]>(`/${kind}?${q}`).then(setRows).catch((e) => setError(e.message));
  }, [kind, periodId, query, typeId]);
  useEffect(load, [load]);

  async function remove(m: Movement) {
    const ok = await confirm({ title: "Eliminar registro", message: `Se eliminará ${m.typeName} por ${money(m.amount)}. Esta acción no se puede deshacer.`, confirmLabel: "Eliminar", tone: "danger" });
    if (!ok) return;
    try { await send(`/${kind}/${m.id}`, "DELETE"); toast.success("Registro eliminado"); load(); } catch (e) { setError((e as Error).message); }
  }

  const hasOpen = periods.some((p) => p.status === "OPEN");
  return (
    <>
      <PageHeader
        title={isIncome ? "Ingresos" : "Egresos"}
        description={period ? `Total del período: ${money(total)}` : undefined}
        actions={
          <div className="flex flex-wrap items-end gap-3">
            {periods.length > 0 && (
              <Select label="Período" value={periodId ?? ""} onChange={(e) => choosePeriod(Number(e.target.value))} className="w-56">
                {periods.map((p) => <option key={p.id} value={p.id}>{periodLabel(p)} · {p.status === "OPEN" ? "abierto" : "cerrado"}</option>)}
              </Select>
            )}
            <Button variant="primary" disabled={!hasOpen} onClick={() => navigate(`${base}/new`)}><Plus className="h-4 w-4" aria-hidden="true" />{isIncome ? "Nuevo ingreso" : "Nuevo egreso"}</Button>
          </div>
        }
      />
      <div className="space-y-5">
        {error && <Alert tone="error">{error}</Alert>}
        {!periods.length && <Alert tone="info">Aún no hay períodos. Abre el primero en la sección Períodos.</Alert>}
        {periods.length > 0 && !hasOpen && <Alert tone="warning">No hay períodos abiertos: no se pueden registrar movimientos.</Alert>}
        {period?.status === "CLOSED" && <Alert tone="warning">Este período está cerrado: solo lectura.</Alert>}
        <div className="flex flex-wrap items-end gap-3">
          <div className="relative min-w-[14rem] flex-1">
            <Search className="pointer-events-none absolute bottom-2.5 left-3 h-4 w-4 text-muted" aria-hidden="true" />
            <Input label="Buscar" placeholder="Responsable, identificación, tipo o descripción" value={search} onChange={(e) => setSearch(e.target.value)} className="[&_input]:pl-9" />
          </div>
          <Select label="Tipo" value={typeId} onChange={(e) => setTypeId(e.target.value)} className="w-52">
            <option value="">Todos</option>
            {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </Select>
        </div>
        <MovementsTable rows={rows} isIncome={isIncome} onDelete={remove} onPrint={(m) => void printStipendReceipts([m], parish, `Estipendio ${receiptNumber(m.id)}`)} onEdit={(m) => navigate(`${base}/${m.id}/edit`)} />
      </div>
    </>
  );
}
