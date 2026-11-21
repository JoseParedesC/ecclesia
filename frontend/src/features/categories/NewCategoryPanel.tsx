import { Plus } from "lucide-react";
import { Button, Card, Collapse, Input } from "../../components/ui";
import type { CategoryConfig } from "../../types";
import { ConfigFields } from "./ConfigFields";
import { FormPreview } from "./FormPreview";

export interface NewCategoryDraft { name: string; cfg: CategoryConfig }
export const EMPTY_DRAFT: NewCategoryDraft = { name: "", cfg: { hasDefaultAmount: false, defaultAmountEditable: true, usesDate: false, dateRequired: false } };

/** Formulario de creación. Es controlado: la página decide si está abierto (`draft` ≠ null) y conserva los datos. */
export function NewCategoryPanel({ kindLabel, draft, saving, onChange, onSubmit }: {
  kindLabel: string; draft: NewCategoryDraft | null; saving: boolean;
  onChange: (d: NewCategoryDraft | null) => void; onSubmit: (d: NewCategoryDraft) => void;
}) {
  const open = draft !== null;
  const d = draft ?? EMPTY_DRAFT;
  return (
    <div className="mb-4">
      <Button variant="primary" disabled={saving} onClick={() => onChange(open ? null : EMPTY_DRAFT)} aria-expanded={open}>
        <Plus className={`h-4 w-4 transition-transform duration-300 ${open ? "rotate-45" : ""}`} aria-hidden="true" />{open ? "Cancelar" : "Nueva categoría"}
      </Button>
      <Collapse open={open}>
        <Card className="mt-3">
          <form className="grid gap-6 p-5 md:grid-cols-2" onSubmit={(e) => { e.preventDefault(); if (!saving && d.name.trim()) onSubmit(d); }}>
            <div className="space-y-3">
              <Input label={`Nombre de la categoría de ${kindLabel}`} value={d.name} maxLength={60} required onChange={(e) => onChange({ ...d, name: e.target.value })}
                hint="El código interno se genera solo y no cambia después." />
              <ConfigFields value={d.cfg} onChange={(cfg) => onChange({ ...d, cfg })} />
              <div className="flex justify-end pt-2"><Button type="submit" variant="primary" loading={saving} disabled={!d.name.trim()}>Crear categoría</Button></div>
            </div>
            <FormPreview config={d.cfg} />
          </form>
        </Card>
      </Collapse>
    </div>
  );
}
