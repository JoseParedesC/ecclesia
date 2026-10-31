import { Router } from "express";
import { z } from "zod";
import { pool } from "../db.js";
import { HttpError } from "../errors.js";

export const usersRouter = Router(); // montado solo para administrador

const role = z.enum(["sacerdote", "contador", "administrador", "secretario"]);
const SELECT = "SELECT id, email, name, role, active FROM users";

usersRouter.get("/", async (_req, res) => {
  res.json((await pool.query(`${SELECT} ORDER BY email`)).rows);
});

usersRouter.post("/", async (req, res) => {
  const b = z.object({ email: z.string().email(), name: z.string().trim().max(120).nullish(), role }).parse(req.body);
  const { rows } = await pool.query(
    "INSERT INTO users (email, name, role) VALUES ($1,$2,$3) RETURNING id, email, name, role, active",
    [b.email.trim(), b.name ?? null, b.role],
  );
  res.status(201).json(rows[0]);
});

usersRouter.patch("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const b = z.object({ name: z.string().trim().max(120).nullish(), role: role.optional(), active: z.boolean().optional() }).parse(req.body);
  if (id === req.user!.id && (b.active === false || (b.role && b.role !== "administrador")))
    throw new HttpError(409, "No puedes quitarte tu propio acceso de administrador.");
  const { rows } = await pool.query(
    `UPDATE users SET name = COALESCE($2, name), role = COALESCE($3, role), active = COALESCE($4, active)
     WHERE id = $1 RETURNING id, email, name, role, active`,
    [id, b.name ?? null, b.role ?? null, b.active ?? null],
  );
  if (!rows[0]) throw new HttpError(404, "Usuario no encontrado.");
  res.json(rows[0]);
});
