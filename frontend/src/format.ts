const LOCALE = "es-CO";
const CURRENCY = import.meta.env.VITE_CURRENCY ?? "COP";
const currencyFormat = (digits: number) =>
  new Intl.NumberFormat(LOCALE, { style: "currency", currency: CURRENCY, currencyDisplay: "narrowSymbol", minimumFractionDigits: digits, maximumFractionDigits: digits });
const whole = currencyFormat(0);
const cents = currencyFormat(2);

/** Monto con símbolo: "$ 1.500" (enteros) o "$ 1.500,50" (con centavos). */
export const money = (n: number) => (Number.isInteger(n) ? whole : cents).format(n);

// Símbolo y separadores de la moneda configurada, para los campos de valor
const sample = currencyFormat(2).formatToParts(1234567.5);
const part = (t: string, fallback: string) => sample.find((p) => p.type === t)?.value ?? fallback;
export const CURRENCY_SYMBOL = part("currency", "$");
export const GROUP_SEP = part("group", ".");
export const DECIMAL_SEP = part("decimal", ",");
export const pad = (n: number) => String(n).padStart(2, "0");
export const MONTHS = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
export const periodLabel = (p: { year: number; month: number }) => `${MONTHS[p.month - 1]} ${p.year}`;

const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const today = () => iso(new Date());
export const monthStart = () => { const d = new Date(); d.setDate(1); return iso(d); };
