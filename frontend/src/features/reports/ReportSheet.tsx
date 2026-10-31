import type { ReactNode } from "react";
import { useAuth } from "../../auth";
import { money } from "../../format";
import { useParish } from "../../parish";
import type { ReportTotals } from "../../types";

/** Hoja del reporte: se ve como documento en pantalla y es lo único que se imprime. */
export function ReportSheet({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  const { me } = useAuth();
  const { parish } = useParish();
  const generated = new Date().toLocaleString("es-CO", { dateStyle: "long", timeStyle: "short" });
  return (
    <article className="animate-fade-in rounded-lg border border-line bg-surface p-6 shadow-soft print:rounded-none print:border-0 print:p-0 print:shadow-none">
      <header className="mb-5 flex flex-wrap items-start justify-between gap-4 border-b border-line pb-4">
        <div>
          <div className="mb-2 flex items-center gap-3">
            {parish?.logo && <img src={parish.logo} alt="" className="h-12 w-12 object-contain" />}
            <div className="text-xs leading-snug text-muted">
              <p className="font-serif text-sm font-semibold text-ink">{parish?.name ?? "Ecclesia · Finanzas parroquiales"}</p>
              {parish && <p>{parish.address} · {parish.city}, {parish.department}</p>}
              {(parish?.phone || parish?.email) && <p>{[parish.phone, parish.email].filter(Boolean).join(" · ")}</p>}
            </div>
          </div>
          <h2 className="text-2xl">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
        </div>
        <p className="text-right text-xs text-muted">Generado el {generated}<br />por {me?.name ?? me?.email}</p>
      </header>
      {children}
    </article>
  );
}

export function TotalsBlock({ totals, label = "Total" }: { totals: ReportTotals; label?: string }) {
  return (
    <dl className="ml-auto mt-4 grid w-full max-w-xs grid-cols-[1fr_auto] gap-x-6 gap-y-1.5 text-sm print:break-inside-avoid">
      {totals.byCategory.map((c) => (
        <div key={c.code} className="contents">
          <dt className="text-muted">{c.name} ({c.count})</dt>
          <dd className="text-right tabular-nums">{money(c.total)}</dd>
        </div>
      ))}
      <dt className="border-t border-line pt-1.5 font-semibold">{label} ({totals.count})</dt>
      <dd className="border-t border-line pt-1.5 text-right font-semibold tabular-nums">{money(totals.total)}</dd>
    </dl>
  );
}

export const periodRangeText = (from: string, to: string) =>
  from && to ? `Del ${from} al ${to}` : from ? `Desde el ${from}` : to ? `Hasta el ${to}` : "Todas las fechas";
