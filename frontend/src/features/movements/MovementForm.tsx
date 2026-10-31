import { useState, type FormEvent } from "react";
import { Alert, Button, Card, CardBody, CardHeader, Input, Select, Textarea } from "../../components/ui";
import { pad } from "../../format";
import type { Movement, Period, TypeRow } from "../../types";

export interface MovementInput {
  typeId: number; date: string; amount: number; description: string | null; intentionDate?: string | null;
}
interface Props {
  types: TypeRow[]; period: Period; isIncome: boolean; editing: Movement | null;
  onSubmit: (body: MovementInput) => Promise<void>; onCancel: () => void;
}

function defaultDate(period: Period) {
  const t = new Date();
  const prefix = `${period.year}-${pad(period.month)}`;
  const today = `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`;
  return today.startsWith(prefix) ? today : `${prefix}-01`;
}

/** Remontar con `key` al cambiar de período o de registro en edición para reiniciar el estado. */
export function MovementForm({ types, period, isIncome, editing, onSubmit, onCancel }: Props) {
  const [typeId, setTypeId] = useState(editing ? String(editing.typeId) : "");
  const [date, setDate] = useState(editing?.date ?? defaultDate(period));
  const [amount, setAmount] = useState(editing ? String(editing.amount) : "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [intentionDate, setIntentionDate] = useState(editing?.intentionDate ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const prefix = `${period.year}-${pad(period.month)}`;
  const lastDay = new Date(period.year, period.month, 0).getDate();
  const selected = types.find((t) => t.id === typeId);
  const isIntention = isIncome && selected?.categoryCode === "INTENCION";
  const options = types.filter((t) => t.active || t.id === typeId);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await onSubmit({
        typeId: Number(typeId), date, amount: Number(amount), description: description.trim() || null,
        ...(isIntention ? { intentionDate: intentionDate || null } : {}),
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader title={editing ? "Editar registro" : "Nuevo registro"} description={isIntention ? "Las intenciones requieren la fecha en que se celebrarán y la petición." : undefined} />
      <CardBody>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <Select label="Tipo" required value={typeId} onChange={(e) => setTypeId(e.target.value)}>
            <option value="">Selecciona…</option>
            {options.map((t) => <option key={t.id} value={t.id}>{t.name} · {t.categoryName}</option>)}
          </Select>
          <Input label="Fecha" type="date" required min={`${prefix}-01`} max={`${prefix}-${pad(lastDay)}`} value={date} onChange={(e) => setDate(e.target.value)} />
          <Input label="Monto" type="number" required min="0.01" step="0.01" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
          {isIntention && (
            <Input label="Fecha en que se realizará" type="date" required value={intentionDate} onChange={(e) => setIntentionDate(e.target.value)} className="animate-slide-down" />
          )}
          <Textarea
            label={isIntention ? "Mención o petición" : "Descripción"} rows={2} required={isIntention}
            value={description} onChange={(e) => setDescription(e.target.value)} className="sm:col-span-2"
          />
          {error && <Alert tone="error" className="sm:col-span-2">{error}</Alert>}
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" variant="primary" loading={saving}>{editing ? "Guardar cambios" : "Registrar"}</Button>
            {editing && <Button onClick={onCancel}>Cancelar</Button>}
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
