import cors from "cors";
import express from "express";
import { authenticate, requireRole } from "./auth.js";
import { config } from "./config.js";
import { pool } from "./db.js";
import { errorHandler } from "./errors.js";
import { mastersRouter } from "./routes/masters.js";
import { movementsRouter } from "./routes/movements.js";
import { periodsRouter } from "./routes/periods.js";
import { usersRouter } from "./routes/users.js";

if (config.bootstrapAdmin) {
  const { rowCount } = await pool.query("SELECT 1 FROM users LIMIT 1");
  if (!rowCount) {
    await pool.query("INSERT INTO users (email, role) VALUES ($1, 'administrador')", [config.bootstrapAdmin]);
    console.log(`Administrador inicial creado: ${config.bootstrapAdmin}`);
  }
}

const app = express();
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

app.get("/api/health", (_req, res) => void res.json({ ok: true }));

const api = express.Router();
api.use(authenticate);
api.get("/me", (req, res) => void res.json(req.user));
api.get("/categories/:kind", async (req, res) => {
  const table = req.params.kind === "income" ? "income_categories" : "expense_categories";
  res.json((await pool.query(`SELECT id, code, name FROM ${table} ORDER BY id`)).rows);
});
api.use("/income-types", mastersRouter("income"));
api.use("/expense-types", mastersRouter("expense"));
api.use("/incomes", movementsRouter("income"));
api.use("/expenses", movementsRouter("expense"));
api.use("/periods", periodsRouter);
api.use("/users", requireRole("administrador"), usersRouter);
app.use("/api", api);

app.use(errorHandler);
app.listen(config.port, () => console.log(`API en http://localhost:${config.port}`));
