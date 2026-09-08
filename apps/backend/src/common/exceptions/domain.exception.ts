import { BadRequestException, ForbiddenException } from '@nestjs/common';

// Formato exigido por el PRD (sección 15) para el bloqueo de períodos cerrados:
// { "code": "ACCOUNTING_PERIOD_CLOSED", "message": "..." }
export class AccountingPeriodClosedException extends BadRequestException {
  constructor(year: number, month: number) {
    const monthNames = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
    ];
    super({
      code: 'ACCOUNTING_PERIOD_CLOSED',
      message: `El período ${monthNames[month - 1]} de ${year} está cerrado.`,
    });
  }
}

// Se lanza cuando un recurso pertenece a otro tenant. Nunca debe filtrar
// si el recurso existe o no en el tenant ajeno (evita enumeración).
export class CrossTenantAccessException extends ForbiddenException {
  constructor() {
    super({
      code: 'CROSS_TENANT_ACCESS_DENIED',
      message: 'No tiene acceso a este recurso.',
    });
  }
}

export class NoActiveTenantException extends ForbiddenException {
  constructor() {
    super({
      code: 'NO_ACTIVE_TENANT',
      message: 'La sesión no tiene una iglesia (tenant) activa asociada.',
    });
  }
}
