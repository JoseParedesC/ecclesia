import { useState } from "react";
import { PageHeader } from "../components/layout/PageHeader";
import { Tabs } from "../components/ui";
import { IntentionsReport } from "../features/reports/IntentionsReport";
import { MonthlyReport } from "../features/reports/MonthlyReport";
import { MovementsReport } from "../features/reports/MovementsReport";

type Kind = "income" | "expense" | "intentions" | "monthly";

export default function Reports() {
  const [kind, setKind] = useState<Kind>("income");
  return (
    <>
      <div className="print:hidden">
        <PageHeader title="Reportes" description="Genera el reporte con los filtros que necesites e imprímelo o guárdalo como PDF desde el diálogo de impresión." />
        <div className="mb-5 overflow-x-auto">
          <Tabs value={kind} onChange={setKind} items={[
            { value: "income", label: "Ingresos" }, { value: "expense", label: "Egresos" },
            { value: "intentions", label: "Intenciones" }, { value: "monthly", label: "Consolidado mensual" },
          ]} />
        </div>
      </div>
      <div key={kind}>
        {kind === "income" && <MovementsReport kind="income" />}
        {kind === "expense" && <MovementsReport kind="expense" />}
        {kind === "intentions" && <IntentionsReport />}
        {kind === "monthly" && <MonthlyReport />}
      </div>
    </>
  );
}
