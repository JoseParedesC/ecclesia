# Changelog

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
