import { Landmark } from "lucide-react";
import { useParish } from "../../parish";

/** Marca del menú: usa el logo y el nombre de la parroquia si ya fueron configurados. */
export function Brand() {
  const { parish } = useParish();
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      {parish?.logo ? (
        <img src={parish.logo} alt="" className="h-9 w-9 shrink-0 rounded-xl bg-white object-contain p-0.5 shadow-soft ring-1 ring-line" />
      ) : (
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary_ text-primary-ink shadow-soft ring-1 ring-inset ring-white/30"><Landmark className="h-5 w-5" aria-hidden="true" /></span>
      )}
      <span className="min-w-0 leading-tight">
        <span className="block truncate font-serif text-lg font-semibold" title={parish?.name}>{parish?.name ?? "Ecclesia"}</span>
        <span className="block truncate text-[11px] font-medium uppercase tracking-wider text-muted">{parish ? `${parish.city}, ${parish.department}` : "Finanzas parroquiales"}</span>
      </span>
    </div>
  );
}
