# Estado del proyecto — Ecclesia

## ✅ Implementado

### Base de datos
- [x] Esquema PostgreSQL idempotente (`backend/db/schema.sql`) y script `npm run migrate`
- [x] Categorías en tablas (`income_categories`, `expense_categories`) con INTENCION/DONACION y SERVICIO/GASTO
- [x] Maestros `income_types` y `expense_types` (código, nombre, categoría, cuenta contable, activo, auditoría)
- [x] Tablas `periods`, `period_events` (auditoría de abrir/cerrar/reabrir), `incomes`, `expenses`, `users`
- [x] Datos semilla de ejemplo

### Backend (probado contra PostgreSQL 16 con un arnés que simula el usuario)
- [x] Autenticación: verificación de ID token de Firebase + usuario pre-registrado con rol
- [x] Primer administrador por `BOOTSTRAP_ADMIN_EMAIL`
- [x] Roles: sacerdote, contador, administrador, secretario
- [x] API de maestros compatible con `createRestAdapter` (búsqueda, estado, referencias, 409 por uso)
- [x] Cuenta contable editable solo por el contador (el resto de roles la ignora)
- [x] Ingresos/egresos: CRUD con validación de período abierto
- [x] Intención: fecha de realización y descripción obligatorias
- [x] Períodos: abrir, cerrar, reabrir; máx. 2 abiertos y consecutivos; reabrir negado al secretario
- [x] Resumen por período y consolidado descargable (CSV)
- [x] Gestión de usuarios por API con permisos por rol (admin: todos; sacerdote: contador y secretario; secretario: secretario; contador: ninguno)
- [x] Cuenta contable editable por contador y administrador

### Frontend (compila con `tsc` y `vite build`)
- [x] Login con Google (Firebase) y control de sesión
- [x] Pantalla de Períodos (abrir, cerrar, reabrir según rol, resumen, descargar consolidado)
- [x] Pantalla de Ingresos y Egresos con campos condicionales de intención
- [x] Pantalla de Usuarios (según rol): agregar, cambiar rol, activar/desactivar
- [x] Pantalla de Maestros con `@joseparedesc/master-crud` (campo cuenta contable solo para contador y administrador)
- [x] Tailwind configurado con los tokens que exige el paquete de maestros
- [x] Archivo central de estilos (`theme.tokens.json`) y tema claro/oscuro/sistema
- [x] Jerarquía ui → layout → features → pages, con transiciones suaves, toasts y diálogos de confirmación

## ⏳ Pendiente

- [ ] Revisar visualmente la UI en el navegador (claro y oscuro, móvil y escritorio); aquí solo se verificó que compila y que el CSS se genera
- [ ] Probar el login real con Firebase (proyecto, dominio autorizado, credenciales Admin)
- [ ] Consolidado en Excel (.xlsx) y/o PDF; hoy es CSV
- [ ] Pantalla para consultar el historial de aperturas/cierres/reaperturas (`period_events` ya se guarda)
- [ ] Reportes: intenciones por fecha de celebración, comparativo entre meses
- [ ] Pruebas automáticas (unitarias de reglas de períodos y de integración de la API)
- [ ] Migraciones versionadas (hoy un único `schema.sql`)
- [ ] Despliegue: Dockerfiles, CI, variables de producción, HTTPS, CORS restrictivo
- [ ] Paginación en listados de movimientos
- [ ] Confirmar con el cliente los supuestos del README (quién puede cerrar, quién edita maestros, moneda)
