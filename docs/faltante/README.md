# Lo faltante

Corte: 2026-09-08. Pendientes para completar el MVP (PRD sección 30) y
para llevar el proyecto a producción.

---

## Backend
- **Migración inicial de Prisma no generada**: este entorno de construcción
  no tiene salida de red a una base de datos PostgreSQL real, por lo que
  `npm run prisma:migrate --workspace=backend` debe ejecutarse localmente
  contra una base de datos accesible para generar la primera migración.
- **Tests automatizados**: no se incluyó ninguna suite de tests (unitarios
  ni e2e). Es el pendiente de mayor riesgo antes de producción — en
  particular, blindar con tests la regla de cierre de período
  (`validateAccountingPeriod`) y el aislamiento multi-tenant.
- **Multi-sede / múltiples capillas** (punto abierto #1 del PRD): no
  modelado — ver `docs/DECISIONES.md`.
- **Fase 3 del PRD** (planes, suscripciones, facturación, métricas globales
  del Super Admin): solo existe el modelo `Plan` en el schema, sin lógica de
  límites por plan ni pasarela de cobro.
- **Refresh token revocable**: hoy el logout es solo del lado del cliente
  (JWT stateless). Si se requiere invalidar sesiones activamente
  (ej. "cerrar sesión en todos los dispositivos"), hace falta una tabla de
  refresh tokens con estado.
- **Reapertura excepcional de períodos** (punto abierto #4 del PRD): se
  decidió no implementarla en el MVP (ver `docs/DECISIONES.md`); si el
  negocio la necesita más adelante, debe ir exclusivamente para Super Admin
  y con auditoría obligatoria.
- **Notificaciones/recordatorios** (Fase 2 del PRD): no implementado.
- **Exportación de reportes a Excel/PDF** (Fase 2 y PRD sección 21): el
  backend ya calcula los datos (`/reports/monthly`, `/reports/mass-intentions`);
  falta el endpoint que genere el archivo.

## Frontend
- **Vistas de calendario mensual/semanal/diaria** (PRD sección 6): solo se
  implementó la vista "Lista". Se recomienda una librería de calendario
  (`FullCalendar` o similar) para las otras tres vistas.
- **Reporte de ingresos/egresos/donaciones con filtros** (PRD sección 21):
  el backend expone los datos; falta la UI de filtros (fecha, categoría,
  método de pago, proveedor) y los reportes de donaciones específicamente
  (solo existen dashboard, reporte mensual y reporte de intenciones).
- **Exportación Excel/PDF** en el frontend (depende del endpoint pendiente
  arriba).
- **Manejo de zonas horarias por tenant**: hoy las fechas se muestran en la
  zona horaria del navegador, no en `Tenant.timezone`.
- **Diseño visual definitivo**: se usó una paleta y componentes mínimos de
  Tailwind; falta pasar por un sistema de diseño (p. ej. shadcn/ui, como
  sugiere el PRD sección 22) para un acabado visual profesional.
- **Responsive fino de tablas → tarjetas en mobile** (PRD sección 23): el
  layout general es responsive (menú desplegable/desplazable), pero las
  tablas de listados (Ingresos, Egresos, Intenciones, Movimientos, Usuarios)
  aún no colapsan a tarjetas en pantallas pequeñas.
- **Edición y borrado desde la UI** de Eventos, Intenciones, Ingresos y
  Egresos: los endpoints de `PATCH`/`DELETE` ya existen en el backend
  (con su validación de período), pero el frontend hoy solo tiene alta y
  listado — no hay acciones de editar/eliminar en las tablas.
- **Pantalla de detalle de evento** con sus intenciones asociadas (el
  backend ya devuelve `massIntentions` anidadas en `GET /events/:id`).

## Infraestructura / DevOps
- Los `Dockerfile` de `backend/` y `frontend/` son un punto de partida
  (build simple sin multi-stage optimizado); falta:
  - Multi-stage build para imágenes más livianas.
  - `docker-compose.yml` de producción que levante backend + frontend +
    PostgreSQL juntos (hoy el compose solo trae la base de datos).
  - CI/CD (build, test, deploy) — no configurado.
  - Variables de entorno de producción documentadas para
    Vercel/Railway/Render/Fly.io (PRD sección 33).
- **Backups y estrategia de recuperación de la base de datos**: no definida.
- **Monitoreo/observabilidad** (logs estructurados, métricas, alertas): no
  implementado — el backend solo tiene `console.error` para errores 5xx y
  fallas de auditoría.

## Cómo priorizar lo que sigue

1. Generar la migración inicial contra una base de datos real y correr el
   seed — es el primer paso obligatorio antes de poder probar cualquier
   otra cosa.
2. Tests e2e sobre la regla de cierre de período y el aislamiento
   multi-tenant (el mayor riesgo funcional del sistema).
3. Edición/borrado desde la UI (el backend ya lo soporta; es la brecha más
   visible para un usuario final).
4. Vistas de calendario mensual/semanal (hoy solo hay lista).
5. Exportación de reportes (Excel/PDF) y filtros en las pantallas de
   reportes.
