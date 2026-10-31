import { forwardRef, useId, type InputHTMLAttributes } from "react";
import { CURRENCY_SYMBOL, DECIMAL_SEP, GROUP_SEP } from "../../format";
import { cn } from "../../lib/cn";
import { Shell, controlClass, type Shared } from "./Field";

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const NOT_MONEY = new RegExp(`[^0-9${escapeRe(DECIMAL_SEP)}]`, "g");

/** Valor crudo ("1500.5") → texto con moneda ("$ 1.500,5"). Vacío se queda vacío. */
export function formatMoneyInput(raw: string): string {
  if (raw === "") return "";
  const [int, dec] = raw.split(".");
  const grouped = (int || "0").replace(/\B(?=(\d{3})+(?!\d))/g, GROUP_SEP);
  return `${CURRENCY_SYMBOL} ${grouped}${dec !== undefined ? DECIMAL_SEP + dec : ""}`;
}

/** Lo que escribe la persona → valor crudo ("1500.5"): solo dígitos, un separador decimal y hasta 2 decimales. */
export function parseMoneyInput(text: string): string {
  const [intRaw, ...rest] = text.replace(NOT_MONEY, "").split(DECIMAL_SEP);
  const int = intRaw.replace(/^0+(?=\d)/, "").slice(0, 12); // numeric(14,2): 12 enteros + 2 decimales
  if (!rest.length) return int;
  return `${int || "0"}.${rest.join("").slice(0, 2)}`;
}

interface Props extends Shared, Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> {
  /** Valor crudo con punto decimal ("1500.5"), o "" si está vacío. */
  value: string;
  onValueChange: (raw: string) => void;
}

/** Campo de valor: muestra siempre el símbolo de moneda con separadores de miles, alineado a la derecha. */
export const MoneyInput = forwardRef<HTMLInputElement, Props>(
  ({ label, hint, error, hideLabel, value, onValueChange, className, ...rest }, ref) => {
    const id = useId();
    return (
      <Shell id={id} label={label} hint={hint} error={error} hideLabel={hideLabel} className={className}>
        <input
          id={id} ref={ref} type="text" inputMode="decimal" autoComplete="off" aria-invalid={error ? true : undefined}
          placeholder={`${CURRENCY_SYMBOL} 0`} className={cn(controlClass, "text-right tabular-nums")}
          value={formatMoneyInput(value)} onChange={(e) => onValueChange(parseMoneyInput(e.target.value))}
          // El punto es separador de miles en es-CO, pero muchos teclados numéricos lo usan como decimal:
          // al teclearlo se interpreta como coma decimal en vez de perderse (evita $ 1500.50 → $ 150.050).
          onKeyDown={(e) => {
            if (e.key === "." && DECIMAL_SEP !== ".") {
              e.preventDefault();
              if (!value.includes(".")) onValueChange(`${value || "0"}.`);
            }
          }}
          // Pegar "1500.50" (punto + 1 o 2 decimales, sin comas) se entiende como decimal; "1.500" sigue siendo miles.
          onPaste={(e) => {
            const text = e.clipboardData.getData("text").trim();
            const m = text.match(/^[^\d-]*(\d+)\.(\d{1,2})$/);
            if (m && !text.includes(DECIMAL_SEP)) {
              e.preventDefault();
              onValueChange(parseMoneyInput(`${m[1]}${DECIMAL_SEP}${m[2]}`));
            }
          }}
          {...rest}
        />
      </Shell>
    );
  },
);
