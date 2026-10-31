# Estado del proyecto — Ecclesia

## ✅ Implementado

### Estipendios: comprobante impreso (v1.2)
- [x] `StipendReceipt` (`features/stipends/StipendReceipt.tsx`): parroquia + información de la intención, máximo media hoja carta (`max-h-[4.9in]`), dos por hoja con guía de corte
- [x] `printStipendReceipts` (`lib/printStipends.tsx`): renderiza aparte, oculta la app al imprimir, hoja carta y colores claros
- [x] Botón Imprimir por estipendio en el listado de ingresos
- [x] El reporte de estipendios muestra e imprime ese mismo formato (un comprobante por estipendio)
- [x] Ingresos: fecha de registro = fecha actual, no editable (backend la fija con `APP_TIMEZONE`); fecha de realización de la intención editable

### Base de datos
- [x] **v1.1** Categoría «Intención» renombrada a «Estipendio» (migración automática, conserva datos) y columna `income_types.default_amount` (valor sugerido)
- [x] Esquema PostgreSQL idempotente (`backend/db/schema.sql`) y script `npm run migrate`
- [x] Categorías en tablas (`income_categories`, `expense_categories`) con ESTIPENDIO/DONACION y SERVICIO/GASTO
- [x] Maestros `income_types` y `expense_types` (código, nombre, categoría, cuenta contable, activo, auditoría)
- [x] Tablas `periods`, `period_events` (auditoría de abrir/cerrar/reabrir), `incomes`, `expenses`, `users`
- [x] Datos semilla de ejemplo
- [x] Datos del responsable en `incomes` y `expenses`: `responsible_name`, `address`, `id_type` (NIT/CC/TI), `id_number`, `contact_phone`, `email` (opcional); columnas nulas para no romper filas anteriores (se agregan con `ALTER TABLE … IF NOT EXISTS`)

### Backend (probado contra PostgreSQL 16 con un arnés que simula el usuario)
- [x] Autenticación: verificación de ID token de Firebase + usuario pre-registrado con rol
- [x] Primer administrador por `BOOTSTRAP_ADMIN_EMAIL`
- [x] Roles: sacerdote, contador, administrador, secretario
- [x] API de maestros compatible con `createRestAdapter` (búsqueda, estado, referencias, 409 por uso)
- [x] Cuenta contable editable solo por el contador (el resto de roles la ignora)
- [x] Ingresos/egresos: CRUD con validación de período abierto
- [x] Ingresos/egresos con responsable obligatorio (responsable, dirección, tipo y número de identificación, teléfono) y correo opcional; el NIT admite guion y dígito de verificación, CC y TI solo dígitos (`services/responsible.ts`)
- [x] `GET /incomes|/expenses` con búsqueda (responsable, identificación, tipo, descripción) y filtros por período y tipo; `GET /:id` para la pantalla de edición
- [x] Reportes de ingresos/egresos y CSV del consolidado incluyen responsable e identificación
- [x] Estipendio: fecha de realización y descripción obligatorias
- [x] Períodos: abrir, cerrar, reabrir; máx. 2 abiertos y consecutivos; reabrir negado al secretario
- [x] Resumen por período y consolidado descargable (CSV)
- [x] Endpoints de reportes: movimientos filtrados, estipendios y consolidado en JSON
- [x] Gestión de usuarios por API con permisos por rol (admin: todos; sacerdote: contador y secretario; secretario: secretario; contador: ninguno)
- [x] Cuenta contable editable por contador y administrador

### Frontend (compila con `tsc` y `vite build`)
- [x] Login con Google (Firebase) y control de sesión
- [x] Módulo de Reportes imprimibles: ingresos y egresos (fechas/categoría/tipo), estipendios por rango de fechas, consolidado mensual
- [x] Pantalla de Períodos (abrir, cerrar, reabrir según rol, resumen, descargar consolidado)
- [x] Ingresos y Egresos funcionan como los maestros: **listado** (`/incomes`, `/expenses`) con período, búsqueda con retardo, filtro por tipo y botón «Nuevo»; **formulario** en pantalla aparte (`/…/new`, `/…/:id/edit`) con campos condicionales de estipendio y bloque «Responsable» con validación en cliente
- [x] Usuarios (según rol) con listado y formulario aparte: `/users` (búsqueda, filtros por rol y estado, editar, activar/desactivar) y `/users/new`, `/users/:id/edit` (correo fijo al editar, nombre y rol; nadie cambia su propio rol); `GET /users/:id` en el backend
- [x] Pantalla de Maestros con `@joseparedesc/master-crud` (campo cuenta contable solo para contador y administrador)
- [x] Tailwind configurado con los tokens que exige el paquete de maestros
- [x] Archivo central de estilos (`theme.tokens.json`) y tema claro/oscuro/sistema; paleta clara dorada/crema (primario `#D4AF37`, variantes `primary_` en `#B88A24`; el tema oscuro hereda sus equivalentes)
- [x] Estilo profesional unificado: tarjetas y tablas con bordes redondeados y encabezados en versalitas, botones primarios con degradado dorado, insignias con punto, alertas con acento lateral, menú lateral con indicador de sección activa, fondo con halos suaves, barras de desplazamiento finas; texto de acento sobre fondo claro usa `primary_` para mejor contraste
- [x] Menú lateral ramificado con submenú que se despliega hacia la derecha (`SidebarNav.tsx`); sección Configuración con Maestros, Usuarios y Parroquia
- [x] Parroquia: tabla `parish` (un registro), `GET/PUT /api/parish`, pantallas `/parish` (consulta) y `/parish/edit` (formulario) con nombre, departamento, ciudad, dirección (obligatorios), logo, correo y teléfono (opcionales); nombre y logo en el menú y en el encabezado de los reportes
- [x] Opción «How to use» al pie del menú lateral que lleva al manual de usuario (`/manual`, `pages/Manual.tsx`); el mismo contenido está en `docs/MANUAL_USUARIO.md`
- [x] Regla del proyecto: todo CRUD tiene listado y formulario en pantallas aparte (maestros, ingresos, egresos, usuarios)
- [x] Jerarquía ui → layout → features → pages, con transiciones suaves, toasts y diálogos de confirmación

### v1.1.0
- [x] Valor sugerido por tipo de estipendio: panel en Maestros → Ingresos y precarga del monto al crear un ingreso (editable)
- [x] Campos de valor con símbolo `$`, separadores de miles y alineados a la derecha (`MoneyInput`)
- [x] Reportes y resúmenes renombrados a «Estipendios»; endpoint `/api/reports/stipends`
- [x] Versión visible en la barra lateral (`package.json` → `__APP_VERSION__`)

## ⏳ Pendiente

- [ ] **Imprimir en una impresora real / PDF**: confirmar que cada comprobante cabe en media hoja carta con datos largos (mención de 3 líneas, dirección de 2) y que el logo sale bien; ajustar `max-h-[4.9in]` si hace falta
- [ ] Probar en navegador y contra la base: crear ingreso (fecha de hoy bloqueada), editar (conserva la fecha), imprimir uno y varios, reporte de estipendios con filtros
- [ ] Decidir si los totales del reporte de estipendios deben imprimirse (hoy solo se ven en pantalla)

- [ ] Probar en el navegador el menú desplegable a la derecha (hover, clic en móvil, teclado y `Esc`) y que el panel no quede tapado por el contenido
- [ ] Probar la subida del logo y su guardado (el JSON del backend se amplió a 1 MB); confirmar que PUT /parish rechaza imágenes inválidas
- [ ] Confirmar que solo sacerdote y administrador editen la parroquia (supuesto) y si el departamento debe ser lista cerrada
- [ ] Navegación con flechas dentro del submenú (hoy se usa Tab) y submenús para Ingresos/Egresos si se agregan más opciones

- [ ] Mantener sincronizados `pages/Manual.tsx` y `docs/MANUAL_USUARIO.md` cuando cambien las reglas (hoy son dos copias); valorar cargar el .md en la app con un renderizador

- [ ] Compilar y probar Usuarios (listado/formulario) y el nuevo estilo en el navegador, en claro y oscuro (aquí solo se revisó la sintaxis)

- [ ] Revisar contraste de la paleta clara: texto blanco sobre `#D4AF37` queda bajo (~2:1); valorar usar `primary_` (`#B88A24`) o tinta oscura en botones primarios

- [ ] **Compilar y probar lo nuevo de ingresos/egresos**: en el entorno donde se hicieron estos cambios no había red ni PostgreSQL, así que solo se revisó la sintaxis con `tsc`; falta correr `npm install`, `npm run typecheck`, `npm run build` (backend y frontend) y probar crear/editar/buscar/eliminar contra la base
- [ ] Completar el responsable en los registros anteriores a esta versión (quedan con esas columnas vacías y al editarlos se exigirán los datos); decidir si se hace una carga masiva o se deja manual
- [ ] Decidir si el responsable debe ser un maestro/catálogo de terceros reutilizable (hoy se escribe en cada movimiento)

- [ ] Revisar visualmente la UI en el navegador (claro y oscuro, móvil y escritorio); aquí solo se verificó que compila y que el CSS se genera
- [ ] Probar el login real con Firebase (proyecto, dominio autorizado, credenciales Admin)
- [ ] Consolidado en Excel (.xlsx) y/o PDF; hoy es CSV
- [ ] Pantalla para consultar el historial de aperturas/cierres/reaperturas (`period_events` ya se guarda)
- [ ] Reportes adicionales: comparativo entre meses y exportación de los reportes filtrados a CSV/Excel
- [ ] Pruebas automáticas (unitarias de reglas de períodos y de integración de la API)
- [ ] Migraciones versionadas (hoy un único `schema.sql`)
- [ ] Despliegue: Dockerfiles, CI, variables de producción, HTTPS, CORS restrictivo
- [ ] Paginación en listados de movimientos
- [ ] Confirmar con el cliente los supuestos del README (quién puede cerrar, quién edita maestros, moneda)
- [ ] Valor sugerido dentro del formulario de maestros (hoy es un panel aparte porque `@joseparedesc/master-crud` no admite campos con formato de moneda)
