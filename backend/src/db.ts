import pg from "pg";
import { config } from "./config.js";

pg.types.setTypeParser(1082, (v) => v); // DATE -> 'YYYY-MM-DD' (sin zona horaria)
pg.types.setTypeParser(1700, (v) => Number(v)); // NUMERIC -> number

export const pool = new pg.Pool({ connectionString: config.databaseUrl });

export async function tx<T>(fn: (c: pg.PoolClient) => Promise<T>): Promise<T> {
  const c = await pool.connect();
  try {
    await c.query("BEGIN");
    const r = await fn(c);
    await c.query("COMMIT");
    return r;
  } catch (e) {
    await c.query("ROLLBACK");
    throw e;
  } finally {
    c.release();
  }
}
