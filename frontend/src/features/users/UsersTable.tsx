import { Pencil, Users } from "lucide-react";
import { Badge, Button, EmptyState, Table, TableWrap, Td, Th, Tr } from "../../components/ui";
import type { UserRow } from "../../types";
import { roleLabel } from "./UserForm";

interface Props { users: UserRow[]; meId: number; busyId: number | null; onEdit: (u: UserRow) => void; onToggle: (u: UserRow) => void }

export function UsersTable({ users, meId, busyId, onEdit, onToggle }: Props) {
  if (!users.length) return <TableWrap><EmptyState icon={Users} title="Sin usuarios">No hay usuarios para la búsqueda elegida.</EmptyState></TableWrap>;
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
                <Td><Badge tone="primary">{roleLabel(u.role)}</Badge></Td>
                <Td><Badge tone={u.active ? "success" : "neutral"}>{u.active ? "Activo" : "Inactivo"}</Badge></Td>
                <Td>
                  <div className="flex justify-end gap-1">
                    <Button size="sm" variant="ghost" aria-label={`Editar ${u.email}`} onClick={() => onEdit(u)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="ghost" disabled={self} loading={busyId === u.id} onClick={() => onToggle(u)}>{u.active ? "Desactivar" : "Activar"}</Button>
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
