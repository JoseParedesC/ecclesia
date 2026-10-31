import type { ReactNode } from "react";
import { money } from "../../format";
import { cn } from "../../lib/cn";
import type { Parish, StipendReceiptData } from "../../types";

export const receiptNumber = (id: number) => `EST-${String(id).padStart(6, "0")}`;
const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" }) : "—");

const Field = ({ label, children, className }: { label: string; children: ReactNode; className?: string }) => (
  <div className={cn("min-w-0", className)}>
    <dt className="text-[9px] font-semibold uppercase tracking-wider text-muted">{label}</dt>
    <dd className="break-words text-[12px] leading-snug">{children || "—"}</dd>
  </div>
);

/**
 * Comprobante de estipendio: información de la parroquia + información de la intención.
 * Al imprimir ocupa como máximo media hoja carta (dos comprobantes por hoja).
 * Es el mismo formato en el listado de ingresos y en el reporte de estipendios.
 */
export function StipendReceipt({ r, parish }: { r: StipendReceiptData; parish: Parish | null }) {
  return (
    <section
      className="stipend-receipt break-inside-avoid rounded-xl border border-line bg-surface p-5 shadow-soft print:max-h-[4.9in] print:overflow-hidden print:rounded-none print:border-dashed print:border-ink/50 print:bg-white print:p-[0.2in] print:shadow-none"
      aria-label={`Comprobante ${receiptNumber(r.id)}`}
    >
      <header className="flex items-start justify-between gap-4 border-b-2 border-primary_ pb-2.5">
        <div className="flex min-w-0 items-center gap-3">
          {parish?.logo && <img src={parish.logo} alt="" className="h-12 w-12 shrink-0 object-contain" />}
          <div className="min-w-0 text-[11px] leading-snug text-muted">
            <p className="font-serif text-[15px] font-semibold text-ink">{parish?.name ?? "Ecclesia · Finanzas parroquiales"}</p>
            {parish && <p>{parish.address} · {parish.city}, {parish.department}</p>}
            {(parish?.phone || parish?.email) && <p>{[parish.phone, parish.email].filter(Boolean).join(" · ")}</p>}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[9px] font-semibold uppercase tracking-wider text-muted">Comprobante de estipendio</p>
          <p className="font-serif text-xl font-semibold tabular-nums text-primary_">{receiptNumber(r.id)}</p>
        </div>
      </header>

      <dl className="mt-3 grid grid-cols-3 gap-x-4 gap-y-2">
        <Field label="Estipendio">{r.typeName}</Field>
        <Field label="Fecha de registro" className="tabular-nums">{r.date}</Field>
        <Field label="Se realizará el" className="tabular-nums">{r.intentionDate}</Field>
        <Field label="Mención o petición" className="col-span-3"><span className="line-clamp-3">{r.description}</span></Field>
      </dl>

      <dl className="mt-3 grid grid-cols-3 gap-x-4 gap-y-2 border-t border-line pt-3">
        <Field label="Responsable" className="col-span-2">{r.responsible}</Field>
        <Field label="Identificación" className="tabular-nums">{r.idType ? `${r.idType} ${r.idNumber ?? ""}` : null}</Field>
        <Field label="Dirección" className="col-span-2"><span className="line-clamp-2">{r.address}</span></Field>
        <Field label="Teléfono" className="tabular-nums">{r.phone}</Field>
        {r.email && <Field label="Correo" className="col-span-3">{r.email}</Field>}
      </dl>

      <footer className="mt-3 flex items-end justify-between gap-4 border-t border-line pt-3">
        <div className="min-w-0 space-y-3">
          <p className="text-[10px] leading-snug text-muted">Registrado por {r.registeredBy ?? "—"}<br />{when(r.createdAt)}</p>
          <p className="w-44 border-t border-ink/50 pt-0.5 text-[9px] uppercase tracking-wider text-muted">Recibido por</p>
        </div>
        <div className="shrink-0 rounded-lg border border-primary_/40 bg-primary-soft px-4 py-2 text-right print:bg-white">
          <p className="text-[9px] font-semibold uppercase tracking-wider text-muted">Valor recibido</p>
          <p className="font-serif text-xl font-semibold tabular-nums">{money(r.amount)}</p>
        </div>
      </footer>
    </section>
  );
}

/** Varios comprobantes en la hoja: dos por hoja carta al imprimir. */
export function StipendSheet({ rows, parish }: { rows: StipendReceiptData[]; parish: Parish | null }) {
  return <div className="grid gap-5 print:gap-[0.12in]">{rows.map((r) => <StipendReceipt key={r.id} r={r} parish={parish} />)}</div>;
}
