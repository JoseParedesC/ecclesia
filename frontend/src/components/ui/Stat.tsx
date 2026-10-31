import { cn } from "../../lib/cn";

const tones = { neutral: "text-ink", success: "text-success", danger: "text-danger", primary: "text-primary_" } as const;

export function Stat({ label, value, tone = "neutral" }: { label: string; value: string; tone?: keyof typeof tones }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-line bg-surface p-4 shadow-soft before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:bg-gradient-to-r before:from-primary before:to-primary_ before:content-['']">
      <p className="text-xs font-medium uppercase tracking-wider text-muted">{label}</p>
      <p className={cn("mt-1 font-serif text-2xl font-semibold tabular-nums", tones[tone])}>{value}</p>
    </div>
  );
}
