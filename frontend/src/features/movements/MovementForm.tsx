import { useState, type FormEvent } from "react";
import { Alert, Button, Card, CardBody, CardHeader, Input, MoneyInput, Select, Textarea } from "../../components/ui";
import { pad } from "../../format";
import { ID_TYPES, type IdType, type Movement, type TypeRow } from "../../types";

export interface MovementInput {
  typeId: number; date: string; amount: number; description: string | null; intentionDate?: string | null;
  responsible: string; address: string; idType: IdType; idNumber: string; phone: string; email: string | null;
}
/** Rango de fechas permitido: de la primera a la última fecha de los períodos abiertos. */
export interface DateRange { min: string; max: string }
interface Props {
  types: TypeRow[]; range: DateRange; isIncome: boolean; editing: Movement | null;
  onSubmit: (body: MovementInput) => Promise<void>; onCancel: () => void;
}

type Errors = Partial<Record<"typeId" | "date" | "amount" | "intentionDate" | "description" | "responsible" | "address" | "idType" | "idNumber" | "phone" | "email", string>>;

export function defaultDate({ min, max }: DateRange) {
  const t = new Date();
  const today = `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`;
  return today >= min && today <= max ? today : min;
}

/** NIT: dígitos con guion y dígito de verificación opcional; CC/TI: solo dígitos (igual que en el backend). */
export function idNumberError(idType: IdType | "", value: string): string | undefined {
  const v = value.trim();
  if (!v) return "El número de identificación es obligatorio";
  if (idType === "NIT") return /^\d{6,12}(-\d)?$/.test(v) ? undefined : "NIT inválido: solo dígitos, con guion y dígito de verificación opcional";
  return /^\d{5,12}$/.test(v) ? undefined : "Solo dígitos (5 a 12)";
}

/** Formulario de ingreso/egreso. Vive en su propia pantalla, separada del listado. */
export function MovementForm({ types, range, isIncome, editing, onSubmit, onCancel }: Props) {
  const [typeId, setTypeId] = useState(editing ? String(editing.typeId) : "");
  const [date, setDate] = useState(editing?.date ?? defaultDate(range));
  const [amount, setAmount] = useState(editing ? String(editing.amount) : "");
  // Último valor sugerido que se cargó solo; sirve para saber si la persona ya escribió su propio monto
  const [suggested, setSuggested] = useState("");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [intentionDate, setIntentionDate] = useState(editing?.intentionDate ?? "");
  const [responsible, setResponsible] = useState(editing?.responsible ?? "");
  const [address, setAddress] = useState(editing?.address ?? "");
  const [idType, setIdType] = useState<IdType | "">(editing?.idType ?? "");
  const [idNumber, setIdNumber] = useState(editing?.idNumber ?? "");
  const [phone, setPhone] = useState(editing?.phone ?? "");
  const [email, setEmail] = useState(editing?.email ?? "");
  const [errors, setErrors] = useState<Errors>({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const selected = types.find((t) => String(t.id) === typeId);
  const isStipend = isIncome && selected?.categoryCode === "ESTIPENDIO";
  const options = types.filter((t) => t.active || String(t.id) === typeId);

  /** Al elegir un tipo con valor sugerido (estipendios) y crear un ingreso nuevo, propone ese monto si la persona aún no escribió otro. */
  function changeType(id: string) {
    setTypeId(id);
    if (editing) return;
    const def = types.find((t) => String(t.id) === id)?.defaultAmount;
    const next = def != null ? String(def) : "";
    if (amount === "" || amount === suggested) {
      setAmount(next);
      setSuggested(next);
    }
  }

  function validate(): Errors {
    const e: Errors = {};
    if (!typeId) e.typeId = "Selecciona un tipo";
    if (!date) e.date = "La fecha es obligatoria";
    else if (date < range.min || date > range.max) e.date = "La fecha debe estar dentro de un período abierto";
    if (!(Number(amount) > 0)) e.amount = "El monto debe ser mayor que cero";
    if (isStipend && !intentionDate) e.intentionDate = "Indica la fecha en que se realizará";
    if (isStipend && !description.trim()) e.description = "La mención o petición es obligatoria";
    if (!responsible.trim()) e.responsible = "El responsable es obligatorio";
    if (!address.trim()) e.address = "La dirección es obligatoria";
    if (!idType) e.idType = "Selecciona el tipo de identificación";
    const idErr = idNumberError(idType, idNumber);
    if (idErr) e.idNumber = idErr;
    if (!/^[0-9+()\s-]{7,20}$/.test(phone.trim())) e.phone = "Teléfono inválido";
    if (email.trim() && !/^\S+@\S+\.\S+$/.test(email.trim())) e.email = "Correo inválido";
    return e;
  }

  async function submit(ev: FormEvent) {
    ev.preventDefault();
    setError("");
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) return;
    setSaving(true);
    try {
      await onSubmit({
        typeId: Number(typeId), date, amount: Number(amount), description: description.trim() || null,
        ...(isStipend ? { intentionDate: intentionDate || null } : {}),
        responsible: responsible.trim(), address: address.trim(), idType: idType as IdType, idNumber: idNumber.trim(),
        phone: phone.trim(), email: email.trim() || null,
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <Card>
        <CardHeader title="Datos del movimiento" description={isStipend ? "Los estipendios requieren la fecha en que se celebrará la intención y la petición." : undefined} />
        <CardBody>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Tipo" required value={typeId} error={errors.typeId} onChange={(e) => changeType(e.target.value)}>
              <option value="">Selecciona…</option>
              {options.map((t) => <option key={t.id} value={t.id}>{t.name} · {t.categoryName}</option>)}
            </Select>
            <Input label="Fecha" type="date" required min={range.min} max={range.max} value={date} error={errors.date} onChange={(e) => setDate(e.target.value)} />
            <MoneyInput
              label="Monto" required value={amount} error={errors.amount} onValueChange={setAmount}
              hint={amount !== "" && amount === suggested ? "Valor sugerido para este tipo; puedes modificarlo." : undefined}
            />
            {isStipend && (
              <Input label="Fecha en que se realizará" type="date" required value={intentionDate} error={errors.intentionDate} onChange={(e) => setIntentionDate(e.target.value)} className="animate-slide-down" />
            )}
            <Textarea
              label={isStipend ? "Mención o petición" : "Descripción"} rows={2} required={isStipend}
              value={description} error={errors.description} onChange={(e) => setDescription(e.target.value)} className="sm:col-span-2"
            />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Responsable" description={isIncome ? "Quién entrega el dinero." : "A quién se le paga."} />
        <CardBody>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Responsable" required maxLength={150} autoComplete="off" value={responsible} error={errors.responsible} onChange={(e) => setResponsible(e.target.value)} className="sm:col-span-2" />
            <Input label="Dirección" required maxLength={200} autoComplete="off" value={address} error={errors.address} onChange={(e) => setAddress(e.target.value)} className="sm:col-span-2" />
            <Select label="Tipo de identificación" required value={idType} error={errors.idType} onChange={(e) => setIdType(e.target.value as IdType | "")}>
              <option value="">Selecciona…</option>
              {ID_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </Select>
            <Input
              label="Número de identificación" required maxLength={20} inputMode="numeric" autoComplete="off" value={idNumber} error={errors.idNumber}
              hint={idType === "NIT" ? "Ej.: 900123456-7" : undefined} onChange={(e) => setIdNumber(e.target.value)}
            />
            <Input label="Teléfono de contacto" type="tel" required maxLength={20} autoComplete="off" value={phone} error={errors.phone} onChange={(e) => setPhone(e.target.value)} />
            <Input label="Correo (opcional)" type="email" maxLength={150} autoComplete="off" value={email} error={errors.email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </CardBody>
      </Card>

      {error && <Alert tone="error">{error}</Alert>}
      <div className="flex gap-2">
        <Button type="submit" variant="primary" loading={saving}>{editing ? "Guardar cambios" : "Registrar"}</Button>
        <Button onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  );
}
