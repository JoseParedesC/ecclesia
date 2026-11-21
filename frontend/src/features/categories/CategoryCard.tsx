import { ChevronDown, Lock, Trash2 } from "lucide-react";
import { useState } from "react";
import { Badge, Button, Card, Collapse, Input } from "../../components/ui";
import { cn } from "../../lib/cn";
import type { Category, CategoryConfig } from "../../types";
import { ConfigFields } from "./ConfigFields";
import { FormPreview } from "./FormPreview";
import { sameConfig, toConfig } from "./rules";

export type CategorySave = CategoryConfig & { name?: string };

/** Tarjeta desplegable: nombre, las 4 opciones, vista previa y eliminación. */
export function CategoryCard({ category, saving, onSave, onDelete }: {
  category: Category; saving: boolean; onSave: (c: CategorySave) => void; onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const saved = toConfig(category);
  const [draft, setDraft] = useState<CategoryConfig>(saved);
  const [name, setName] = useState(category.name);
  const nameOk = name.trim().length > 0;
  const dirty = !sameConfig(draft, saved) || (!category.protected && name.trim() !== category.name);
  const inUse = (category.typeCount ?? 0) > 0;
  return (
    <Card className="animate-slide-up transition-shadow duration-300 hover:shadow-soft">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full items-center justify-between gap-3 p-5 text-left">
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-serif text-lg">{category.name}</span>
          {category.protected && <Lock className="h-4 w-4 text-muted" aria-label="Categoría del sistema" />}
          {saved.hasDefaultAmount && <Badge>Valor sugerido{saved.defaultAmountEditable ? "" : " fijo"}</Badge>}
          {saved.usesDate && <Badge>Fecha{saved.dateRequired ? " obligatoria" : ""}</Badge>}
        </span>
        <span className="flex items-center gap-3 text-xs text-muted">
          {category.typeCount ?? 0} tipo(s)
          <ChevronDown className={cn("h-5 w-5 transition-transform duration-300", open && "rotate-180")} aria-hidden="true" />
        </span>
      </button>
      <Collapse open={open}>
        <div className="grid gap-5 border-t border-line p-5 md:grid-cols-2">
          <div className="space-y-3">
            <Input label="Nombre" value={name} disabled={category.protected} maxLength={60} onChange={(e) => setName(e.target.value)}
              hint={category.protected ? "El sistema usa esta categoría en los comprobantes; su nombre no cambia." : undefined} />
            <ConfigFields value={draft} onChange={setDraft} />
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <Button variant="danger" onClick={onDelete} disabled={category.protected || inUse} title={inUse ? "Tiene tipos asociados" : undefined}>
                <Trash2 className="h-4 w-4" aria-hidden="true" />Eliminar
              </Button>
              <span className="flex gap-2">
                <Button onClick={() => { setDraft(saved); setName(category.name); }} disabled={!dirty}>Descartar</Button>
                <Button variant="primary" loading={saving} disabled={!dirty || !nameOk}
                  onClick={() => onSave({ ...draft, ...(category.protected ? {} : { name: name.trim() }) })}>Guardar cambios</Button>
              </span>
            </div>
          </div>
          <FormPreview config={draft} />
        </div>
      </Collapse>
    </Card>
  );
}
