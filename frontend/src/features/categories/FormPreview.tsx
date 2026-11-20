import { Lock } from "lucide-react";
import type { CategoryConfig } from "../../types";

/** Vista previa en vivo de cómo se comportan los campos del formulario con esta configuración. */
export function FormPreview({ config }: { config: CategoryConfig }) {
  const row = "flex items-center justify-between rounded-md border border-line bg-surface px-3 py-2 text-sm transition-all duration-300";
  return (
    <div className="space-y-2 rounded-lg bg-mist/60 p-3" aria-label="Vista previa del formulario">
      <p className="text-xs text-muted">Así se verá en el formulario</p>
      <div className={row}>
        <span className="text-muted">Valor</span>
        <span className="flex items-center gap-1.5 tabular-nums">
          {config.hasDefaultAmount ? "$ 20.000 (sugerido)" : "$ 0"}
          {config.hasDefaultAmount && !config.defaultAmountEditable && <Lock className="h-3.5 w-3.5 text-primary_" aria-label="No editable" />}
        </span>
      </div>
      <div className={`${row} ${config.usesDate ? "opacity-100" : "scale-[0.98] opacity-40"}`}>
        <span className="text-muted">{config.usesDate ? `Fecha${config.dateRequired ? " *" : " (opcional)"}` : "Sin campo de fecha"}</span>
        <span>{config.usesDate ? "dd/mm/aaaa" : "—"}</span>
      </div>
    </div>
  );
}
