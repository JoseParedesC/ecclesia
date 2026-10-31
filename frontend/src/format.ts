const nf = new Intl.NumberFormat("es-CO", { style: "currency", currency: import.meta.env.VITE_CURRENCY ?? "COP" });
export const money = (n: number) => nf.format(n);
export const pad = (n: number) => String(n).padStart(2, "0");
export const MONTHS = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
export const periodLabel = (p: { year: number; month: number }) => `${MONTHS[p.month - 1]} ${p.year}`;
