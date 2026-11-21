import { Collapse, Switch } from "../../components/ui";
import type { CategoryConfig } from "../../types";
import { normalizeConfig } from "./rules";

/** Las 4 opciones de una categoría; se reutiliza al crear y al editar. */
export function ConfigFields({ value, onChange }: { value: CategoryConfig; onChange: (c: CategoryConfig) => void }) {
  const set = (patch: Partial<CategoryConfig>) => onChange(normalizeConfig({ ...value, ...patch }));
  return (
    <div className="space-y-1">
      <Switch label="Tiene valor sugerido" hint="Cada tipo de esta categoría puede definir un valor." checked={value.hasDefaultAmount} onChange={(v) => set({ hasDefaultAmount: v })} />
      <Collapse open={value.hasDefaultAmount}>
        <div className="ml-4 border-l-2 border-line pl-2">
          <Switch label="Se puede cambiar el valor sugerido" hint="Si se apaga, el monto queda fijo." checked={value.defaultAmountEditable} onChange={(v) => set({ defaultAmountEditable: v })} />
        </div>
      </Collapse>
      <Switch label="Maneja fecha" hint="Agrega una fecha asociada al movimiento." checked={value.usesDate} onChange={(v) => set({ usesDate: v })} />
      <Collapse open={value.usesDate}>
        <div className="ml-4 border-l-2 border-line pl-2">
          <Switch label="La fecha es obligatoria" checked={value.dateRequired} onChange={(v) => set({ dateRequired: v })} />
        </div>
      </Collapse>
    </div>
  );
}
