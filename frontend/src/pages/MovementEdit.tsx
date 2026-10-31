import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, send } from "../api";
import { PageHeader } from "../components/layout/PageHeader";
import { Alert, Button, Spinner, useToast } from "../components/ui";
import { MovementForm, type DateRange, type MovementInput } from "../features/movements/MovementForm";
import { pad, today } from "../format";
import type { Movement, Period, TypeRow } from "../types";

/** Pantalla de formulario (crear / editar) de ingresos o egresos. */
export default function MovementEdit({ kind }: { kind: "incomes" | "expenses" }) {
  const isIncome = kind === "incomes";
  const base = isIncome ? "/incomes" : "/expenses";
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [types, setTypes] = useState<TypeRow[] | null>(null);
  const [periods, setPeriods] = useState<Period[] | null>(null);
  const [editing, setEditing] = useState<Movement | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setTypes(null); setPeriods(null); setEditing(null); setError("");
    Promise.all([
      api<Period[]>("/periods"),
      api<TypeRow[]>(isIncome ? "/income-types" : "/expense-types"),
      id ? api<Movement>(`/${kind}/${id}`) : Promise.resolve(null),
    ])
      .then(([ps, ts, m]) => { setPeriods(ps); setTypes(ts); setEditing(m); })
      .catch((e) => setError(e.message));
  }, [kind, id, isIncome]);

  const back = () => navigate(base);
  const label = isIncome ? "ingreso" : "egreso";
  const header = <PageHeader title={id ? `Editar ${label}` : `Nuevo ${label}`} actions={<Button variant="ghost" onClick={back}><ArrowLeft className="h-4 w-4" aria-hidden="true" />Volver al listado</Button>} />;

  if (error) return <>{header}<Alert tone="error">{error}</Alert></>;
  if (!types || !periods) return <>{header}<div className="flex justify-center py-16 text-primary_"><Spinner className="h-6 w-6" /></div></>;

  // Fechas permitidas: desde el primer día del primer período abierto hasta el último día del último
  const open = periods.filter((p) => p.status === "OPEN").sort((a, b) => a.year * 12 + a.month - (b.year * 12 + b.month));
  if (!open.length) return <>{header}<Alert tone="warning">No hay períodos abiertos. Abre uno en la sección Períodos para registrar movimientos.</Alert></>;
  if (editing && editing.periodStatus !== "OPEN") return <>{header}<Alert tone="warning">El período de este registro está cerrado: solo lectura.</Alert></>;
  // Un ingreso nuevo se registra con la fecha actual: el período de hoy debe estar abierto
  const currentOpen = open.some((p) => `${p.year}-${pad(p.month)}` === today().slice(0, 7));
  const first = open[0], last = open[open.length - 1];
  const range: DateRange = {
    min: `${first.year}-${pad(first.month)}-01`,
    max: `${last.year}-${pad(last.month)}-${pad(new Date(last.year, last.month, 0).getDate())}`,
  };

  async function save(body: MovementInput) {
    await (editing ? send(`/${kind}/${editing.id}`, "PATCH", body) : send(`/${kind}`, "POST", body));
    toast.success(editing ? "Cambios guardados" : "Registro creado");
    back();
  }

  return (
    <>
      {header}
      {isIncome && !editing && !currentOpen && <Alert tone="warning" className="mb-5">El período de la fecha actual ({today().slice(0, 7)}) no está abierto, así que el ingreso no se podrá registrar. Ábrelo en Períodos.</Alert>}
      <MovementForm types={types} range={range} isIncome={isIncome} editing={editing} onSubmit={save} onCancel={back} />
    </>
  );
}
