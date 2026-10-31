# Ecclesia

_Finanzas parroquiales_

Control de ingresos y egresos de una parroquia, con cierre mensual y consolidado descargable.

- **frontend/** React + Vite + TypeScript. Maestros con `@joseparedesc/master-crud`.
- **backend/** Node + Express + TypeScript + PostgreSQL. Verifica tokens de Firebase (Google).

## Puesta en marcha

1. `docker compose up -d` (PostgreSQL) y copia `backend/.env.example` → `backend/.env`; completa `BOOTSTRAP_ADMIN_EMAIL` y las credenciales de Firebase Admin.
2. `cd backend && npm install && npm run dev` (al arrancar crea las tablas solas; también puedes correr `npm run migrate`. Con `npm run build && npm start` pasa igual; para desactivarlo usa `AUTO_MIGRATE=false`)
3. Copia `frontend/.env.example` → `frontend/.env` con los datos de tu app web de Firebase (Authentication → proveedor Google activado).
4. `cd frontend && npm install && npm run dev` → http://localhost:5173

En cada arranque el backend asegura que el correo de `BOOTSTRAP_ADMIN_EMAIL` exista como administrador activo (si lo corriges, se registra en el siguiente arranque; la fila del correo anterior no se borra).
El primer inicio de sesión debe hacerse con ese correo. Los demás usuarios se registran en la sección **Usuarios** (correo de Google y rol). Quién puede crear a quién:

| Quien crea | Puede crear |
|---|---|
| administrador | todos los roles |
| sacerdote | contador y secretario |
| secretario | secretario |
| contador | nadie (no ve la sección) |

Cada rol solo ve y gestiona (cambiar rol, activar/desactivar) los roles que puede crear. Nadie puede cambiar su propio rol ni desactivarse.

## Reglas de negocio implementadas

| Regla | Dónde |
|---|---|
| Categorías en BD: ingreso = `INTENCION`/`DONACION`, egreso = `SERVICIO`/`GASTO` | `backend/db/schema.sql` |
| Intención exige fecha de realización + descripción (mención/petición) | `routes/movements.ts` y formulario |
| Máx. 2 períodos abiertos y consecutivos (al abrir y al reabrir) | `services/periods.ts` (con lock transaccional) |
| Reabrir: solo sacerdote, contador, administrador | `auth.ts` → `REOPEN_ROLES` |
| Solo se registra/edita/borra en períodos abiertos; el período sale de la fecha | `routes/movements.ts` |
| Cuenta contable de maestros: la definen el contador y el administrador | `routes/masters.ts` + `masterConfigs.ts` |
| Ingreso/egreso exige responsable, dirección, tipo (NIT, CC o TI) y número de identificación, teléfono de contacto; correo opcional | `services/responsible.ts` + `MovementForm.tsx` |
| Consolidado mensual (CSV, separador `;`, con BOM para Excel) | `services/consolidado.ts` |

## Ingresos y egresos (listado y formulario separados)

Igual que los maestros, cada módulo tiene dos pantallas:

- **Listado** (`/incomes`, `/expenses`): período, búsqueda (responsable, identificación, tipo o descripción), filtro por tipo, editar y eliminar solo en períodos abiertos, y el botón **Nuevo**.
- **Formulario** (`/incomes/new`, `/incomes/:id/edit` y lo equivalente en `/expenses`): datos del movimiento y bloque **Responsable** (responsable, dirección, tipo y número de identificación [NIT | CC | TI], teléfono de contacto y correo opcional). Al guardar vuelve al listado. La fecha solo admite días dentro de los períodos abiertos.

Los registros creados antes de esta versión no tienen responsable; al editarlos se pedirá.

## Menú y configuración

La barra lateral usa un menú con submenús ramificados que se abren **hacia la derecha** (`components/layout/SidebarNav.tsx`; hover, clic o teclado, `Esc` cierra). **Configuración** agrupa **Maestros**, **Usuarios** (solo roles que pueden crear usuarios) y **Parroquia**.

**Parroquia** (`/parish` consulta, `/parish/edit` formulario; tabla `parish` de un solo registro, `GET/PUT /api/parish`): nombre, departamento, ciudad y dirección obligatorios; logo, correo y teléfono opcionales. El logo se reduce a 256 px en el navegador y se guarda como data URL. Se muestra en el menú y en el encabezado de los reportes. Supuesto a validar: la editan sacerdote y administrador; los demás roles la consultan.

## Manual de usuario

La opción **How to use** (pie del menú) abre `/manual`. El mismo contenido está en `docs/MANUAL_USUARIO.md`.

## Usuarios

Mismo patrón de dos pantallas: listado `/users` (búsqueda, filtros por rol y estado, activar/desactivar) y formulario en `/users/new` y `/users/:id/edit`.

## Reportes e impresión

Sección **Reportes** (todos los roles): ingresos y egresos (rango de fechas, categoría y tipo), intenciones (por fecha de realización o de registro) y consolidado mensual (también en CSV). El botón **Imprimir** abre el diálogo del navegador (ahí se puede elegir "Guardar como PDF"); solo se imprime la hoja del reporte, siempre en colores claros.

## Supuestos que conviene validar

- Cerrar y abrir períodos lo puede hacer cualquier rol; solo **reabrir** está restringido.
- Los maestros solo los edita sacerdote, contador y administrador; el secretario los consulta.
- Los usuarios deben estar pre-registrados por un administrador (no hay auto-registro).
- Moneda por defecto COP (`VITE_CURRENCY`).

## Diseño y tema

- **Un solo archivo de estilos:** `frontend/theme.tokens.json` define colores (claro y oscuro), tipografía, radios, sombras y tiempos de animación. `tailwind.config.js` lo convierte en variables CSS y en utilidades; ningún componente tiene colores propios. Para cambiar la marca, edita solo ese archivo.
- **Tema claro / oscuro / sistema:** selector en la barra superior (y en el login). La preferencia se guarda en `localStorage`; "sistema" sigue en vivo el modo del sistema operativo y no hay parpadeo al cargar.
- **Jerarquía de componentes** (`frontend/src`):
  - `components/ui` → átomos y moléculas (Button, Field, Card, Badge, Alert, Table, Stat, Tabs, toast, confirm…)
  - `components/layout` → AppShell, PageHeader, ThemeToggle, Brand
  - `features/periods`, `features/movements` → bloques de negocio
  - `pages` → solo orquestan datos y componen
- Las animaciones usan los tiempos de `motion` en los tokens y se desactivan con "reducir movimiento" del sistema.
