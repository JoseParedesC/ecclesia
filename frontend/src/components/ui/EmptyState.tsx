import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children?: ReactNode }) {
  return (
    <div className="flex animate-fade-in flex-col items-center gap-2 px-6 py-12 text-center">
      <span className="grid h-11 w-11 place-items-center rounded-full bg-primary-soft text-primary"><Icon className="h-5 w-5" aria-hidden="true" /></span>
      <p className="font-medium text-ink">{title}</p>
      {children && <p className="max-w-sm text-sm text-muted">{children}</p>}
    </div>
  );
}
