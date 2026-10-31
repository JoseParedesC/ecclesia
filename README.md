# Finanzas parroquiales

Control de ingresos y egresos de una parroquia, con cierre de mensual y consolidado descargable.

- **frontend/** React + Vite + TypeScript. Maestros con `@joseparedesc/master-crud`.
- **backend/** Node + Express + TypeScript + PostgreSQL. Verifica tokens de Firebase (Google).

## Puesta en marcha

1. `docker compose up -d` (PostgreSQL) y copia `backend/.env.example` → `backend/.env`; completa `BOOTSTRAP_ADMIN_EMAIL` y las credenciales de Firebase Admin.
2. `cd backend && npm install && npm run dev` (al arrancar crea las tablas solas; también puedes correr `npm run migrate`. Con `npm run build && npm start` pasa igual; para desactivarlo usa `AUTO_MIGRATE=false`)
3. Copia `frontend/.env.example` → `frontend/.env` con los datos de tu app web de Firebase (Authentication → proveedor Google activado).
4. `cd frontend && npm install && npm run dev` → http://localhost:5173

El primer inicio de sesión debe hacerse con el correo de `BOOTSTRAP_ADMIN_EMAIL`. Los demás usuarios se registran con `POST /api/users` (solo administrador) indicando correo y rol.

## Reglas de negocio implementadas

| Regla | Dónde |
|---|---|
| Categorías en BD: ingreso = `INTENCION`/`DONACION`, egreso = `SERVICIO`/`GASTO` | `backend/db/schema.sql` |
| Intención exige fecha de realización + descripción (mención/petición) | `routes/movements.ts` y formulario |
| Máx. 2 períodos abiertos y consecutivos (al abrir y al reabrir) | `services/periods.ts` (con lock transaccional) |
| Reabrir: solo sacerdote, contador, administrador | `auth.ts` → `REOPEN_ROLES` |
| Solo se registra/edita/borra en períodos abiertos; el período sale de la fecha | `routes/movements.ts` |
| Cuenta contable de maestros: solo la define el contador | `routes/masters.ts` + `masterConfigs.ts` |
| Consolidado mensual (CSV, separador `;`, con BOM para Excel) | `services/consolidado.ts` |

## Supuestos que conviene validar

- Cerrar y abrir períodos lo puede hacer cualquier rol; solo **reabrir** está restringido.
- Los maestros solo los edita sacerdote, contador y administrador; el secretario los consulta.
- Los usuarios deben estar pre-registrados por un administrador (no hay auto-registro).
- Moneda por defecto COP (`VITE_CURRENCY`).
