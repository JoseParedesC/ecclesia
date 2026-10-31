import { cn } from "../../lib/cn";

export function Tabs<T extends string>({ value, onChange, items }: { value: T; onChange: (v: T) => void; items: { value: T; label: string }[] }) {
  return (
    <div role="tablist" className="inline-flex rounded-lg border border-line bg-mist p-1">
      {items.map((it) => (
        <button
          key={it.value} role="tab" type="button" aria-selected={value === it.value} onClick={() => onChange(it.value)}
          className={cn(
            "rounded px-4 py-1.5 text-sm font-medium transition-all duration-base ease-standard",
            value === it.value ? "bg-surface text-primary_ shadow-soft ring-1 ring-line" : "text-muted hover:text-ink",
          )}
        >{it.label}</button>
      ))}
    </div>
  );
}
