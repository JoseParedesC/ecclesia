import type { NextFunction, Request, Response } from "express";
import { getAuth } from "firebase-admin/auth";
import "./firebase.js";
import { pool } from "./db.js";
import { HttpError } from "./errors.js";

export type Role = "sacerdote" | "contador" | "administrador" | "secretario";
export interface AuthUser { id: number; email: string; name: string | null; role: Role }

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express { interface Request { user?: AuthUser } }
}

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) throw new HttpError(401, "Falta el token de autenticación.");
  let decoded;
  try {
    decoded = await getAuth().verifyIdToken(header.slice(7));
  } catch (err) {
    console.error("verifyIdToken falló:", (err as { code?: string }).code, "-", (err as Error).message);
    throw new HttpError(401, "La sesión expiró. Vuelve a iniciar sesión.");
  }
  if (!decoded.email || !decoded.email_verified) throw new HttpError(403, "Tu correo de Google no está verificado.");

  const { rows } = await pool.query(
    `UPDATE users SET firebase_uid = COALESCE(firebase_uid, $2), name = COALESCE(name, $3)
     WHERE lower(email) = lower($1) AND active RETURNING id, email, name, role`,
    [decoded.email, decoded.uid, decoded.name ?? null],
  );
  if (!rows[0]) throw new HttpError(403, "Tu cuenta no está autorizada. Pide a un administrador que te registre.");
  req.user = rows[0];
  next();
}

export const requireRole =
  (...roles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) throw new HttpError(403, "No tienes permisos para esta acción.");
    next();
  };

/** Qué roles puede crear/gestionar cada rol (el contador no gestiona usuarios). */
export const CREATABLE_ROLES: Record<Role, Role[]> = {
  administrador: ["administrador", "sacerdote", "contador", "secretario"],
  sacerdote: ["contador", "secretario"],
  secretario: ["secretario"],
  contador: [],
};

/** secretario NO puede reabrir períodos */
export const REOPEN_ROLES: Role[] = ["sacerdote", "contador", "administrador"];
/** roles que pueden definir la cuenta contable de los maestros */
export const ACCOUNT_ROLES: Role[] = ["contador", "administrador"];
/** roles que pueden editar los datos de la parroquia */
export const PARISH_WRITE_ROLES: Role[] = ["sacerdote", "administrador"];
export const MASTER_WRITE_ROLES: Role[] = ["sacerdote", "contador", "administrador"];
