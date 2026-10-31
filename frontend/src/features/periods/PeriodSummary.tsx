import { Card, CardBody, CardHeader, Stat } from "../../components/ui";
import { money, periodLabel } from "../../format";
import type { Period, Totals } from "../../types";

export function PeriodSummary({ period, totals }: { period: Period; totals: Totals }) {
  const rows: [string, number][] = [
    ["Intenciones", totals.intencion], ["Donaciones", totals.donacion], ["Servicios", totals.servicio], ["Gastos", totals.gasto],
  ];
  return (
    <div className="animate-slide-up space-y-4">
      <h2 className="text-xl capitalize">Resumen de {periodLabel(period)}</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Total ingresos" value={money(totals.ingresos)} tone="success" />
        <Stat label="Total egresos" value={money(totals.egresos)} tone="danger" />
        <Stat label="Saldo del período" value={money(totals.saldo)} tone="primary" />
      </div>
      <Card>
        <CardHeader title="Desglose por categoría" />
        <CardBody>
          <dl className="grid grid-cols-[1fr_auto] gap-x-6 gap-y-2 text-sm">
            {rows.map(([k, v]) => (
              <div key={k} className="contents"><dt className="text-muted">{k}</dt><dd className="text-right tabular-nums">{money(v)}</dd></div>
            ))}
          </dl>
        </CardBody>
      </Card>
    </div>
  );
}
