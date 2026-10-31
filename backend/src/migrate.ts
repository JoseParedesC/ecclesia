import { readFileSync } from "node:fs";
import { pool } from "./db.js";

/** Aplica db/schema.sql (idempotente). Funciona igual desde src/ (tsx) y desde dist/ (node). */
export async function runMigrations() {
  const sql = readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8");
  await pool.query(sql);
  console.log("Esquema de base de datos verificado/aplicado.");
}
