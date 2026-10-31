import { Landmark } from "lucide-react";

export function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary_ text-primary-ink shadow-soft ring-1 ring-inset ring-white/30"><Landmark className="h-5 w-5" aria-hidden="true" /></span>
      <span className="leading-tight">
        <span className="block font-serif text-lg font-semibold">Ecclesia</span>
        <span className="block text-[11px] font-medium uppercase tracking-wider text-muted">Finanzas parroquiales</span>
      </span>
    </div>
  );
}
