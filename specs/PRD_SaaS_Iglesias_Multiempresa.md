# PRD — SaaS Multiempresa de Gestión de Eventos, Intenciones y Finanzas para Iglesias

**Versión:** 1.0  
**Fecha:** 2026-09-07  
**Tipo:** SaaS multi-tenant / aplicación web responsive

---

## 1. Resumen

El producto será un SaaS multiempresa para iglesias, parroquias, capillas y comunidades religiosas que necesitan administrar en un único sistema:

- Eventos en un calendario.
- Intenciones de misa.
- Donaciones asociadas a intenciones.
- Ingresos.
- Egresos.
- Balance mensual.
- Cierres mensuales.
- Usuarios y permisos.
- Auditoría.
- Reportes.

Cada iglesia será un **tenant** independiente. Los datos de una iglesia nunca deben ser visibles ni compartidos con otra.

Una regla fundamental del sistema es que, una vez cerrado un período mensual, las operaciones de ese período quedan bloqueadas y no pueden ser creadas, modificadas ni eliminadas mediante las operaciones normales del sistema.

---

# 2. Problema

Las iglesias pueden llevar actualmente información en cuadernos, agendas, hojas de cálculo o sistemas separados. Esto dificulta:

- Mantener un registro centralizado de las intenciones.
- Saber cuánto dinero se recibió por cada intención.
- Diferenciar dinero esperado de dinero efectivamente recibido.
- Controlar ingresos y egresos mensuales.
- Obtener balances.
- Evitar modificaciones posteriores a un mes cerrado.
- Conocer quién realizó una operación.
- Mantener trazabilidad histórica.

---

# 3. Objetivo

Crear una aplicación web que permita gestionar:

> **Calendario + intenciones de misa + donaciones + ingresos + egresos + cierre contable mensual.**

El sistema debe garantizar la integridad de los períodos cerrados.

Ejemplo:

```text
Septiembre 2026

Ingresos:  $5.000.000
Egresos:   $3.200.000
Balance:   $1.800.000

Estado: CERRADO
```

Una vez cerrado:

```text
No se puede:
- Crear operaciones financieras del período.
- Editar operaciones financieras del período.
- Eliminar operaciones financieras del período.

Sí se puede:
- Consultar la información.
- Generar reportes.
```

---

# 4. Arquitectura Multi-Tenant

Cada iglesia representa un tenant.

```text
SaaS
│
├── Iglesia A
│   ├── Usuarios
│   ├── Eventos
│   ├── Intenciones
│   ├── Donaciones
│   ├── Ingresos
│   ├── Egresos
│   └── Cierres
│
├── Iglesia B
│   └── ...
│
└── Iglesia C
    └── ...
```

Se recomienda inicialmente:

```text
Una aplicación
Una API
Una base de datos PostgreSQL
Múltiples tenants
```

Cada entidad perteneciente a una iglesia debe estar asociada a un `tenant_id`.

El aislamiento debe aplicarse en el backend y nunca depender únicamente del frontend.

---

# 5. Roles

## 5.1 Super Admin

Administrador global del SaaS.

Permisos potenciales:

- Crear iglesias.
- Activar/desactivar iglesias.
- Administrar planes.
- Administrar suscripciones.
- Administrar usuarios de tenants.
- Consultar métricas globales.
- Gestionar configuración global.

El acceso a información financiera de una iglesia debe estar explícitamente controlado.

---

## 5.2 Administrador de Iglesia

Puede:

- Configurar la iglesia.
- Administrar usuarios.
- Crear y modificar eventos.
- Administrar intenciones.
- Registrar donaciones.
- Registrar ingresos.
- Registrar egresos.
- Consultar reportes.
- Realizar cierres mensuales.

---

## 5.3 Operador / Secretario

Puede:

- Crear eventos.
- Registrar intenciones.
- Registrar donaciones.
- Consultar calendario.
- Consultar información autorizada.

Inicialmente no debería poder:

- Cerrar períodos.
- Reabrir períodos.
- Modificar operaciones después del cierre.

---

## 5.4 Usuario de Consulta

Solo lectura.

Puede:

- Consultar calendario.
- Consultar intenciones.
- Consultar reportes autorizados.

No puede crear, modificar, eliminar ni cerrar.

---

# 6. Módulo de Calendario

El calendario es el punto central de la aplicación.

Debe soportar vistas:

- Mensual.
- Semanal.
- Diaria.
- Lista.

Tipos iniciales de evento:

- Misa.
- Celebración.
- Reunión.
- Bautismo.
- Matrimonio.
- Funeral.
- Confesiones.
- Actividad parroquial.
- Evento personalizado.

### Entidad Event

Campos propuestos:

```text
id
tenant_id
title
description
event_type
start_datetime
end_datetime
location
status
created_by
created_at
updated_at
```

---

# 7. Intenciones de Misa

Una misa puede tener una o varias intenciones.

Ejemplo:

```text
Misa
15/09/2026 - 7:00 PM

Intenciones:
1. Por el alma de Juan Pérez
2. Por la salud de María Gómez
3. Acción de gracias - Familia Rodríguez
```

### Entidad MassIntention

Campos propuestos:

```text
id
tenant_id
event_id
intention_type
description
requester_name
requester_phone
expected_amount
status
notes
created_at
updated_at
```

La intención debe poder existir aunque todavía no se haya recibido dinero.

---

# 8. Donaciones

La donación debe separarse de la intención.

Esto permite casos como:

```text
Intención:
$50.000

Donación recibida:
$30.000
```

y posteriormente:

```text
Donación adicional:
$20.000
```

Total recibido:

```text
$50.000
```

También puede existir una intención sin donación.

### Entidad Donation

Campos:

```text
id
tenant_id
mass_intention_id
amount
payment_method
received_at
reference
notes
created_by
created_at
```

Métodos de pago iniciales:

```text
Efectivo
Transferencia
Tarjeta
Otro
```

---

# 9. Ingresos

No todos los ingresos provienen de intenciones.

Ejemplos:

- Donación general.
- Colecta.
- Venta de artículos religiosos.
- Alquiler de salón.
- Actividad parroquial.
- Donación especial.
- Otros.

### Entidad Income

Campos:

```text
id
tenant_id
date
category_id
description
amount
payment_method
reference
created_by
created_at
```

---

# 10. Egresos

Ejemplos:

- Servicios públicos.
- Salarios.
- Mantenimiento.
- Compra de materiales.
- Limpieza.
- Transporte.
- Ayudas.
- Actividades.
- Compras.
- Otros.

### Entidad Expense

Campos:

```text
id
tenant_id
date
category_id
description
amount
payment_method
reference
supplier
notes
created_by
created_at
```

---

# 11. Categorías

Las categorías deben poder configurarse por tenant.

### Categorías de ingresos

```text
Colectas
Donaciones
Intenciones de misa
Actividades
Venta
Otros
```

### Categorías de egresos

```text
Servicios
Mantenimiento
Personal
Compras
Ayudas
Transporte
Actividades
Otros
```

---

# 12. Libro Financiero

Se recomienda utilizar una entidad financiera común:

```text
FinancialTransaction
```

Conceptualmente:

```text
Donation ────────┐
                 │
Income ──────────┼──> FinancialTransaction
                 │
Expense ─────────┘
```

Esto facilita:

- Balances.
- Reportes.
- Auditoría.
- Cierres.
- Reconciliación.
- Evolución futura hacia contabilidad más completa.

Campos posibles:

```text
id
tenant_id
type
amount
date
category_id
description
source_type
source_id
reference
created_by
created_at
```

`type`:

```text
INCOME
EXPENSE
```

---

# 13. Relación Intención → Donación → Movimiento Financiero

Flujo recomendado:

```text
MassIntention
      │
      ▼
Donation
      │
      ▼
FinancialTransaction
```

Ejemplo:

```text
Intención:
Por el alma de Juan

Valor esperado:
$50.000

Donación:
$50.000

Movimiento:
INGRESO +$50.000
```

Esto evita mezclar el concepto de "intención" con el concepto contable de "dinero recibido".

---

# 14. Períodos Mensuales

Cada tenant tendrá períodos contables mensuales.

Ejemplo:

```text
2026-01
2026-02
2026-03
...
2026-09
```

### Entidad AccountingPeriod

```text
id
tenant_id
year
month
status
closed_at
closed_by
created_at
```

Estados:

```text
OPEN
CLOSED
```

---

# 15. Regla de Cierre

La regla fundamental es:

> Una operación financiera solo puede crearse, modificarse o anularse si su período contable está abierto.

Flujo:

```text
Crear operación
      │
      ▼
Determinar período
      │
      ▼
¿Está cerrado?
   /           SÍ            NO
 │              │
ERROR        Continuar
```

Respuesta esperada:

```json
{
  "code": "ACCOUNTING_PERIOD_CLOSED",
  "message": "El período septiembre de 2026 está cerrado."
}
```

Esta validación debe existir en el backend.

---

# 16. Cierre Mensual

Pantalla propuesta:

```text
CIERRE DE SEPTIEMBRE 2026

INGRESOS
────────────────────
Intenciones       $800.000
Otros ingresos  $2.000.000
────────────────────
TOTAL           $2.800.000

EGRESOS
────────────────────
Servicios         $500.000
Compras           $300.000
────────────────────
TOTAL             $800.000

BALANCE          $2.000.000


[ CERRAR SEPTIEMBRE ]
```

Confirmación:

```text
¿Está seguro?

Una vez cerrado el período no podrá crear,
modificar ni eliminar operaciones correspondientes
a septiembre de 2026.

[Cancelar] [Confirmar cierre]
```

---

# 17. Reapertura

Recomendación inicial:

```text
No existe reapertura para usuarios normales.
```

Si en el futuro se necesita corregir un período cerrado, podría existir:

```text
Solicitud de reapertura
```

con permisos exclusivos de Super Admin y auditoría obligatoria.

Otra alternativa, más rigurosa, es no permitir nunca la reapertura y utilizar operaciones de reversión/corrección.

---

# 18. Correcciones Financieras

Se recomienda evitar el borrado físico de operaciones financieras.

En lugar de:

```sql
DELETE FROM expenses
```

se puede utilizar:

```text
Anulación
Reversión
Movimiento correctivo
```

Ejemplo:

```text
Egreso incorrecto:
$100.000

Reversión:
+$100.000

Nuevo egreso correcto:
-$120.000
```

Esto conserva trazabilidad.

---

# 19. Auditoría

El sistema debe registrar las operaciones importantes.

### Entidad AuditLog

Campos:

```text
id
tenant_id
user_id
action
entity_type
entity_id
old_values
new_values
created_at
```

Ejemplos de acciones:

```text
LOGIN
CREATE_EVENT
UPDATE_EVENT
CREATE_INTENTION
CREATE_DONATION
CREATE_INCOME
CREATE_EXPENSE
VOID_TRANSACTION
CLOSE_PERIOD
```

Ejemplo:

```text
Usuario:
María González

Acción:
CREATE_EXPENSE

Fecha:
30/09/2026 16:32

Descripción:
Compra de productos de limpieza

Valor:
$120.000
```

---

# 20. Dashboard

El dashboard principal debería mostrar:

```text
┌──────────────────────────────────────────────┐
│ Septiembre 2026                             │
├──────────────────────────────────────────────┤
│                                              │
│ INGRESOS              EGRESOS                │
│ $2.800.000            $800.000               │
│                                              │
│ BALANCE                                      │
│ $2.000.000                                  │
│                                              │
├──────────────────────────────────────────────┤
│ INTENCIONES           DONACIONES             │
│ 43                    $800.000               │
├──────────────────────────────────────────────┤
│                                              │
│ Próximos eventos                             │
│                                              │
│ 10 Sep  Misa 7:00 PM                         │
│ 11 Sep  Misa 6:00 PM                         │
│ 12 Sep  Bautismo                             │
│                                              │
└──────────────────────────────────────────────┘
```

---

# 21. Reportes

## Reporte mensual

Debe mostrar:

- Total de ingresos.
- Total de egresos.
- Balance.
- Ingresos por categoría.
- Egresos por categoría.
- Cantidad de intenciones.
- Total recibido por intenciones.

---

## Reporte de intenciones

Columnas:

```text
Fecha
Misa
Solicitante
Intención
Valor esperado
Valor recibido
Estado
```

---

## Reporte de donaciones

```text
Fecha
Solicitante
Intención
Método de pago
Valor
```

---

## Reporte de ingresos

Filtros:

```text
Fecha
Categoría
Método de pago
```

---

## Reporte de egresos

Filtros:

```text
Fecha
Categoría
Proveedor
```

---

# 22. Frontend

Stack recomendado:

```text
Next.js
TypeScript
React
Tailwind CSS
shadcn/ui
TanStack Query
```

Estructura conceptual:

```text
frontend/
│
├── auth/
├── dashboard/
├── calendar/
├── mass-intentions/
├── donations/
├── finances/
│   ├── income/
│   ├── expenses/
│   └── transactions/
├── accounting/
│   └── periods/
├── reports/
├── settings/
└── users/
```

---

# 23. Navegación

Desktop:

```text
Dashboard

Calendario
  Eventos
  Intenciones

Finanzas
  Ingresos
  Egresos
  Movimientos

Contabilidad
  Cierres

Reportes

Configuración
  Iglesia
  Categorías
  Usuarios
```

Mobile:

- Menú desplegable.
- Menú desplazable verticalmente.
- Interfaz responsive.
- Tablas adaptadas a tarjetas cuando sea necesario.
- Formularios optimizados para pantalla pequeña.

---

# 24. Backend

Stack recomendado:

```text
NestJS
TypeScript
Prisma
PostgreSQL
JWT
```

Arquitectura:

```text
                  Frontend
                     │
                     ▼
                 REST API
                     │
       ┌─────────────┼─────────────┐
       │             │             │
Authentication   Tenant Context   Authorization
       │             │             │
       └─────────────┼─────────────┘
                     │
                     ▼
                  Modules
                     │
       ┌─────────────┼──────────────┐
       │             │              │
   Calendar       Finance       Accounting
       │             │              │
       └─────────────┼──────────────┘
                     │
                     ▼
                 PostgreSQL
```

No se recomienda comenzar con microservicios.

Un backend modular es suficiente para el MVP.

---

# 25. Multi-Tenancy en Backend

Todas las entidades relevantes deben estar asociadas a `tenant_id`.

Ejemplo:

```text
events

id
tenant_id
title
start_datetime
...
```

El backend debe obtener el tenant desde el usuario autenticado.

No debe confiar en:

```http
POST /events

{
  "tenant_id": 123
}
```

enviado por el cliente.

El contexto debe determinarse a partir de la autenticación y autorización.

---

# 26. Seguridad Multi-Tenant

Un usuario perteneciente al Tenant A nunca debe poder acceder a información del Tenant B aunque conozca un ID.

Ejemplo:

```http
GET /events/123
```

El backend debe comprobar:

```text
event.tenant_id === authenticatedUser.tenant_id
```

La misma protección debe aplicarse a:

- Eventos.
- Intenciones.
- Donaciones.
- Ingresos.
- Egresos.
- Categorías.
- Períodos.
- Reportes.
- Usuarios.
- Auditoría.

---

# 27. API inicial

## Auth

```http
POST /auth/login
POST /auth/refresh
POST /auth/logout
```

## Eventos

```http
GET    /events
GET    /events/:id
POST   /events
PATCH  /events/:id
DELETE /events/:id
```

## Intenciones

```http
GET    /mass-intentions
GET    /mass-intentions/:id
POST   /mass-intentions
PATCH  /mass-intentions/:id
DELETE /mass-intentions/:id
```

## Donaciones

```http
GET  /donations
GET  /donations/:id
POST /donations
```

## Ingresos

```http
GET    /income
POST   /income
PATCH  /income/:id
DELETE /income/:id
```

## Egresos

```http
GET    /expenses
POST   /expenses
PATCH  /expenses/:id
DELETE /expenses/:id
```

## Períodos

```http
GET  /accounting-periods
GET  /accounting-periods/:id
POST /accounting-periods/:id/close
```

No debe existir inicialmente un endpoint público para reabrir períodos.

---

# 28. Regla de Servicio para Operaciones Financieras

Todas las operaciones financieras deben pasar por una validación equivalente a:

```text
validateAccountingPeriod()
```

Ejemplo:

```text
crear egreso
      │
      ▼
obtener período según fecha
      │
      ▼
validar estado
      │
      ├── CLOSED → ERROR
      │
      └── OPEN → continuar
```

Esto garantiza que el cierre sea una regla real del dominio y no solo una restricción visual del frontend.

---

# 29. Modelo de Datos Inicial

```text
Tenant
 ├── Users
 ├── Events
 │    └── MassIntentions
 │          └── Donations
 │
 ├── Income
 ├── Expense
 ├── FinancialTransactions
 │
 ├── Categories
 ├── AccountingPeriods
 └── AuditLogs
```

Tablas iniciales:

```text
tenants
users
roles
user_tenants

events
event_types

mass_intentions
donations

financial_transactions
income
expenses
categories

accounting_periods

audit_logs
```

---

# 30. MVP

La primera versión debe incluir:

## Autenticación

- Login.
- Usuarios.
- Roles.
- Tenants.

## Calendario

- Calendario mensual.
- Eventos.
- Detalle de eventos.

## Intenciones

- Registrar intención.
- Asociar intención a misa.
- Registrar solicitante.
- Registrar valor esperado.

## Donaciones

- Registrar dinero recibido.
- Asociar donación con intención.
- Método de pago.

## Finanzas

- Ingresos.
- Egresos.
- Categorías.
- Balance mensual.

## Cierres

- Crear períodos.
- Consultar períodos.
- Cerrar período.
- Bloquear operaciones posteriores al cierre.

## Auditoría

- Registrar operaciones críticas.

---

# 31. Fase 2

Posteriormente:

- Reportes avanzados.
- Exportación Excel.
- Exportación PDF.
- Recibos.
- Impresión.
- Estadísticas.
- Múltiples sedes.
- Conciliación bancaria.
- Caja.
- Notificaciones.
- Recordatorios.
- Dashboard avanzado.

---

# 32. Fase 3 — SaaS Comercial

Planes posibles:

```text
FREE
BASIC
PRO
ENTERPRISE
```

Límites configurables:

```text
Usuarios
Eventos
Histórico
Reportes
Sedes
Almacenamiento
```

Administración global:

```text
Super Admin
    │
    ├── Tenants
    ├── Planes
    ├── Suscripciones
    ├── Facturación
    └── Métricas
```

---

# 33. Stack Recomendado

## Frontend

```text
Next.js
TypeScript
React
Tailwind CSS
shadcn/ui
TanStack Query
```

## Backend

```text
NestJS
TypeScript
Prisma
PostgreSQL
JWT
```

## Infraestructura inicial

```text
Frontend → Vercel
Backend  → Railway / Render / Fly.io
Database → PostgreSQL administrado
```

La infraestructura puede evolucionar posteriormente sin modificar el modelo conceptual del sistema.

---

# 34. Arquitectura Final

```text
                         INTERNET
                            │
                            ▼
                  ┌───────────────────┐
                  │     Next.js       │
                  │     Frontend      │
                  └─────────┬─────────┘
                            │
                            ▼
                  ┌───────────────────┐
                  │      NestJS       │
                  │       API         │
                  └─────────┬─────────┘
                            │
            ┌───────────────┼────────────────┐
            │               │                │
            ▼               ▼                ▼
      Authentication     Tenant          Authorization
            │             Context              │
            └───────────────┼──────────────────┘
                            │
                            ▼
                  ┌───────────────────┐
                  │      Modules      │
                  ├───────────────────┤
                  │ Calendar          │
                  │ Mass Intentions   │
                  │ Donations         │
                  │ Finance           │
                  │ Accounting        │
                  │ Reports           │
                  │ Users             │
                  │ Audit             │
                  └─────────┬─────────┘
                            │
                            ▼
                  ┌───────────────────┐
                  │    PostgreSQL     │
                  │                   │
                  │ tenant_id         │
                  │ tenant isolation  │
                  └───────────────────┘
```

---

# 35. Decisiones pendientes

Antes de crear el modelo definitivo de base de datos y comenzar la implementación, se deben definir:

1. Si una iglesia puede tener varias sedes/capillas.
2. Si una donación asociada a una intención genera automáticamente un movimiento financiero.
3. Quién puede cerrar un mes.
4. Si existe alguna forma excepcional de reabrir un período.
5. Si los eventos de un mes cerrado pueden modificarse.
6. Si una intención puede modificarse después de cerrado el mes cuando no tiene movimiento financiero.
7. Si se necesitan comprobantes/recibos.
8. Si se requiere información del donante.
9. Si se manejará efectivo por cajas.
10. Si se necesita conciliación bancaria.
11. Moneda utilizada por cada tenant.
12. Zona horaria de cada iglesia.
13. Si habrá facturación/suscripciones desde el MVP o posteriormente.

---

# 36. Próximo entregable técnico recomendado

Una vez definidas las decisiones anteriores, el siguiente documento debería ser la **Especificación Técnica**, incluyendo:

- Diagrama ER.
- Schema completo de PostgreSQL.
- Schema de Prisma.
- Relaciones.
- Índices.
- Constraints.
- Estrategia multi-tenant.
- Autenticación.
- Autorización.
- Roles y permisos.
- Módulos NestJS.
- Controllers.
- Services.
- DTOs.
- Endpoints REST.
- Manejo de errores.
- Reglas de cierre.
- Auditoría.
- Estructura de carpetas del monorepo.
- Arquitectura Next.js.
- Estrategia de estado/cache.
- Docker.
- Variables de entorno.
- Migraciones.
- Seeds.
- Estrategia de testing.
- Deployment.

**Nota:** Este PRD es la definición funcional inicial. Las decisiones pendientes deben resolverse antes de considerar definitivo el modelo de datos y las reglas contables.
