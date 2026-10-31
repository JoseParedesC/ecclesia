import { Plus, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, send } from "../api";
import { useAuth } from "../auth";
import { PageHeader } from "../components/layout/PageHeader";
import { Alert, Button, Input, Select, useConfirm, useToast } from "../components/ui";
import { ROLES } from "../features/users/UserForm";
import { UsersTable } from "../features/users/UsersTable";
import type { UserRow } from "../types";

/** Listado de usuarios. El formulario vive en su propia pantalla (/users/new y /users/:id/edit). */
export default function Users() {
  const { me } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("all");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(() => api<UserRow[]>("/users").then(setUsers).catch((e) => setError(e.message)), []);
  useEffect(() => void load(), [load]);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) =>
      (!q || u.email.toLowerCase().includes(q) || (u.name ?? "").toLowerCase().includes(q)) &&
      (!role || u.role === role) && (status === "all" || u.active === (status === "active")));
  }, [users, search, role, status]);

  async function toggle(u: UserRow) {
    if (u.active) {
      const yes = await confirm({ title: "Desactivar usuario", message: `${u.email} ya no podrá iniciar sesión. Sus registros se conservan.`, confirmLabel: "Desactivar", tone: "danger" });
      if (!yes) return;
    }
    setError("");
    setBusyId(u.id);
    try {
      await send(`/users/${u.id}`, "PATCH", { active: !u.active });
      toast.success(u.active ? "Usuario desactivado" : "Usuario activado");
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  const allowedRoles = ROLES.filter((r) => me!.creatableRoles.includes(r.value));
  return (
    <>
      <PageHeader
        title="Usuarios"
        description="Solo las personas registradas aquí pueden iniciar sesión con su cuenta de Google. Ves y gestionas únicamente los roles que tu rol puede crear."
        actions={<Button variant="primary" onClick={() => navigate("/users/new")}><Plus className="h-4 w-4" aria-hidden="true" />Nuevo usuario</Button>}
      />
      <div className="space-y-5">
        {error && <Alert tone="error">{error}</Alert>}
        <div className="flex flex-wrap items-end gap-3">
          <div className="relative min-w-[14rem] flex-1">
            <Search className="pointer-events-none absolute bottom-2.5 left-3 h-4 w-4 text-muted" aria-hidden="true" />
            <Input label="Buscar" placeholder="Correo o nombre" value={search} onChange={(e) => setSearch(e.target.value)} className="[&_input]:pl-9" />
          </div>
          <Select label="Rol" value={role} onChange={(e) => setRole(e.target.value)} className="w-44">
            <option value="">Todos</option>
            {allowedRoles.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </Select>
          <Select label="Estado" value={status} onChange={(e) => setStatus(e.target.value)} className="w-40">
            <option value="all">Todos</option><option value="active">Activos</option><option value="inactive">Inactivos</option>
          </Select>
        </div>
        <UsersTable users={shown} meId={me!.id} busyId={busyId} onEdit={(u) => navigate(`/users/${u.id}/edit`)} onToggle={toggle} />
      </div>
    </>
  );
}
