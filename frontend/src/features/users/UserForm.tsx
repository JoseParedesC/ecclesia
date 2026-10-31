import { UserPlus } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Alert, Button, Card, CardBody, CardHeader, Input, Select } from "../../components/ui";
import type { Role } from "../../types";

export const ROLES: { value: Role; label: string; hint: string }[] = [
  { value: "secretario", label: "Secretario", hint: "Registra movimientos y cierra meses; no puede reabrir." },
  { value: "contador", label: "Contador", hint: "Reabre períodos y define cuentas contables." },
  { value: "sacerdote", label: "Sacerdote", hint: "Reabre períodos y gestiona maestros." },
  { value: "administrador", label: "Administrador", hint: "Acceso total, incluida la gestión de usuarios." },
];

export function UserForm({ allowed, onCreate }: { allowed: Role[]; onCreate: (u: { email: string; name: string | null; role: Role }) => Promise<void> }) {
  const options = ROLES.filter((r) => allowed.includes(r.value));
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>(options[0]?.value ?? "secretario");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await onCreate({ email: email.trim(), name: name.trim() || null, role });
      setEmail(""); setName(""); setRole(options[0]?.value ?? "secretario");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader title="Agregar usuario" description="La persona entra con el correo de su cuenta de Google exactamente como lo escribas aquí." />
      <CardBody>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <Input label="Correo de Google" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nombre@gmail.com" />
          <Input label="Nombre (opcional)" value={name} onChange={(e) => setName(e.target.value)} />
          <Select label="Rol" value={role} onChange={(e) => setRole(e.target.value as Role)} hint={options.find((r) => r.value === role)?.hint} className="sm:col-span-2">
            {options.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </Select>
          {error && <Alert tone="error" className="sm:col-span-2">{error}</Alert>}
          <div className="sm:col-span-2">
            <Button type="submit" variant="primary" loading={saving}><UserPlus className="h-4 w-4" aria-hidden="true" />Agregar usuario</Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
