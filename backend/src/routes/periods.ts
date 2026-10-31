import { Router } from "express";
import { z } from "zod";
import { REOPEN_ROLES, requireRole } from "../auth.js";
import { pool, tx } from "../db.js";
import { HttpError } from "../errors.js";
import { buildConsolidado, consolidadoToCsv } from "../services/consolidado.js";
import { assertCanBeOpen, lockPeriods } from "../services/periods.js";
import type { PoolClient } from "pg";

export const periodsRouter = Router();

const event = (c: PoolClient, periodId: number, action: "OPEN" | "CLOSE" | "REOPEN", userId: number) =>
  c.query("INSERT INTO period_events (period_id, action, user_id) VALUES ($1,$2,$3)", [periodId, action, userId]);

const SELECT = `SELECT id, year, month, status, opened_at AS "openedAt", closed_at AS "closedAt" FROM periods`;

periodsRouter.get("/", async (_req, res) => {
  res.json((await pool.query(`${SELECT} ORDER BY year DESC, month DESC`)).rows);
});

// Abrir un período nuevo (todos los roles)
periodsRouter.post("/", async (req, res) => {
  const { year, month } = z
    .object({ year: z.number().int().min(2000).max(2100), month: z.number().int().min(1).max(12) })
    .parse(req.body);
  const row = await tx(async (c) => {
    await lockPeriods(c);
    const ex = (await c.query("SELECT status FROM periods WHERE year=$1 AND month=$2", [year, month])).rows[0];
    if (ex)
      throw new HttpError(
        409,
        ex.status === "OPEN"
          ? "El período ya está abierto."
          : "El período está cerrado; debe reabrirlo un sacerdote, contador o administrador.",
      );
    await assertCanBeOpen(c, year, month);
    const { rows } = await c.query(`INSERT INTO periods (year, month) VALUES ($1,$2) RETURNING id`, [year, month]);
    await event(c, rows[0].id, "OPEN", req.user!.id);
    return (await c.query(`${SELECT} WHERE id=$1`, [rows[0].id])).rows[0];
  });
  res.status(201).json(row);
});

// Cierre de mes (todos los roles)
periodsRouter.post("/:id/close", async (req, res) => {
  const id = Number(req.params.id);
  const row = await tx(async (c) => {
    await lockPeriods(c);
    const p = (await c.query("SELECT status FROM periods WHERE id=$1 FOR UPDATE", [id])).rows[0];
    if (!p) throw new HttpError(404, "Período no encontrado.");
    if (p.status !== "OPEN") throw new HttpError(409, "El período ya está cerrado.");
    await c.query("UPDATE periods SET status='CLOSED', closed_at=now(), closed_by=$2 WHERE id=$1", [id, req.user!.id]);
    await event(c, id, "CLOSE", req.user!.id);
    return (await c.query(`${SELECT} WHERE id=$1`, [id])).rows[0];
  });
  res.json(row);
});

// Reapertura: NO permitida al secretario
periodsRouter.post("/:id/reopen", requireRole(...REOPEN_ROLES), async (req, res) => {
  const id = Number(req.params.id);
  const row = await tx(async (c) => {
    await lockPeriods(c);
    const p = (await c.query("SELECT year, month, status FROM periods WHERE id=$1 FOR UPDATE", [id])).rows[0];
    if (!p) throw new HttpError(404, "Período no encontrado.");
    if (p.status !== "CLOSED") throw new HttpError(409, "El período ya está abierto.");
    await assertCanBeOpen(c, p.year, p.month);
    await c.query("UPDATE periods SET status='OPEN', reopened_at=now(), reopened_by=$2 WHERE id=$1", [id, req.user!.id]);
    await event(c, id, "REOPEN", req.user!.id);
    return (await c.query(`${SELECT} WHERE id=$1`, [id])).rows[0];
  });
  res.json(row);
});

periodsRouter.get("/:id/summary", async (req, res) => {
  const d = await buildConsolidado(Number(req.params.id));
  res.json({ period: d.period, totals: d.totals });
});

// Consolidado del mes (CSV)
periodsRouter.get("/:id/consolidado.csv", async (req, res) => {
  const d = await buildConsolidado(Number(req.params.id));
  const name = `consolidado-${d.period.year}-${String(d.period.month).padStart(2, "0")}.csv`;
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${name}"`);
  res.send("\uFEFF" + consolidadoToCsv(d));
});
