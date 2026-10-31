import { useState, type FormEvent } from "react";
import { Alert, Button, Card, CardBody, CardHeader, Input, Select } from "../../components/ui";
import type { Role, UserRow } from "../../types";

export const ROLES: { value: Role; label: string; hint: string }[] = [
  { value: "secretario", label: "Secretario", hint: "Registra movimientos y cierra meses; no puede reabrir." },
  { value: "contador", label: "Contador", hint: "Reabre períodos y define cuentas contables." },
  { value: "sacerdote", label: "Sacerdote", hint: "Reabre períodos y gestiona maestros." },
  { value: "administrador", label: "Administrador", hint: "Acceso total, incluida la gestión de usuarios." },
];
export const roleLabel = (r: Role) => ROLES.find((x) => x.value === r)?.label ?? r;

export interface UserInput { email: string; name: string | null; role: Role }
interface Props {
  allowed: Role[]; editing: UserRow | null; isSelf: boolean;
  onSubmit: (u: UserInput) => Promise<void>; onCancel: () => void;
}

/** Formulario de usuario (crear / editar). Vive en su propia pantalla, separada del listado. */
export function UserForm({ allowed, editing, isSelf, onSubmit, onCancel }: Props) {
  const options = ROLES.filter((r) => allowed.includes(r.value));
  const [email, setEmail] = useState(editing?.email ?? "");
  const [name, setName] = useState(editing?.name ?? "");
  const [role, setRole] = useState<Role>(editing?.role ?? options[0]?.value ?? "secretario");
  const [errors, setErrors] = useState<{ email?: string }>({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setErrors({ email: "Escribe un correo válido" });
    setErrors({});
    setSaving(true);
    try {
      await onSubmit({ email: email.trim(), name: name.trim() || null, role });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      <Card>
        <CardHeader
          title={editing ? "Datos del usuario" : "Nuevo usuario"}
          description={editing ? "El correo no se puede cambiar: es la cuenta de Google con la que la persona inicia sesión." : "La persona entra con el correo de su cuenta de Google exactamente como lo escribas aquí."}
        />
        <CardBody>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Correo de Google" type="email" required disabled={!!editing} value={email} error={errors.email} onChange={(e) => setEmail(e.target.value)} placeholder="nombre@gmail.com" />
            <Input label="Nombre (opcional)" maxLength={120} value={name} onChange={(e) => setName(e.target.value)} />
            <Select
              label="Rol" value={role} disabled={isSelf} onChange={(e) => setRole(e.target.value as Role)}
              hint={isSelf ? "No puedes cambiar tu propio rol." : options.find((r) => r.value === role)?.hint} className="sm:col-span-2"
            >
              {options.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              {isSelf && !options.some((r) => r.value === role) && <option value={role}>{roleLabel(role)}</option>}
            </Select>
          </div>
        </CardBody>
      </Card>
      {error && <Alert tone="error" className="mt-5">{error}</Alert>}
      <div className="mt-5 flex gap-2">
        <Button type="submit" variant="primary" loading={saving}>{editing ? "Guardar cambios" : "Agregar usuario"}</Button>
        <Button onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  );
}
