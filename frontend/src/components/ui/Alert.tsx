import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

const tones = {
  error: { box: "border-danger/30 bg-danger-soft text-danger", Icon: AlertCircle },
  success: { box: "border-success/30 bg-success-soft text-success", Icon: CheckCircle2 },
  warning: { box: "border-warning/30 bg-warning-soft text-warning", Icon: TriangleAlert },
  info: { box: "border-primary/40 bg-primary-soft text-primary_", Icon: Info },
} as const;

export function Alert({ tone = "info", children, className }: { tone?: keyof typeof tones; children: ReactNode; className?: string }) {
  const { box, Icon } = tones[tone];
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cn("flex animate-slide-down items-start gap-2.5 rounded-lg border border-l-4 px-3.5 py-3 text-sm shadow-soft", box, className)}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
