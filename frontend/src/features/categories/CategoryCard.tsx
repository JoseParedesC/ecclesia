import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { Badge, Button, Card, Collapse, Switch } from "../../components/ui";
import { cn } from "../../lib/cn";
import type { Category, CategoryConfig } from "../../types";
import { FormPreview } from "./FormPreview";
import { normalizeConfig, sameConfig, toConfig } from "./rules";

/** Tarjeta desplegable con las 4 opciones de una categoría. */
export function CategoryCard({ category, saving, onSave }: { category: Category; saving: boolean; onSave: (c: CategoryConfig) => void }) {
  const [open, setOpen] = useState(false);
  const saved = toConfig(category);
  const [draft, setDraft] = useState<CategoryConfig>(saved);
  const set = (patch: Partial<CategoryConfig>) => setDraft((d) => normalizeConfig({ ...d, ...patch }));
  const dirty = !sameConfig(draft, saved);
  return (
    <Card className="animate-slide-up transition-shadow duration-300 hover:shadow-soft">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full items-center justify-between gap-3 p-5 text-left">
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-serif text-lg">{category.name}</span>
          {saved.hasDefaultAmount && <Badge>Valor sugerido{saved.defaultAmountEditable ? "" : " fijo"}</Badge>}
          {saved.usesDate && <Badge>Fecha{saved.dateRequired ? " obligatoria" : ""}</Badge>}
        </span>
        <ChevronDown className={cn("h-5 w-5 text-muted transition-transform duration-300", open && "rotate-180")} aria-hidden="true" />
      </button>
      <Collapse open={open}>
        <div className="grid gap-5 border-t border-line p-5 md:grid-cols-2">
          <div className="space-y-1">
            <Switch label="Tiene valor sugerido" hint="Cada tipo de esta categoría puede definir un valor." checked={draft.hasDefaultAmount} onChange={(v) => set({ hasDefaultAmount: v })} />
            <Collapse open={draft.hasDefaultAmount}>
              <div className="ml-4 border-l-2 border-line pl-2">
                <Switch label="Se puede cambiar el valor sugerido" hint="Si se apaga, el monto queda fijo." checked={draft.defaultAmountEditable} onChange={(v) => set({ defaultAmountEditable: v })} />
              </div>
            </Collapse>
            <Switch label="Maneja fecha" hint="Agrega una fecha asociada al movimiento." checked={draft.usesDate} onChange={(v) => set({ usesDate: v })} />
            <Collapse open={draft.usesDate}>
              <div className="ml-4 border-l-2 border-line pl-2">
                <Switch label="La fecha es obligatoria" checked={draft.dateRequired} onChange={(v) => set({ dateRequired: v })} />
              </div>
            </Collapse>
            <div className="flex justify-end gap-2 pt-3">
              <Button onClick={() => setDraft(saved)} disabled={!dirty}>Descartar</Button>
              <Button variant="primary" loading={saving} disabled={!dirty} onClick={() => onSave(draft)}>Guardar cambios</Button>
            </div>
          </div>
          <FormPreview config={draft} />
        </div>
      </Collapse>
    </Card>
  );
}
