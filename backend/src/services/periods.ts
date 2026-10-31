import type { PoolClient } from "pg";
import { HttpError } from "../errors.js";

export const periodKey = (year: number, month: number) => year * 12 + (month - 1);

/** Regla de negocio: máximo 2 períodos abiertos y deben ser meses consecutivos. */
export function assertValidOpenSet(keys: number[]) {
  if (keys.length > 2)
    throw new HttpError(409, "Solo pueden existir 2 períodos abiertos a la vez. Cierra primero el más antiguo.");
  if (keys.length === 2 && Math.abs(keys[0] - keys[1]) !== 1)
    throw new HttpError(409, "Los dos períodos abiertos deben ser meses consecutivos.");
}

export async function lockPeriods(c: PoolClient) {
  await c.query("SELECT pg_advisory_xact_lock(7001)");
}

export async function assertCanBeOpen(c: PoolClient, year: number, month: number) {
  const { rows } = await c.query("SELECT year, month FROM periods WHERE status = 'OPEN'");
  assertValidOpenSet([...rows.map((r) => periodKey(r.year, r.month)), periodKey(year, month)]);
}

/** Devuelve el id del período OPEN que corresponde a una fecha 'YYYY-MM-DD' o lanza error. */
export async function requireOpenPeriodForDate(c: PoolClient, date: string) {
  const [y, m] = date.split("-").map(Number);
  const { rows } = await c.query("SELECT id, status FROM periods WHERE year = $1 AND month = $2", [y, m]);
  const label = `${y}-${String(m).padStart(2, "0")}`;
  if (!rows[0]) throw new HttpError(409, `El período ${label} no existe. Ábrelo primero en Períodos.`);
  if (rows[0].status !== "OPEN") throw new HttpError(409, `El período ${label} está cerrado.`);
  return rows[0].id as number;
}
