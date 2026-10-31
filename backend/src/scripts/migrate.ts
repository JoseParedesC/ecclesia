import { pool } from "../db.js";
import { runMigrations } from "../migrate.js";

await runMigrations();
await pool.end();
