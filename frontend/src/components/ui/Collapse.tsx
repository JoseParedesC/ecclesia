import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

/**
 * Muestra/oculta contenido animando la altura sin medirla.
 * Cerrado queda `inert`: sus controles no se pueden enfocar ni pulsar (antes seguían activos aunque no se vieran).
 */
export function Collapse({ open, children }: { open: boolean; children: ReactNode }) {
  const inert = open ? {} : ({ inert: "" } as Record<string, string>);
  return (
    <div className={cn("grid transition-[grid-template-rows,opacity] duration-300 ease-out", open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")} aria-hidden={!open} {...inert}>
      <div className="overflow-hidden">{children}</div>
    </div>
  );
}
