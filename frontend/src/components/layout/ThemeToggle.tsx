import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "../../lib/cn";
import { useTheme, type ThemePreference } from "../../theme/ThemeProvider";

const options: { value: ThemePreference; label: string; Icon: typeof Sun }[] = [
  { value: "light", label: "Tema claro", Icon: Sun },
  { value: "dark", label: "Tema oscuro", Icon: Moon },
  { value: "system", label: "Seguir el sistema", Icon: Monitor },
];

export function ThemeToggle() {
  const { preference, setPreference } = useTheme();
  return (
    <div role="radiogroup" aria-label="Tema" className="inline-flex rounded-full border border-line bg-mist p-1">
      {options.map(({ value, label, Icon }) => (
        <button
          key={value} role="radio" aria-checked={preference === value} aria-label={label} title={label}
          onClick={() => setPreference(value)}
          className={cn(
            "grid h-7 w-7 place-items-center rounded-full transition-all duration-base ease-standard",
            preference === value ? "bg-surface text-primary_ shadow-soft" : "text-muted hover:text-ink",
          )}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}
