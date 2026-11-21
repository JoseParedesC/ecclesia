import { CalendarDays, Eye, Lock, Pencil } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../../lib/cn";
import type { CategoryConfig } from "../../types";

const chip = "inline-flex items-center gap-1 rounded-full bg-primary_/15 px-2.5 py-0.5 text-xs font-semibold text-primary_";

function Field({ label, active, children, note }: { label: string; active: boolean; children: ReactNode; note: string }) {
  return (
    <div className={cn("transition-all duration-300", active ? "opacity-100" : "opacity-60")}>
      <p className="mb-1.5 text-sm font-semibold text-ink">{label}</p>
      <div className="flex min-h-[3rem] items-center justify-between gap-3 rounded-lg border-2 border-line bg-surface px-4 text-base shadow-soft transition-all duration-300">{children}</div>
      <p className="mt-1.5 text-sm text-muted transition-opacity duration-300">{note}</p>
    </div>
  );
}

/** Banner con la vista previa en vivo de cómo se comportan los campos del formulario con esta configuración. */
export function FormPreview({ config }: { config: CategoryConfig }) {
  const { hasDefaultAmount: def, defaultAmountEditable: ed, usesDate: date, dateRequired: req } = config;
  return (
    <aside aria-label="Vista previa del formulario" aria-live="polite"
      className="space-y-5 self-start rounded-xl border border-line border-l-4 border-l-primary_ bg-mist p-6 shadow-soft md:sticky md:top-4">
      <header className="flex items-center gap-2.5">
        <Eye className="h-6 w-6 text-primary_" aria-hidden="true" />
        <h3 className="font-serif text-xl">Así se verá en el formulario</h3>
      </header>
      <Field label="Valor" active
        note={def ? (ed ? "Se propone el valor sugerido del tipo y se puede cambiar." : "Se usa el valor sugerido del tipo y no se puede cambiar.") : "Quien registra escribe el valor."}>
        <span className="font-semibold tabular-nums">$ {def ? "20.000" : "0"}</span>
        {def && (ed
          ? <span className={chip}><Pencil className="h-3.5 w-3.5" aria-hidden="true" />Sugerido · editable</span>
          : <span className={chip}><Lock className="h-3.5 w-3.5" aria-hidden="true" />Valor fijo</span>)}
      </Field>
      <Field label={date ? `Fecha asociada${req ? " *" : ""}` : "Fecha asociada"} active={date}
        note={!date ? "Esta categoría no maneja fecha: el campo no aparece." : req ? "Es obligatoria: no se puede guardar sin ella." : "Es opcional."}>
        <span className="flex items-center gap-2 text-muted"><CalendarDays className="h-5 w-5" aria-hidden="true" />{date ? "dd/mm/aaaa" : "Sin campo de fecha"}</span>
        {date && <span className={chip}>{req ? "Obligatoria" : "Opcional"}</span>}
      </Field>
    </aside>
  );
}
