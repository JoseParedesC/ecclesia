import { useState, type FormEvent } from "react";
import { Alert, Button, Card, CardBody, CardHeader, Input } from "../../components/ui";
import type { Parish } from "../../types";
import { LogoField } from "./LogoField";

const DEPARTMENTS = ["Amazonas", "Antioquia", "Arauca", "Atlántico", "Bogotá D.C.", "Bolívar", "Boyacá", "Caldas", "Caquetá", "Casanare", "Cauca", "Cesar", "Chocó", "Córdoba", "Cundinamarca", "Guainía", "Guaviare", "Huila", "La Guajira", "Magdalena", "Meta", "Nariño", "Norte de Santander", "Putumayo", "Quindío", "Risaralda", "San Andrés y Providencia", "Santander", "Sucre", "Tolima", "Valle del Cauca", "Vaupés", "Vichada"];

type Errors = Partial<Record<"name" | "department" | "city" | "address" | "email" | "phone", string>>;
interface Props { initial: Parish | null; onSubmit: (p: Parish) => Promise<void>; onCancel: () => void }

/** Formulario de la parroquia. Nombre, departamento, ciudad y dirección son obligatorios; logo, correo y teléfono no. */
export function ParishForm({ initial, onSubmit, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [department, setDepartment] = useState(initial?.department ?? "");
  const [city, setCity] = useState(initial?.city ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [logo, setLogo] = useState<string | null>(initial?.logo ?? null);
  const [email, setEmail] = useState(initial?.email ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [errors, setErrors] = useState<Errors>({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const f: Errors = {};
    if (!name.trim()) f.name = "El nombre es obligatorio";
    if (!department.trim()) f.department = "El departamento es obligatorio";
    if (!city.trim()) f.city = "La ciudad es obligatoria";
    if (!address.trim()) f.address = "La dirección es obligatoria";
    if (email.trim() && !/^\S+@\S+\.\S+$/.test(email.trim())) f.email = "Correo inválido";
    if (phone.trim() && !/^[0-9+()\s-]{7,20}$/.test(phone.trim())) f.phone = "Teléfono inválido";
    setErrors(f);
    if (Object.keys(f).length) return;
    setSaving(true);
    try {
      await onSubmit({ name: name.trim(), department: department.trim(), city: city.trim(), address: address.trim(), logo, email: email.trim() || null, phone: phone.trim() || null });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <Card>
        <CardHeader title="Identidad" description="El nombre y el logo aparecen en el menú y en el encabezado de los reportes." />
        <CardBody className="space-y-4">
          <Input label="Nombre de la parroquia" required maxLength={150} value={name} error={errors.name} onChange={(e) => setName(e.target.value)} />
          <LogoField value={logo} onChange={setLogo} />
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Ubicación" />
        <CardBody>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Departamento" required list="departamentos" maxLength={80} autoComplete="off" value={department} error={errors.department} onChange={(e) => setDepartment(e.target.value)} />
            <datalist id="departamentos">{DEPARTMENTS.map((d) => <option key={d} value={d} />)}</datalist>
            <Input label="Ciudad" required maxLength={80} autoComplete="off" value={city} error={errors.city} onChange={(e) => setCity(e.target.value)} />
            <Input label="Dirección" required maxLength={200} autoComplete="off" value={address} error={errors.address} onChange={(e) => setAddress(e.target.value)} className="sm:col-span-2" />
          </div>
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Información de contacto" description="Opcional." />
        <CardBody>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Correo (opcional)" type="email" maxLength={150} autoComplete="off" value={email} error={errors.email} onChange={(e) => setEmail(e.target.value)} />
            <Input label="Teléfono (opcional)" type="tel" maxLength={20} autoComplete="off" value={phone} error={errors.phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
        </CardBody>
      </Card>
      {error && <Alert tone="error">{error}</Alert>}
      <div className="flex gap-2">
        <Button type="submit" variant="primary" loading={saving}>Guardar cambios</Button>
        <Button onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  );
}
