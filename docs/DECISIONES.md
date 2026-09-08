# Decisiones sobre puntos abiertos del PRD (sección 35)

El PRD original dejaba 13 preguntas pendientes antes de considerar definitivo
el modelo de datos. Para poder avanzar con la implementación, se tomaron las
siguientes decisiones. Son reversibles: el modelo Prisma y los módulos están
aislados de forma que cambiar cualquiera de estas decisiones no debería
implicar una reescritura completa.

1. **¿Varias sedes/capillas por iglesia?** → No en el MVP. Un `Tenant` = una
   iglesia con una sola sede. El campo queda preparado a nivel conceptual
   (Fase 2 del PRD ya lo menciona) pero no se modeló `Site`/`Sede` todavía.

2. **¿Una donación genera automáticamente un movimiento financiero?** → **Sí.**
   `DonationsService.create()` crea la `Donation` y su `FinancialTransaction`
   (tipo `INCOME`) en una misma transacción de base de datos, respetando el
   período contable de `receivedAt`.

3. **¿Quién puede cerrar un mes?** → Solo `ADMIN` (Administrador de Iglesia),
   igual que en el PRD sección 5.2. Aplicado con `@Roles(TenantRole.ADMIN)`
   en `AccountingPeriodsController.close()`.

4. **¿Existe reapertura excepcional?** → **No en el MVP.** No existe endpoint
   de reapertura (ni siquiera para Super Admin). La corrección de períodos
   cerrados debe hacerse mediante reversiones (ver punto 18 del PRD), que
   queda pendiente de implementar (ver `IMPLEMENTADO.md`).

5. **¿Los eventos de un mes cerrado pueden modificarse?** → **Sí.** El cierre
   de período solo bloquea *operaciones financieras* (Income, Expense,
   Donation), no `Event` ni `MassIntention` en sí mismas (una intención sin
   donación no tiene impacto contable). Ver punto 6.

6. **¿Una intención puede modificarse tras el cierre si no tiene movimiento
   financiero?** → **Sí**, `MassIntentionsService.update()` no valida período
   porque una intención por sí sola no es una operación financiera; solo lo
   es la `Donation` asociada.

7. **¿Se necesitan comprobantes/recibos?** → No en el MVP (Fase 2 del PRD ya
   los contempla como "Recibos" e "Impresión").

8. **¿Se requiere información del donante?** → Se modeló `requesterName` /
   `requesterPhone` en `MassIntention` (quien solicita la intención). No se
   agregó una entidad `Donor` separada para el MVP.

9. **¿Se manejará efectivo por cajas (cash management)?** → No en el MVP.
   `PaymentMethod` incluye `CASH` como método, pero no hay control de caja
   (apertura/cierre de caja, arqueo).

10. **¿Se necesita conciliación bancaria?** → No en el MVP (está listada en
    Fase 2 del PRD).

11. **Moneda por tenant** → Campo `Tenant.currency`, por defecto `COP`.
    Configurable por iglesia al crearla (`CreateTenantDto.currency`).

12. **Zona horaria por iglesia** → Campo `Tenant.timezone`, por defecto
    `America/Bogota`. El backend guarda todas las fechas en UTC; la
    conversión a la zona horaria del tenant queda pendiente en el frontend
    (ver `IMPLEMENTADO.md`).

13. **¿Facturación/suscripciones desde el MVP?** → No. Se modeló `Plan` en
    el schema de Prisma (con `maxUsers`/`maxEvents`) para no romper el
    esquema cuando se aborde la Fase 3, pero no hay lógica de facturación,
    límites por plan, ni pasarela de pagos.
