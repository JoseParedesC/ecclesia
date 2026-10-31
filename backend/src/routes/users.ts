import { Router } from "express";
import { z } from "zod";
import { CREATABLE_ROLES } from "../auth.js";
import { pool } from "../db.js";
import { HttpError } from "../errors.js";

/**
 * Gestión de usuarios. Cada rol solo ve y gestiona los roles que puede crear:
 *  administrador → todos · sacerdote → contador y secretario · secretario → secretario · contador → ninguno
 */
export const usersRouter = Router();

const role = z.enum(["sacerdote", "contador", "administrador", "secretario"]);
const COLS = "id, email, name, role, active";
const allowedFor = (req: { user?: { role: keyof typeof CREATABLE_ROLES } }) => CREATABLE_ROLES[req.user!.role];

usersRouter.get("/", async (req, res) => {
  const { rows } = await pool.query(`SELECT ${COLS} FROM users WHERE role = ANY($1::user_role[]) ORDER BY email`, [allowedFor(req)]);
  res.json(rows);
});

usersRouter.post("/", async (req, res) => {
  const b = z.object({ email: z.string().trim().toLowerCase().email(), name: z.string().trim().max(120).nullish(), role }).parse(req.body);
  if (!allowedFor(req).includes(b.role)) throw new HttpError(403, `Tu rol no puede crear usuarios con el rol ${b.role}.`);
  const { rows } = await pool.query(`INSERT INTO users (email, name, role) VALUES ($1,$2,$3) RETURNING ${COLS}`, [b.email, b.name ?? null, b.role]);
  res.status(201).json(rows[0]);
});

usersRouter.patch("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const b = z.object({ name: z.string().trim().max(120).nullish(), role: role.optional(), active: z.boolean().optional() }).parse(req.body);
  const allowed = allowedFor(req);
  const target = (await pool.query("SELECT role FROM users WHERE id = $1", [id])).rows[0];
  if (!target) throw new HttpError(404, "Usuario no encontrado.");
  if (!allowed.includes(target.role)) throw new HttpError(403, "No puedes gestionar a un usuario con ese rol.");
  if (b.role && !allowed.includes(b.role)) throw new HttpError(403, `Tu rol no puede asignar el rol ${b.role}.`);
  if (id === req.user!.id && (b.active === false || (b.role && b.role !== target.role)))
    throw new HttpError(409, "No puedes cambiar tu propio rol ni desactivarte.");
  const { rows } = await pool.query(
    `UPDATE users SET name = COALESCE($2, name), role = COALESCE($3, role), active = COALESCE($4, active)
     WHERE id = $1 RETURNING ${COLS}`,
    [id, b.name ?? null, b.role ?? null, b.active ?? null],
  );
  res.json(rows[0]);
});
