import { SearchX } from "lucide-react";
import { EmptyState, Table, Td, Th, Tr } from "../../components/ui";
import { money } from "../../format";
import type { ReportRow } from "../../types";

export type Column = "date" | "eventDate" | "type" | "category" | "account" | "responsible" | "identification" | "description";
const labels: Record<Column, string> = {
  date: "Fecha", eventDate: "Fecha asociada", type: "Tipo", category: "Categoría", account: "Cuenta", responsible: "Responsable", identification: "Identificación", description: "Descripción",
};

export function ReportTable({ rows, columns, showEventDate }: { rows: ReportRow[]; columns: Column[]; showEventDate?: boolean }) {
  if (!rows.length) return <EmptyState icon={SearchX} title="Sin resultados">No hay registros para los filtros elegidos.</EmptyState>;
  const cell = (r: ReportRow, c: Column) =>
    c === "category" ? r.categoryName
    : c === "description" ? r.description ?? "—"
    : c === "identification" ? (r.idType ? `${r.idType} ${r.idNumber ?? ""}`.trim() : "—")
    : (r[c] as string | null | undefined) ?? "—";
  return (
    <div className="overflow-x-auto print:overflow-visible">
      <Table>
        <thead>
          <tr>
            {columns.filter((c) => c !== "eventDate" || (showEventDate ?? rows.some((r) => r.usesDate))).map((c) => <Th key={c}>{labels[c]}</Th>)}
            <Th className="text-right">Monto</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <Tr key={r.id}>
              {columns.filter((c) => c !== "eventDate" || (showEventDate ?? rows.some((x) => x.usesDate))).map((c) => <Td key={c} className={c === "description" ? "max-w-xs" : "whitespace-nowrap"}>{cell(r, c)}</Td>)}
              <Td className="whitespace-nowrap text-right font-medium tabular-nums">{money(r.amount)} {r.fixedAmount && <span className="ml-1 text-xs text-muted">(fijo)</span>}</Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
