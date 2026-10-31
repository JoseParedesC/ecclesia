import { Users } from "lucide-react";
import { Badge, Button, EmptyState, Table, TableWrap, Td, Th, Tr, controlClass } from "../../components/ui";
import type { Role, UserRow } from "../../types";
import { ROLES } from "./UserForm";

interface Props {
  users: UserRow[]; allowed: Role[]; meId: number; busyId: number | null;
  onRole: (u: UserRow, role: Role) => void; onToggle: (u: UserRow) => void;
}

export function UsersTable({ users, allowed, meId, busyId, onRole, onToggle }: Props) {
  if (!users.length) return <TableWrap><EmptyState icon={Users} title="Sin usuarios" /></TableWrap>;
  return (
    <TableWrap>
      <Table>
        <thead><tr><Th>Usuario</Th><Th>Rol</Th><Th>Estado</Th><Th><span className="sr-only">Acciones</span></Th></tr></thead>
        <tbody>
          {users.map((u) => {
            const self = u.id === meId;
            return (
              <Tr key={u.id} className={u.active ? "" : "opacity-60"}>
                <Td>
                  <p className="font-medium">{u.name ?? u.email}{self && <span className="ml-2 text-xs text-muted">(tú)</span>}</p>
                  {u.name && <p className="text-xs text-muted">{u.email}</p>}
                </Td>
                <Td>
                  <select
                    aria-label={`Rol de ${u.email}`} value={u.role} disabled={self || busyId === u.id}
                    onChange={(e) => onRole(u, e.target.value as Role)} className={`${controlClass} w-40 py-1.5`}
                  >
                    {ROLES.filter((r) => allowed.includes(r.value)).map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </Td>
                <Td><Badge tone={u.active ? "success" : "neutral"}>{u.active ? "Activo" : "Inactivo"}</Badge></Td>
                <Td>
                  <div className="flex justify-end">
                    <Button size="sm" variant="ghost" disabled={self} loading={busyId === u.id} onClick={() => onToggle(u)}>
                      {u.active ? "Desactivar" : "Activar"}
                    </Button>
                  </div>
                </Td>
              </Tr>
            );
          })}
        </tbody>
      </Table>
    </TableWrap>
  );
}
