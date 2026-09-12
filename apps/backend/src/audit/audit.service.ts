import { Injectable } from '@nestjs/common';
import { AuditAction } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

interface LogParams {
  tenantId: string | null;
  userId: string | null;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
}

// Servicio simple e inyectable. Se invoca explícitamente desde cada servicio
// de negocio en el punto donde ocurre la operación crítica (ver PRD sección 19).
// Nota: para no arriesgar la consistencia del dominio, el registro de auditoría
// nunca debe hacer fallar la transacción de negocio; los errores se capturan
// y se registran por separado (ver catch en log()).
@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(params: LogParams): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          tenantId: params.tenantId,
          userId: params.userId,
          action: params.action,
          entityType: params.entityType,
          entityId: params.entityId,
          oldValues: params.oldValues ?? undefined,
          newValues: params.newValues ?? undefined,
        },
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('No se pudo registrar el log de auditoría', err);
    }
  }

  async listByTenant(tenantId: string, take = 100) {
    return this.prisma.auditLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take,
      include: { user: { select: { fullName: true, email: true } } },
    });
  }
}
