# SaaS Multiempresa para Iglesias — Monorepo

Implementación inicial (MVP) del PRD `PRD_SaaS_Iglesias_Multiempresa.md`:
gestión de calendario, intenciones de misa, donaciones, ingresos, egresos,
cierres contables mensuales, usuarios/roles y auditoría, para múltiples
iglesias (tenants) sobre una única base de datos PostgreSQL.

Ver también:
- `docs/DECISIONES.md` — decisiones tomadas sobre los puntos abiertos del PRD.
- `docs/implementado/README.md` — qué está implementado.
- `docs/faltante/README.md` — qué falta y cómo priorizarlo.

## Estructura

```text
iglesias-saas/
├── backend/     NestJS + Prisma + PostgreSQL + JWT + Google OAuth
├── frontend/    Next.js + Tailwind + TanStack Query + master-crud
├── docker-compose.yml   PostgreSQL local
└── docs/
```

## Requisitos

- Node.js 20+
- Docker (para PostgreSQL local) o una base de datos PostgreSQL propia
- Credenciales OAuth de Google (Client ID / Secret) para el login

## Puesta en marcha

```bash
# 1. Instalar dependencias (workspaces)
npm install

# 2. Levantar PostgreSQL local
docker compose up -d postgres

# 3. Backend: configurar variables de entorno
cp backend/.env.example backend/.env
# Editar backend/.env con tus credenciales de Google OAuth y secretos JWT

# 4. Backend: generar cliente Prisma, migrar y poblar datos de ejemplo
npm run prisma:generate --workspace=backend
npm run prisma:migrate --workspace=backend
npm run prisma:seed --workspace=backend

# 5. Frontend: configurar variables de entorno
cp frontend/.env.local.example frontend/.env.local

# 6. Levantar ambos servicios (en dos terminales)
npm run dev:backend
npm run dev:frontend
```

Backend: http://localhost:3001/api
Frontend: http://localhost:3000

### Configurar Google OAuth

1. Crear credenciales OAuth 2.0 en Google Cloud Console.
2. Origen autorizado: `http://localhost:3000`.
3. URI de redirección autorizada: `http://localhost:3001/api/auth/google/callback`.
4. Copiar Client ID / Secret a `backend/.env`.

### Datos de ejemplo (seed)

El seed crea:
- Un Super Admin (`superadmin@iglesias-saas.com`, sin contraseña — inicia
  sesión con Google usando ese mismo correo).
- Un tenant de ejemplo: "Parroquia San José" (`parroquia-san-jose`).
- Un Administrador de Iglesia (`admin@parroquia-san-jose.com`).
- Categorías de ingreso/egreso por defecto (PRD sección 11).
- El período contable del mes actual, abierto.

Para probar el login, usa una cuenta de Google cuyo correo coincida con
alguno de los usuarios sembrados (o crea un tenant nuevo desde
`POST /api/super-admin/tenants` con tu propio correo como `adminEmail`).

## Reglas de negocio clave ya implementadas

- **Aislamiento multi-tenant en el backend**: todo dato se filtra por
  `tenantId` obtenido del JWT, nunca del body/query del cliente
  (PRD sección 25-26).
- **Bloqueo de períodos cerrados**: `AccountingPeriodsService.validateAccountingPeriod()`
  se invoca antes de crear/editar/eliminar cualquier `Income`, `Expense` o
  `Donation`, y lanza `{ code: "ACCOUNTING_PERIOD_CLOSED" }` si el mes está
  cerrado (PRD sección 15 y 28).
- **Libro financiero único**: `FinancialTransaction` es la fuente de verdad
  para balances/reportes/dashboard (PRD sección 12).
- **Auditoría**: acciones críticas (crear evento, intención, donación,
  ingreso, egreso, cerrar período, etc.) quedan registradas en `AuditLog`.
- **Maestros con `master-crud`**: el maestro de Categorías usa el paquete
  `@joseparedesc/master-crud` (ver su README) contra un adaptador REST que
  apunta al backend NestJS, siguiendo la convención de rutas documentada ahí.
