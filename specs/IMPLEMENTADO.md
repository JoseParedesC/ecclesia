# Estado de la implementación — SaaS Multiempresa para Iglesias

Fecha de este corte: 2026-09-07.
Este documento resume qué quedó implementado en este primer paquete y qué
falta para completar el MVP descrito en el PRD (sección 30).

---

## ✅ Implementado

### Arquitectura y base de datos
- Monorepo con workspaces npm (`backend/`, `frontend/`).
- `docker-compose.yml` con PostgreSQL 16 listo para desarrollo local.
- Schema completo de Prisma (`backend/prisma/schema.prisma`) modelando **todas**
  las entidades del PRD: `Tenant`, `Plan`, `User`, `UserTenant`, `Event`,
  `MassIntention`, `Donation`, `Category`, `Income`, `Expense`,
  `FinancialTransaction`, `AccountingPeriod`, `AuditLog` — con `tenantId` en
  cada entidad relevante, índices y constraints (`@@unique`, `@@index`).
- Seed (`backend/prisma/seed.ts`) con Super Admin, un tenant de ejemplo,
  categorías por defecto y un período contable abierto.

### Backend (NestJS)
- **Autenticación**: Google OAuth 2.0 (`passport-google-oauth20`) + JWT
  propio (access + refresh token). Flujo de selección de tenant cuando un
  usuario pertenece a varias iglesias (`/auth/select-tenant`).
- **Autorización multi-capa**: `JwtAuthGuard` (global) → `SuperAdminGuard` →
  `RolesGuard` (por rol de tenant: `ADMIN` / `OPERATOR` / `VIEWER`), todos
  registrados como `APP_GUARD` en `app.module.ts`.
- **Aislamiento multi-tenant real**: el `tenantId` siempre viene del JWT
  (`AuthenticatedUser`), nunca del body/query. Todas las queries Prisma en
  los servicios filtran explícitamente por `tenantId`.
- **Regla de cierre de períodos** (la más crítica del PRD, secciones 14, 15
  y 28): `AccountingPeriodsService.validateAccountingPeriod()` se invoca en
  `create`/`update`/`remove` de `Income`, `Expense` y en `create` de
  `Donation`. Lanza `{ code: "ACCOUNTING_PERIOD_CLOSED", message }` con el
  formato exacto pedido en el PRD.
- **Cierre mensual**: `POST /accounting-periods/:id/close` (solo `ADMIN`),
  con auditoría automática. **No existe endpoint de reapertura**, tal como
  pide el PRD sección 27.
- **Libro financiero único**: `FinancialTransaction` se genera
  automáticamente al crear `Donation`, `Income` o `Expense`, dentro de la
  misma transacción de base de datos (`prisma.$transaction`).
- **Auditoría**: `AuditService.log()` invocado desde eventos, intenciones,
  donaciones, ingresos, egresos y cierres de período.
- **Módulos completos con CRUD + reglas de negocio**: Tenants (Super Admin),
  Users (invitar/cambiar rol/desactivar), Events, MassIntentions, Donations,
  Categories, Income, Expenses, AccountingPeriods, Reports (dashboard,
  reporte mensual, reporte de intenciones), Audit.
- **Maestro Categories** expone exactamente el contrato de 7 métodos que
  espera `MasterCrudAdapter<T>` (`list`, `getById`, `create`, `update`,
  `setActive`, `remove`, `countReferences`), con rutas alineadas 1:1 a la
  convención por defecto de `createRestAdapter` documentada en el README
  del paquete adjunto.
- Filtro global de excepciones (`AllExceptionsFilter`) que normaliza errores
  y respeta el formato `{ code, message }` para errores de dominio.
- Rate limiting básico (`@nestjs/throttler`).

### Frontend (Next.js)
- App Router + Tailwind + TanStack Query configurados.
- Flujo de login completo: botón "Continuar con Google" → callback que
  guarda tokens → selección de tenant si aplica → dashboard.
- Cliente API (`lib/api-client.ts`) con manejo de refresh token automático y
  un tipo `ApiError` que expone `isPeriodClosed` para que la UI distinga el
  bloqueo de período cerrado de cualquier otro error.
- Layout de navegación (PRD sección 23) con las secciones: Dashboard,
  Calendario, Intenciones, Ingresos, Egresos, Cierres, Categorías, Usuarios.
- **Dashboard** (PRD sección 20): ingresos/egresos/balance del mes,
  intenciones registradas, donaciones del mes, próximos eventos.
- **Pantalla de Cierre Mensual** (PRD sección 16): réplica funcional de la
  maqueta del PRD, con el diálogo de confirmación exacto ("¿Está seguro? Una
  vez cerrado el período no podrá..."), consumiendo `GET/summary` y
  `POST /close`.
- **Maestro de Categorías** usando `@joseparedesc/master-crud` con
  `createRestAdapter` apuntando al backend, tal como documenta su README.
- Listados (solo lectura por ahora, ver pendientes) de: Calendario,
  Intenciones, Ingresos, Egresos, Usuarios del tenant.

---

## ⏳ Pendiente para completar el MVP

### Backend
- **Reversión/anulación de transacciones** (`VOID_TRANSACTION`, PRD sección
  18): el enum y el campo `voidedTxnId` ya están en el schema, pero no hay
  servicio/endpoint que la implemente.
- **Pre-check de referencias con `409`** en `remove()` de Categories: está
  implementado el `countReferences`, pero falta el endpoint `DELETE`
  devolviendo específicamente `409` con `Retry-After`/formato exacto que
  algunos clientes de `master-crud` podrían esperar además del que ya se
  devuelve (validar contra la versión real instalada del paquete).
- **Multi-sede / múltiples capillas** (punto abierto #1 del PRD): no
  modelado — ver `docs/DECISIONES.md`.
- **Fase 3 (planes, suscripciones, facturación, métricas globales del Super
  Admin)**: solo existe el modelo `Plan`, sin lógica de límites ni cobro.
- **Tests automatizados**: no se incluyó suite de tests (unitarios ni e2e).
  Es el pendiente de mayor riesgo antes de producción.
- **Refresh token revocable**: hoy el logout es solo del lado del cliente
  (JWT stateless). Si se requiere invalidar sesiones activamente, hace falta
  una tabla de refresh tokens con estado.

### Frontend
- **Formularios de alta/edición** para Eventos, Intenciones, Donaciones,
  Ingresos y Egresos: los listados y el contrato con el backend (incluyendo
  el manejo de `ACCOUNTING_PERIOD_CLOSED`) ya están, pero falta la UI de
  captura (modales/páginas de formulario).
- **Vistas de calendario mensual/semanal/diaria** (PRD sección 6): solo se
  implementó la vista "Lista". Se recomienda una librería de calendario
  (`FullCalendar` o similar) para las otras tres vistas.
- **Reportes exportables** (Excel/PDF) y pantalla de reporte de donaciones/
  ingresos/egresos con filtros (PRD sección 21): el backend ya calcula los
  datos (`/reports/monthly`, `/reports/mass-intentions`); falta la UI de
  filtros y exportación.
- **Formulario de invitar usuario** en Configuración → Usuarios (el listado
  ya existe, falta el modal de invitación y cambio de rol).
- **Manejo de zonas horarias por tenant** en el frontend (hoy se muestra en
  la zona horaria del navegador).
- **Diseño visual definitivo**: se usó una paleta y componentes mínimos de
  Tailwind; falta pasar por un sistema de diseño (p. ej. shadcn/ui, como
  sugiere el PRD sección 22) para un acabado visual profesional.
- **Responsive fino para tablas → tarjetas en mobile** (PRD sección 23): el
  layout general es responsive, pero las tablas de listados aún no colapsan
  a tarjetas en pantallas pequeñas.

### Infraestructura / DevOps
- No se incluyeron Dockerfiles de `backend`/`frontend` para despliegue (solo
  `docker-compose.yml` de PostgreSQL para desarrollo local).
- No se configuró CI/CD ni variables de entorno de producción
  (Vercel/Railway/Render, como sugiere el PRD sección 33).
- Falta la primera migración de Prisma generada (`npm run prisma:migrate`
  debe ejecutarse localmente contra una base de datos real para crearla,
  ya que este entorno no tiene salida de red a una base de datos).

---

## Cómo continuar

1. Ejecutar `npm run prisma:migrate --workspace=backend` contra una base de
   datos real para generar la migración inicial (no se generó aquí por no
   tener acceso de red a PostgreSQL en este entorno de construcción).
2. Completar los formularios de alta/edición del frontend reutilizando
   `lib/api-client.ts` y el patrón ya usado en la pantalla de Cierres.
3. Implementar `VOID_TRANSACTION` para cerrar el ciclo de correcciones
   financieras sin borrado físico (PRD sección 18).
4. Añadir tests e2e sobre la regla de cierre de período — es la regla de
   negocio más crítica del sistema y la que más valor tiene blindar con
   pruebas automatizadas.
