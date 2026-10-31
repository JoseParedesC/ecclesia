import cors from "cors";
import express from "express";
import { CREATABLE_ROLES, authenticate, requireRole } from "./auth.js";
import { config } from "./config.js";
import { pool } from "./db.js";
import { errorHandler } from "./errors.js";
import { runMigrations } from "./migrate.js";
import { mastersRouter } from "./routes/masters.js";
import { movementsRouter } from "./routes/movements.js";
import { periodsRouter } from "./routes/periods.js";
import { reportsRouter } from "./routes/reports.js";
import { usersRouter } from "./routes/users.js";

// Crea las tablas si no existen (desactivar con AUTO_MIGRATE=false)
if (process.env.AUTO_MIGRATE !== "false") await runMigrations();

// Garantiza que el administrador inicial exista, esté activo y tenga rol de administrador.
// Si corriges BOOTSTRAP_ADMIN_EMAIL, el nuevo correo se registra en el siguiente arranque.
const bootstrapEmail = config.bootstrapAdmin?.trim();
if (bootstrapEmail) {
  if (bootstrapEmail === "tu-correo@gmail.com")
    console.warn("BOOTSTRAP_ADMIN_EMAIL tiene el valor de ejemplo; usa el correo real de tu cuenta de Google.");
  await pool.query(
    `INSERT INTO users (email, role, active) VALUES ($1, 'administrador', true)
     ON CONFLICT (lower(email)) DO UPDATE SET role = 'administrador', active = true`,
    [bootstrapEmail],
  );
  console.log(`Administrador inicial asegurado: ${bootstrapEmail}`);
}

const app = express();
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

app.get("/api/health", (_req, res) => void res.json({ ok: true }));

const api = express.Router();
api.use(authenticate);
api.get("/me", (req, res) => void res.json({ ...req.user, creatableRoles: CREATABLE_ROLES[req.user!.role] }));
api.get("/categories/:kind", async (req, res) => {
  const table = req.params.kind === "income" ? "income_categories" : "expense_categories";
  res.json((await pool.query(`SELECT id, code, name FROM ${table} ORDER BY id`)).rows);
});
api.use("/income-types", mastersRouter("income"));
api.use("/expense-types", mastersRouter("expense"));
api.use("/incomes", movementsRouter("income"));
api.use("/expenses", movementsRouter("expense"));
api.use("/periods", periodsRouter);
api.use("/reports", reportsRouter);
api.use("/users", requireRole("administrador", "sacerdote", "secretario"), usersRouter);
app.use("/api", api);

app.use(errorHandler);
app.listen(config.port, () => console.log(`API en http://localhost:${config.port}`));
