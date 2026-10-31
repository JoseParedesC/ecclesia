# Changelog

## 1.2.0

### Agregado
- **Comprobante de estipendio**: formato de impresión propio de los ingresos de categoría Estipendio, con la información de la parroquia (logo, nombre, dirección, contacto) y de la intención (tipo, fecha de registro, fecha de realización, mención o petición, responsable, identificación, dirección, teléfono, correo, valor, quién lo registró y espacio para «Recibido por»). Ocupa **como máximo media hoja carta**: al imprimir varios salen dos por hoja, con guía de corte.
- Botón **Imprimir** en cada estipendio del listado de ingresos (también en períodos cerrados).
- El **reporte de estipendios** del reporteador usa ese mismo formato: un comprobante por estipendio; «Imprimir» saca todos los del filtro. Es el mismo componente (`StipendReceipt`) y el mismo mecanismo de impresión (`printStipendReceipts`) en ambos lugares.
- `GET /api/reports/stipends`, `GET /api/incomes` y `GET /api/incomes/:id` devuelven además `createdAt` y `registeredBy`; el reporte trae responsable, dirección, identificación, teléfono y correo.

### Cambiado
- **Ingresos: la fecha de registro es la fecha actual y no es editable.** El backend la fija al crear (zona horaria `APP_TIMEZONE`, por defecto `America/Bogota`) y la conserva al editar; ignora cualquier fecha enviada. La **fecha en que se realizará la intención** sigue siendo editable. Los egresos mantienen su fecha editable.
- La impresión de comprobantes usa hoja carta (`@page`) solo mientras se imprimen; el resto de los reportes conserva su tamaño.

### Notas de actualización
- Sin cambios de esquema. Opcional: definir `APP_TIMEZONE` en el backend (ver `.env.example`).
- Despliega backend y frontend juntos (el formulario de ingresos ya no envía `date`).

## 1.1.0

### Cambiado
- La categoría de ingreso **Intención** pasa a llamarse **Estipendio** (código `ESTIPENDIO`). La migración corre sola al arrancar el backend, conserva los ids (tipos y movimientos existentes quedan intactos) y renombra el tipo de ejemplo «Intención de misa» a «Estipendio de misa» solo si no fue modificado.
- Reportes, resumen y consolidado hablan de **Estipendios**. El endpoint `GET /api/reports/intentions` ahora es `GET /api/reports/stipends`; el total del resumen pasa de `intencion` a `estipendio`.
- Los montos se muestran con el símbolo `$` y separadores de miles; los centavos solo aparecen si existen.

### Agregado
- **Valor sugerido** para los tipos de la categoría Estipendio (`income_types.default_amount`): se configura en Maestros → Ingresos y se propone como monto al crear un ingreso de ese tipo (se puede modificar). Endpoint `PATCH /api/income-types/:id/default-amount`.
- Campo de valor `MoneyInput`: símbolo `$`, miles con punto, coma decimal (el punto del teclado numérico también cuenta como decimal), alineado a la derecha.
- La versión de la aplicación aparece en la barra lateral.

### Notas de actualización
- No requiere pasos manuales: al desplegar el backend, el esquema se actualiza solo (`AUTO_MIGRATE`). Despliega backend y frontend juntos (cambió una ruta y un campo del API).

## 1.0.0
- Versión base: períodos, ingresos y egresos con datos del responsable, maestros, usuarios por rol, reportes imprimibles, manual de usuario y datos de la parroquia.
