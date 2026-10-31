import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, send } from "../api";
import { useAuth } from "../auth";
import { PageHeader } from "../components/layout/PageHeader";
import { Alert, Button, Spinner, useToast } from "../components/ui";
import { UserForm, type UserInput } from "../features/users/UserForm";
import type { UserRow } from "../types";

/** Pantalla de formulario (crear / editar) de usuarios. */
export default function UserEdit() {
  const { me } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [loading, setLoading] = useState(!!id);
  const [error, setError] = useState("");

  useEffect(() => {
    setError("");
    if (!id) return setLoading(false);
    setLoading(true);
    api<UserRow>(`/users/${id}`).then(setEditing).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [id]);

  const back = () => navigate("/users");
  const header = <PageHeader title={id ? "Editar usuario" : "Nuevo usuario"} actions={<Button variant="ghost" onClick={back}><ArrowLeft className="h-4 w-4" aria-hidden="true" />Volver al listado</Button>} />;
  if (error) return <>{header}<Alert tone="error">{error}</Alert></>;
  if (loading) return <>{header}<div className="flex justify-center py-16 text-primary_"><Spinner className="h-6 w-6" /></div></>;

  async function save(u: UserInput) {
    await (editing ? send(`/users/${editing.id}`, "PATCH", { name: u.name, role: u.role }) : send("/users", "POST", u));
    toast.success(editing ? "Cambios guardados" : "Usuario agregado");
    back();
  }

  return <>{header}<UserForm allowed={me!.creatableRoles} editing={editing} isSelf={editing?.id === me!.id} onSubmit={save} onCancel={back} /></>;
}
