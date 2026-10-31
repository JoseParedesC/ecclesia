import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";
import { PageHeader } from "../components/layout/PageHeader";
import { Alert, Button, Spinner, useToast } from "../components/ui";
import { ParishForm } from "../features/parish/ParishForm";
import { useParish } from "../parish";
import type { Parish } from "../types";
import { PARISH_WRITE_ROLES } from "./Parish";

/** Pantalla de formulario de la parroquia. */
export default function ParishEdit() {
  const { me } = useAuth();
  const { parish, loading, reload } = useParish();
  const navigate = useNavigate();
  const toast = useToast();
  const back = () => navigate("/parish");
  const header = <PageHeader title="Datos de la parroquia" actions={<Button variant="ghost" onClick={back}><ArrowLeft className="h-4 w-4" aria-hidden="true" />Volver</Button>} />;

  if (!PARISH_WRITE_ROLES.includes(me!.role)) return <>{header}<Alert tone="warning">Solo el sacerdote y el administrador pueden editar los datos de la parroquia.</Alert></>;
  if (loading) return <>{header}<div className="flex justify-center py-16 text-primary_"><Spinner className="h-6 w-6" /></div></>;

  async function save(p: Parish) {
    await api<Parish>("/parish", { method: "PUT", body: JSON.stringify(p) });
    await reload();
    toast.success("Datos de la parroquia guardados");
    back();
  }
  return <>{header}<ParishForm initial={parish} onSubmit={save} onCancel={back} /></>;
}
