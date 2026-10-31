import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

const tones = {
  neutral: "bg-mist text-muted ring-line",
  primary: "bg-primary-soft text-primary_ ring-primary/30",
  success: "bg-success-soft text-success ring-success/25",
  danger: "bg-danger-soft text-danger ring-danger/25",
  warning: "bg-warning-soft text-warning ring-warning/25",
} as const;

export function Badge({ tone = "neutral", children }: { tone?: keyof typeof tones; children: ReactNode }) {
  return <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset before:h-1.5 before:w-1.5 before:rounded-full before:bg-current before:content-['']", tones[tone])}>{children}</span>;
}
