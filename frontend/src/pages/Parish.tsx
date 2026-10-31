import { Building2, Mail, MapPin, Pencil, Phone } from "lucide-react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import { PageHeader } from "../components/layout/PageHeader";
import { Alert, Button, Card, CardBody, CardHeader, Spinner } from "../components/ui";
import { useParish } from "../parish";

export const PARISH_WRITE_ROLES = ["sacerdote", "administrador"];

const Row = ({ icon: Icon, label, children }: { icon: typeof Mail; label: string; children: ReactNode }) => (
  <div className="flex items-start gap-3">
    <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary_"><Icon className="h-4 w-4" aria-hidden="true" /></span>
    <div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p><p className="break-words text-sm">{children}</p></div>
  </div>
);

/** Datos de la parroquia (consulta). La edición está en su propia pantalla: /parish/edit. */
export default function Parish() {
  const { me } = useAuth();
  const { parish, loading } = useParish();
  const navigate = useNavigate();
  const canEdit = PARISH_WRITE_ROLES.includes(me!.role);

  return (
    <>
      <PageHeader
        title="Parroquia"
        description="Datos que identifican a la parroquia en el menú y en los reportes impresos."
        actions={canEdit && <Button variant="primary" onClick={() => navigate("/parish/edit")}><Pencil className="h-4 w-4" aria-hidden="true" />{parish ? "Editar datos" : "Configurar parroquia"}</Button>}
      />
      {loading && <div className="flex justify-center py-16 text-primary_"><Spinner className="h-6 w-6" /></div>}
      {!loading && !parish && (
        <Alert tone="info">{canEdit ? "Aún no se han definido los datos de la parroquia. Pulsa «Configurar parroquia»." : "Aún no se han definido los datos de la parroquia. Pide al sacerdote o a un administrador que los configure."}</Alert>
      )}
      {parish && (
        <Card>
          <CardHeader title={parish.name} description={`${parish.city}, ${parish.department}`} />
          <CardBody>
            <div className="flex flex-wrap gap-6">
              {parish.logo && <img src={parish.logo} alt="Logo de la parroquia" className="h-28 w-28 rounded-xl border border-line bg-white object-contain p-1.5 shadow-soft" />}
              <div className="grid min-w-0 flex-1 gap-4 sm:grid-cols-2">
                <Row icon={Building2} label="Nombre">{parish.name}</Row>
                <Row icon={MapPin} label="Ubicación">{parish.address}<br />{parish.city}, {parish.department}</Row>
                <Row icon={Mail} label="Correo">{parish.email ?? "—"}</Row>
                <Row icon={Phone} label="Teléfono">{parish.phone ?? "—"}</Row>
              </div>
            </div>
          </CardBody>
        </Card>
      )}
    </>
  );
}
