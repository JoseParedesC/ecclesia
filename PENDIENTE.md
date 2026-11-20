# Estado de implementación — Categorías configurables (v1.3)

## Implementado en este avance

1. **Formulario de movimientos (`MovementForm.tsx`)**
   - Lee la configuración de la categoría que ya entrega el API.
   - Muestra la fecha asociada solo cuando la categoría la maneja y la marca obligatoria cuando corresponde.
   - Precarga valores sugeridos para cualquier categoría y bloquea el monto cuando el valor es fijo.
   - Si un valor fijo no está configurado para el tipo, impide guardar y explica que debe configurarse en Maestros.
   - Conserva la obligatoriedad de descripción para Estipendio.

2. **Valores sugeridos en Maestros**
   - `StipendDefaultsPanel` ahora es genérico y lista cualquier tipo de ingreso o egreso cuya categoría tenga habilitado el valor sugerido.
   - Se muestra debajo de la tabla tanto en Ingresos como en Egresos.
   - Distingue valores editables y fijos; el backend valida el permiso y la configuración.

3. **Reportes reales**
   - Reportes de movimientos y consolidado incluyen `eventDate` para ingresos y egresos.
   - `ReportTable` muestra la columna «Fecha asociada» cuando alguna categoría incluida la maneja.
   - Las filas identifican los montos fijos.
   - El endpoint de reportes incluye `fixedAmount` y `usesDate`.
   - El CSV del consolidado también incluye fecha asociada y marca de valor fijo.

4. **Consolidado dinámico**
   - El resumen mensual agrupa por todas las categorías de ingresos y egresos existentes, sin depender de ESTIPENDIO/DONACION/SERVICIO/GASTO.
   - El JSON del consolidado entrega categorías y totales por categoría.
   - El CSV utiliza las mismas categorías dinámicas.
   - Se conserva el saldo total del período.

5. **Renombramiento de fecha**
   - Se renombró el campo de API y frontend a `eventDate` y la columna de BD a `event_date`.
   - `schema.sql` migra los datos de `intention_date` existentes y agrega la columna a egresos sin perder información.
   - El nombre anterior solo permanece en el bloque de migración para instalaciones antiguas.

6. **Decisiones de reglas**
   - La descripción obligatoria permanece asociada a la categoría/código histórico `ESTIPENDIO`; no se agrega una quinta opción configurable en esta versión para evitar cambiar la semántica de los comprobantes de estipendio.
   - La etiqueta general de fecha será «Fecha asociada». Estipendio conserva en el formulario y comprobante su texto específico «Fecha en que se realizará la intención». No se agrega una etiqueta libre por categoría en esta versión.
   - La categoría controla si la fecha se muestra y si es obligatoria.

7. **Aviso por cambios de configuración**
   - Al activar fecha obligatoria, el API cuenta movimientos de esa categoría sin `event_date`.
   - La interfaz informa cuántos movimientos existentes quedan sin fecha asociada. No se modifican ni eliminan esos movimientos históricos.

## Validación pendiente

8. **Pruebas de integración y UI**
   - No se pudo ejecutar `npm ci` completo en este entorno (la instalación excedió el tiempo disponible).
   - Por lo tanto no se pudo confirmar `tsc`, `vite build`, migración real contra PostgreSQL ni pruebas en navegador.
   - Ejecutar en el entorno de desarrollo:
     1. `cd backend && npm ci && npm run typecheck`
     2. `cd frontend && npm ci && npm run typecheck && npm run build`
     3. Aplicar `npm run migrate` sobre una copia de una BD con datos y verificar que `incomes.event_date` conserva los valores anteriores y `expenses.event_date` existe.
     4. Probar `PATCH /categories/:kind/:id`, incluyendo la respuesta `missingEventDateCount`.
     5. Crear y editar ingresos/egresos con valor sugerido editable, valor fijo, fecha opcional y fecha obligatoria.
     6. Verificar reportes y consolidado con categorías adicionales, en claro/oscuro y móvil.

## Pendientes heredados

9. Los pendientes generales de `CHECKLIST.md` que requieren infraestructura, credenciales, impresora/PDF real, validación del cliente, despliegue o pruebas de navegador siguen abiertos. No se marcan como completados sin ejecutarlos.
