import { CalendarDays, Download, LockKeyhole, LockKeyholeOpen, PieChart } from "lucide-react";
import { Badge, Button, EmptyState, Table, TableWrap, Td, Th, Tr } from "../../components/ui";
import { periodLabel } from "../../format";
import type { Period } from "../../types";

interface Props {
  periods: Period[]; canReopen: boolean; busyId: number | null;
  onClose: (p: Period) => void; onReopen: (p: Period) => void; onSummary: (p: Period) => void; onDownload: (p: Period) => void;
}

export function PeriodsTable({ periods, canReopen, busyId, onClose, onReopen, onSummary, onDownload }: Props) {
  if (!periods.length)
    return (
      <TableWrap>
        <EmptyState icon={CalendarDays} title="Aún no hay períodos">Abre el primer mes para comenzar a registrar ingresos y egresos.</EmptyState>
      </TableWrap>
    );
  return (
    <TableWrap>
      <Table>
        <thead><tr><Th>Período</Th><Th>Estado</Th><Th className="text-right">Acciones</Th></tr></thead>
        <tbody>
          {periods.map((p) => (
            <Tr key={p.id}>
              <Td className="font-medium capitalize">{periodLabel(p)}</Td>
              <Td><Badge tone={p.status === "OPEN" ? "success" : "neutral"}>{p.status === "OPEN" ? "Abierto" : "Cerrado"}</Badge></Td>
              <Td>
                <div className="flex flex-wrap justify-end gap-2">
                  {p.status === "OPEN" && <Button size="sm" loading={busyId === p.id} onClick={() => onClose(p)}><LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" />Cerrar mes</Button>}
                  {p.status === "CLOSED" && canReopen && <Button size="sm" loading={busyId === p.id} onClick={() => onReopen(p)}><LockKeyholeOpen className="h-3.5 w-3.5" aria-hidden="true" />Reabrir</Button>}
                  <Button size="sm" variant="ghost" onClick={() => onSummary(p)}><PieChart className="h-3.5 w-3.5" aria-hidden="true" />Resumen</Button>
                  <Button size="sm" variant="ghost" onClick={() => onDownload(p)}><Download className="h-3.5 w-3.5" aria-hidden="true" />Consolidado</Button>
                </div>
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    </TableWrap>
  );
}
