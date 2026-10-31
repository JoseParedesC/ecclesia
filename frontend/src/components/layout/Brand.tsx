import { Landmark } from "lucide-react";

export function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-ink shadow-soft"><Landmark className="h-5 w-5" aria-hidden="true" /></span>
      <span className="font-serif text-lg font-semibold leading-tight">Finanzas<br />parroquiales</span>
    </div>
  );
}
