import { Plus } from "lucide-react";
import { useState } from "react";
import { Button, Card, Collapse, Input } from "../../components/ui";
import type { CategoryConfig } from "../../types";
import { ConfigFields } from "./ConfigFields";
import { FormPreview } from "./FormPreview";

const EMPTY: CategoryConfig = { hasDefaultAmount: false, defaultAmountEditable: true, usesDate: false, dateRequired: false };

/** Botón «Nueva categoría» que despliega el formulario de creación. */
export function NewCategoryPanel({ kindLabel, saving, onCreate }: {
  kindLabel: string; saving: boolean; onCreate: (name: string, cfg: CategoryConfig) => Promise<boolean>;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [cfg, setCfg] = useState<CategoryConfig>(EMPTY);
  const reset = () => { setOpen(false); setName(""); setCfg(EMPTY); };
  return (
    <div className="mb-4">
      <Button variant="primary" onClick={() => (open ? reset() : setOpen(true))} aria-expanded={open}>
        <Plus className={`h-4 w-4 transition-transform duration-300 ${open ? "rotate-45" : ""}`} aria-hidden="true" />{open ? "Cancelar" : "Nueva categoría"}
      </Button>
      <Collapse open={open}>
        <Card className="mt-3">
          <form className="grid gap-5 p-5 md:grid-cols-2" onSubmit={async (e) => { e.preventDefault(); if (await onCreate(name.trim(), cfg)) reset(); }}>
            <div className="space-y-3">
              <Input label={`Nombre de la categoría de ${kindLabel}`} value={name} maxLength={60} required onChange={(e) => setName(e.target.value)} hint="El código interno se genera solo y no cambia después." />
              <ConfigFields value={cfg} onChange={setCfg} />
              <div className="flex justify-end pt-2"><Button type="submit" variant="primary" loading={saving} disabled={!name.trim()}>Crear categoría</Button></div>
            </div>
            <FormPreview config={cfg} />
          </form>
        </Card>
      </Collapse>
    </div>
  );
}
