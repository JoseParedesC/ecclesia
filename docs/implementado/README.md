# Lo implementado

Corte: 2026-09-08. Segundo paquete de trabajo (continuación de la primera
entrega). Este documento reemplaza y amplía el `IMPLEMENTADO.md` original.

---

## Arquitectura y base de datos
- Monorepo con workspaces npm (`backend/`, `frontend/`).
- `docker-compose.yml` con PostgreSQL 16 para desarrollo local.
- Schema completo de Prisma (`backend/prisma/schema.prisma`) modelando **todas**
  las entidades del PRD: `Tenant`, `Plan`, `User`, `UserTenant`, `Event`,
  `MassIntention`, `Donation`, `Category`, `Income`, `Expense`,
  `FinancialTransaction`, `AccountingPeriod`, `AuditLog` — con `tenantId` en
  cada entidad relevante, índices y constraints.
- Seed (`backend/prisma/seed.ts`) con Super Admin, tenant de ejemplo,
  categorías por defecto y un período contable abierto.
- **Dockerfiles** de `backend/` y `frontend/` para build de producción
  (además del `docker-compose.yml` de PostgreSQL para desarrollo).

## Backend (NestJS)
- **Autenticación**: Google OAuth 2.0 + JWT propio (access + refresh),
  con selección de tenant cuando un usuario pertenece a varias iglesias.
- **Autorización multi-capa**: `JwtAuthGuard` → `SuperAdminGuard` →
  `RolesGuard` (roles de tenant: `ADMIN` / `OPERATOR` / `VIEWER`).
- **Aislamiento multi-tenant real**: el `tenantId` siempre viene del JWT,
  nunca del body/query; todas las queries Prisma filtran por `tenantId`.
- **Regla de cierre de períodos** (la más crítica del PRD): `validateAccountingPeriod()`
  se invoca en `create`/`update`/`remove` de `Income`, `Expense`, `Donation`
  y ahora también en la reversión de movimientos. Lanza
  `{ code: "ACCOUNTING_PERIOD_CLOSED", message }`.
- **Cierre mensual**: `POST /accounting-periods/:id/close` (solo `ADMIN`),
  con auditoría automática. No existe endpoint de reapertura.
- **Libro financiero único** (`FinancialTransaction`), generado
  automáticamente al crear `Donation`, `Income` o `Expense`.
- **Reversión de movimientos (`VOID_TRANSACTION`)** — *nuevo en este
  paquete*: `POST /financial-transactions/:id/void` crea un movimiento de
  reversión por el mismo valor y marca el original como `isVoided`, sin
  borrado físico (PRD sección 18). Respeta el período del movimiento
  original: si está cerrado, no se puede revertir. Solo `ADMIN`.
- **Auditoría** de eventos, intenciones, donaciones, ingresos, egresos,
  cierres de período y reversiones.
- Módulos completos: Tenants, Users, Events, MassIntentions, Donations,
  Categories, Income, Expenses, FinancialTransactions, AccountingPeriods,
  Reports, Audit.
- Maestro **Categories** con el contrato de `MasterCrudAdapter<T>` (`list`,
  `getById`, `create`, `update`, `setActive`, `remove`, `countReferences`).
- Filtro global de excepciones, rate limiting básico.

## Frontend (Next.js)
- Login con Google → callback → selección de tenant → dashboard.
- Cliente API con refresh automático de token y tipo `ApiError` con
  `isPeriodClosed` para distinguir el bloqueo de período cerrado.
- Layout de navegación completo (Dashboard, Calendario, Intenciones,
  Ingresos, Egresos, Movimientos, Cierres, Categorías, Usuarios).
- **Dashboard**: ingresos/egresos/balance del mes, intenciones, donaciones,
  próximos eventos.
- **Cierre mensual**: réplica funcional de la maqueta del PRD, con el
  diálogo de confirmación exacto.
- **Maestro de Categorías** con `@joseparedesc/master-crud` vía
  `createRestAdapter`.
- **Formularios de alta completos** — *nuevo en este paquete*:
  - Calendario: alta de eventos (todos los tipos del PRD).
  - Intenciones: alta de intención + registro de donación inline por
    intención (con manejo del error de período cerrado).
  - Ingresos y Egresos: alta con selección de categoría filtrada por tipo,
    método de pago, y aviso visual diferenciado cuando el período está
    cerrado (amarillo) vs. otros errores de validación (rojo).
  - Usuarios: invitar usuario (nombre, correo, rol), cambiar rol inline,
    desactivar usuario.
- **Movimientos** (nueva página): listado del libro financiero único con
  acción de "Anular" que abre el flujo de reversión (motivo + confirmación),
  reflejando visualmente los movimientos anulados y las reversiones.

## Documentación
- `docs/PRD_original.md` — PRD tal como fue entregado.
- `docs/master-crud_README.md` — README del paquete de maestros, como referencia.
- `docs/DECISIONES.md` — resolución de los 13 puntos abiertos del PRD (sección 35).
- `docs/implementado/README.md` — este documento.
- `docs/faltante/README.md` — lo que falta para completar el MVP y fases siguientes.
