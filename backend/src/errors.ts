import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";

export class HttpError extends Error {
  constructor(public status: number, message: string, public extra: Record<string, unknown> = {}) {
    super(message);
  }
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) return void res.status(err.status).json({ message: err.message, ...err.extra });
  if (err instanceof ZodError)
    return void res.status(422).json({ message: err.issues.map((i) => (i.path.length ? `${i.path.join(".")}: ${i.message}` : i.message)).join("; ") });
  const code = (err as { code?: string }).code;
  if (code === "23505") return void res.status(409).json({ message: "Ya existe un registro con ese valor." });
  if (code === "23503") return void res.status(409).json({ message: "El registro está relacionado con otros datos." });
  console.error(err);
  res.status(500).json({ message: "Error interno del servidor" });
};
