import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { api, send } from "../api";
import { money, pad, periodLabel } from "../format";
import type { Movement, Period, TypeRow } from "../types";

interface Form { typeId: string; date: string; amount: string; description: string; intentionDate: string }

export default function Movements({ kind }: { kind: "incomes" | "expenses" }) {
  const isIncome = kind === "incomes";
  const [periods, setPeriods] = useState<Period[]>([]);
  const [types, setTypes] = useState<TypeRow[]>([]);
  const [rows, setRows] = useState<Movement[]>([]);
  const [periodId, setPeriodId] = useState<number | null>(null);
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState<Form>({ typeId: "", date: "", amount: "", description: "", intentionDate: "" });
  const [error, setError] = useState("");

  const period = periods.find((p) => p.id === periodId) ?? null;
  const isOpen = period?.status === "OPEN";

  const defaultDate = useMemo(() => {
    if (!period) return "";
    const t = new Date();
    const today = `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`;
    const prefix = `${period.year}-${pad(period.month)}`;
    return today.startsWith(prefix) ? today : `${prefix}-01`;
  }, [period]);

  const blank = useCallback(
    (): Form => ({ typeId: "", date: defaultDate, amount: "", description: "", intentionDate: "" }),
    [defaultDate],
  );

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
  useEffect(() => { setEditing(null); setForm(blank()); }, [blank]);

  const selected = types.find((t) => String(t.id) === form.typeId);
  const isIntention = isIncome && selected?.categoryCode === "INTENCION";
  const total = rows.reduce((a, r) => a + r.amount, 0);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const body = {
      typeId: Number(form.typeId),
      date: form.date,
      amount: Number(form.amount),
      description: form.description.trim() || null,
      ...(isIntention ? { intentionDate: form.intentionDate || null } : {}),
    };
    try {
      await (editing ? send(`/${kind}/${editing}`, "PATCH", body) : send(`/${kind}`, "POST", body));
      setEditing(null);
      setForm(blank());
      load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function remove(m: Movement) {
    if (!confirm(`¿Eliminar ${m.typeName} por ${money(m.amount)}?`)) return;
    try { await send(`/${kind}/${m.id}`, "DELETE"); load(); } catch (err) { setError((err as Error).message); }
  }

  const edit = (m: Movement) => {
    setEditing(m.id);
    setForm({ typeId: String(m.typeId), date: m.date, amount: String(m.amount), description: m.description ?? "", intentionDate: m.intentionDate ?? "" });
  };

  const monthPrefix = period ? `${period.year}-${pad(period.month)}` : "";
  const lastDay = period ? new Date(period.year, period.month, 0).getDate() : 31;
  const activeTypes = types.filter((t) => t.active || String(t.id) === form.typeId);

  return (
    <>
      <h1>{isIncome ? "Ingresos" : "Egresos"}</h1>

      <div className="toolbar">
        <label>Período
          <select value={periodId ?? ""} onChange={(e) => setPeriodId(Number(e.target.value))}>
            {periods.map((p) => (
              <option key={p.id} value={p.id}>{periodLabel(p)} — {p.status === "OPEN" ? "abierto" : "cerrado"}</option>
            ))}
          </select>
        </label>
        <strong>Total: {money(total)}</strong>
      </div>

      {error && <p className="error" role="alert">{error}</p>}
      {!periods.length && <p className="muted">Aún no hay períodos. Abre el primero en la sección Períodos.</p>}

      {isOpen ? (
        <form className="card form" onSubmit={submit}>
          <h2>{editing ? "Editar registro" : "Nuevo registro"}</h2>
          <label>Tipo
            <select required value={form.typeId} onChange={(e) => setForm({ ...form, typeId: e.target.value })}>
              <option value="">Selecciona…</option>
              {activeTypes.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.categoryName})</option>)}
            </select>
          </label>
          <label>Fecha
            <input type="date" required min={`${monthPrefix}-01`} max={`${monthPrefix}-${pad(lastDay)}`}
              value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </label>
          <label>Monto
            <input type="number" required min="0.01" step="0.01" value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          </label>
          {isIntention && (
            <label>Fecha en que se realizará la intención
              <input type="date" required value={form.intentionDate}
                onChange={(e) => setForm({ ...form, intentionDate: e.target.value })} />
            </label>
          )}
          <label className="wide">{isIntention ? "Mención o petición" : "Descripción"}
            <textarea rows={2} required={isIntention} value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </label>
          <div className="actions">
            <button className="primary" type="submit">{editing ? "Guardar cambios" : "Registrar"}</button>
            {editing && <button type="button" onClick={() => { setEditing(null); setForm(blank()); }}>Cancelar</button>}
          </div>
        </form>
      ) : (
        period && <p className="muted">El período está cerrado: solo lectura.</p>
      )}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Fecha</th><th>Tipo</th><th>Categoría</th>
              {isIncome && <th>Fecha intención</th>}
              <th>Descripción</th><th className="num">Monto</th><th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => (
              <tr key={m.id}>
                <td>{m.date}</td><td>{m.typeName}</td><td>{m.categoryName}</td>
                {isIncome && <td>{m.intentionDate ?? ""}</td>}
                <td>{m.description}</td>
                <td className="num">{money(m.amount)}</td>
                <td className="row-actions">
                  {m.periodStatus === "OPEN" && (<><button onClick={() => edit(m)}>Editar</button><button onClick={() => remove(m)}>Eliminar</button></>)}
                </td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={7} className="muted">Sin registros en este período.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
