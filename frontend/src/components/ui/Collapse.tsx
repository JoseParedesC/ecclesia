import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

/** Muestra/oculta contenido animando la altura sin medirla. */
export function Collapse({ open, children }: { open: boolean; children: ReactNode }) {
  return (
    <div className={cn("grid transition-[grid-template-rows,opacity] duration-300 ease-out", open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")} aria-hidden={!open}>
      <div className="overflow-hidden">{children}</div>
    </div>
  );
}
