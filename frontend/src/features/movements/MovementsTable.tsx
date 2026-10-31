import { Pencil, ReceiptText, Trash2 } from "lucide-react";
import { Badge, Button, EmptyState, Table, TableWrap, Td, Th, Tr } from "../../components/ui";
import { money } from "../../format";
import type { Movement } from "../../types";

interface Props { rows: Movement[]; isIncome: boolean; onEdit: (m: Movement) => void; onDelete: (m: Movement) => void }

export function MovementsTable({ rows, isIncome, onEdit, onDelete }: Props) {
  if (!rows.length)
    return <TableWrap><EmptyState icon={ReceiptText} title="Sin registros">No hay movimientos para el período y la búsqueda elegidos.</EmptyState></TableWrap>;
  return (
    <TableWrap>
      <Table>
        <thead>
          <tr>
            <Th>Fecha</Th><Th>Tipo</Th>{isIncome && <Th>Se realiza</Th>}<Th>Responsable</Th><Th>Contacto</Th><Th>Descripción</Th><Th className="text-right">Monto</Th><Th><span className="sr-only">Acciones</span></Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((m) => (
            <Tr key={m.id}>
              <Td className="whitespace-nowrap tabular-nums">{m.date}</Td>
              <Td>
                <p className="font-medium">{m.typeName}</p>
                <Badge tone={m.categoryCode === "ESTIPENDIO" ? "primary" : "neutral"}>{m.categoryName}</Badge>
              </Td>
              {isIncome && <Td className="whitespace-nowrap tabular-nums">{m.intentionDate ?? "—"}</Td>}
              <Td>
                <p className="font-medium">{m.responsible ?? "—"}</p>
                {m.idType && <p className="whitespace-nowrap text-xs text-muted">{m.idType} {m.idNumber}</p>}
              </Td>
              <Td className="text-muted">
                <p className="whitespace-nowrap">{m.phone ?? "—"}</p>
                {m.email && <p className="text-xs">{m.email}</p>}
                {m.address && <p className="max-w-[12rem] text-xs">{m.address}</p>}
              </Td>
              <Td className="max-w-xs text-muted">{m.description ?? "—"}</Td>
              <Td className="whitespace-nowrap text-right font-medium tabular-nums">{money(m.amount)}</Td>
              <Td>
                {m.periodStatus === "OPEN" && (
                  <div className="flex justify-end gap-1">
                    <Button size="sm" variant="ghost" aria-label={`Editar ${m.typeName}`} onClick={() => onEdit(m)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="ghost" aria-label={`Eliminar ${m.typeName}`} onClick={() => onDelete(m)} className="text-danger hover:bg-danger-soft"><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                )}
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    </TableWrap>
  );
}
