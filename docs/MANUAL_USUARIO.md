# Manual de usuario — Ecclesia

_Finanzas parroquiales: ingresos, egresos, cierre mensual y reportes._

## 1. Iniciar sesión

1. Abre la aplicación y pulsa **Ingresar con Google**.
2. Usa la cuenta de Google con la que te registraron. Si ves «Tu cuenta no está autorizada», pide a un administrador que te agregue en **Usuarios**.
3. Para cerrar sesión usa el botón **Cerrar sesión** al pie del menú lateral.

## 2. Roles y permisos

| Rol | Qué puede hacer |
|---|---|
| Administrador | Todo, incluida la gestión de usuarios de cualquier rol. |
| Sacerdote | Reabrir períodos, editar maestros y crear contadores y secretarios. |
| Contador | Reabrir períodos, editar maestros y definir la **cuenta contable**. No gestiona usuarios. |
| Secretario | Registra ingresos y egresos, abre y cierra períodos; **no** puede reabrir. Solo consulta los maestros. |

## 3. Períodos

Un período es un mes contable. Los movimientos solo se registran, editan o eliminan en períodos **abiertos**.

- **Abrir:** en **Períodos**, elige año y mes. Pueden existir como máximo **2 períodos abiertos a la vez y deben ser meses consecutivos**.
- **Cerrar:** el período queda de solo lectura. Se muestra su resumen y puedes descargar el **consolidado** (CSV).
- **Reabrir:** solo sacerdote, contador y administrador. Queda registrado quién y cuándo.

## 4. Ingresos y egresos

Cada módulo tiene **dos pantallas**: el listado y el formulario.

### Listado
- Elige el **período** arriba a la derecha.
- Busca por responsable, número de identificación, tipo o descripción, y filtra por **tipo**.
- Pulsa **Nuevo ingreso** / **Nuevo egreso** para crear. Con el lápiz editas y con la papelera eliminas (solo en períodos abiertos).

### Formulario
**Datos del movimiento:** tipo, fecha (dentro de un período abierto), monto y descripción.

- Si el tipo es una **intención**, también son obligatorios la **fecha en que se realizará** y la **mención o petición**.

**Responsable** (quien entrega el dinero en un ingreso, o a quien se le paga en un egreso):

| Campo | Obligatorio | Notas |
|---|---|---|
| Responsable | Sí | Nombre completo o razón social. |
| Dirección | Sí | |
| Tipo de identificación | Sí | NIT, CC o TI. |
| Número de identificación | Sí | CC y TI: solo dígitos. NIT: dígitos, con guion y dígito de verificación opcional (ej. `900123456-7`). |
| Teléfono de contacto | Sí | |
| Correo | No | |

Al guardar vuelves al listado.

## 5. Maestros

En **Maestros** se administran los **tipos de ingreso** y **tipos de egreso**: código, nombre, categoría (ingreso: Intención o Donación; egreso: Servicio o Gasto) y cuenta contable.

- Solo sacerdote, contador y administrador pueden crear o editar.
- La **cuenta contable** solo la definen el contador y el administrador.
- Un tipo con movimientos no se puede eliminar ni cambiar de código o categoría; puedes **desactivarlo**.

## 6. Reportes

En **Reportes** elige el filtro y pulsa generar:

- **Ingresos / Egresos:** rango de fechas, categoría y tipo. Incluye responsable e identificación.
- **Intenciones:** por fecha de realización o de registro.
- **Consolidado mensual:** ingresos, egresos y saldo del período.

Con **Imprimir** se abre el diálogo del navegador; ahí puedes elegir **Guardar como PDF**.

## 7. Usuarios

Solo lo ven los roles que pueden crear usuarios. Cada rol gestiona únicamente los roles que puede crear.

- **Nuevo usuario:** correo de Google exacto, nombre (opcional) y rol.
- **Editar:** nombre y rol (el correo no cambia). Nadie puede cambiar su propio rol ni desactivarse.
- **Desactivar:** la persona ya no puede iniciar sesión; sus registros se conservan.

## 8. Tema

En la barra superior puedes elegir tema **claro**, **oscuro** o **seguir el sistema**. Al imprimir siempre se usan colores claros.

## 9. Mensajes frecuentes

| Mensaje | Qué hacer |
|---|---|
| «El período … no existe / está cerrado» | Abre o reabre el período en **Períodos**. |
| «Solo pueden existir 2 períodos abiertos» | Cierra primero el más antiguo. |
| «El registro está en uso y no se puede eliminar» | Desactívalo en lugar de eliminarlo. |
| «Tu cuenta no está autorizada» | Pide a un administrador que te registre. |
