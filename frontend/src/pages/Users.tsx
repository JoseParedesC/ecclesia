import { useCallback, useEffect, useState } from "react";
import { api, send } from "../api";
import { useAuth } from "../auth";
import { PageHeader } from "../components/layout/PageHeader";
import { Alert, useConfirm, useToast } from "../components/ui";
import { UserForm } from "../features/users/UserForm";
import { UsersTable } from "../features/users/UsersTable";
import type { Role, UserRow } from "../types";

export default function Users() {
  const { me } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(() => api<UserRow[]>("/users").then(setUsers).catch((e) => setError(e.message)), []);
  useEffect(() => void load(), [load]);

  async function create(u: { email: string; name: string | null; role: Role }) {
    await send("/users", "POST", u);
    toast.success("Usuario agregado");
    await load();
  }

  async function patch(u: UserRow, body: Partial<Pick<UserRow, "role" | "active">>, ok: string) {
    setError("");
    setBusyId(u.id);
    try {
      await send(`/users/${u.id}`, "PATCH", body);
      toast.success(ok);
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  async function toggle(u: UserRow) {
    if (u.active) {
      const yes = await confirm({ title: "Desactivar usuario", message: `${u.email} ya no podrá iniciar sesión. Sus registros se conservan.`, confirmLabel: "Desactivar", tone: "danger" });
      if (!yes) return;
    }
    patch(u, { active: !u.active }, u.active ? "Usuario desactivado" : "Usuario activado");
  }

  return (
    <>
      <PageHeader title="Usuarios" description="Solo las personas registradas aquí pueden iniciar sesión con su cuenta de Google. Ves y gestionas únicamente los roles que tu rol puede crear." />
      <div className="space-y-5">
        {error && <Alert tone="error">{error}</Alert>}
        <UserForm allowed={me!.creatableRoles} onCreate={create} />
        <UsersTable users={users} allowed={me!.creatableRoles} meId={me!.id} busyId={busyId} onRole={(u, role) => patch(u, { role }, "Rol actualizado")} onToggle={toggle} />
      </div>
    </>
  );
}
