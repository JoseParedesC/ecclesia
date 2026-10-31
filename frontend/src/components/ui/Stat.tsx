import { cn } from "../../lib/cn";

const tones = { neutral: "text-ink", success: "text-success", danger: "text-danger", primary: "text-primary" } as const;

export function Stat({ label, value, tone = "neutral" }: { label: string; value: string; tone?: keyof typeof tones }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-4 shadow-soft">
      <p className="text-sm text-muted">{label}</p>
      <p className={cn("mt-1 font-serif text-2xl font-semibold tabular-nums", tones[tone])}>{value}</p>
    </div>
  );
}
