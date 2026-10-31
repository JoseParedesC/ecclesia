import { Router } from "express";
import { z } from "zod";
import { PARISH_WRITE_ROLES, requireRole } from "../auth.js";
import { pool } from "../db.js";

/** Datos de la parroquia: un solo registro. Todos los roles lo consultan; lo editan sacerdote y administrador. */
export const parishRouter = Router();

const required = (label: string, max: number) =>
  z.string({ required_error: `${label} es obligatorio`, invalid_type_error: `${label} es obligatorio` })
    .trim().min(1, `${label} es obligatorio`).max(max, `${label} admite máximo ${max} caracteres`);
const emptyToNull = (v: unknown) => (typeof v === "string" && v.trim() === "" ? null : v);

const bodySchema = z.object({
  name: required("El nombre", 150),
  department: required("El departamento", 80),
  city: required("La ciudad", 80),
  address: required("La dirección", 200),
  logo: z.preprocess(
    emptyToNull,
    z.string().max(400_000, "El logo es demasiado grande").regex(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/, "El logo debe ser una imagen PNG, JPG o WEBP").nullish(),
  ),
  email: z.preprocess(emptyToNull, z.string().trim().email("Correo inválido").max(150).nullish()),
  phone: z.preprocess(emptyToNull, z.string().trim().regex(/^[0-9+()\s-]{7,20}$/, "Teléfono inválido").nullish()),
});

const SELECT = `SELECT name, department, city, address, logo, contact_email AS "email", contact_phone AS "phone", updated_at AS "updatedAt" FROM parish WHERE id = 1`;

// null si todavía no se ha configurado
parishRouter.get("/", async (_req, res) => {
  res.json((await pool.query(SELECT)).rows[0] ?? null);
});

parishRouter.put("/", requireRole(...PARISH_WRITE_ROLES), async (req, res) => {
  const b = bodySchema.parse(req.body);
  await pool.query(
    `INSERT INTO parish (id, name, department, city, address, logo, contact_email, contact_phone, updated_by)
     VALUES (1,$1,$2,$3,$4,$5,$6,$7,$8)
     ON CONFLICT (id) DO UPDATE SET name=$1, department=$2, city=$3, address=$4, logo=$5,
       contact_email=$6, contact_phone=$7, updated_by=$8, updated_at=now()`,
    [b.name, b.department, b.city, b.address, b.logo ?? null, b.email ?? null, b.phone ?? null, req.user!.id],
  );
  res.json((await pool.query(SELECT)).rows[0]);
});
