import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction, TransactionSourceType, TransactionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AccountingPeriodsService } from '../accounting/periods/accounting-periods.service';
import { MassIntentionsService } from '../mass-intentions/mass-intentions.service';
import { CreateDonationDto } from './dto/create-donation.dto';

// Decisión tomada sobre el punto abierto #2 del PRD ("¿una donación asociada
// a una intención genera automáticamente un movimiento financiero?"): SÍ.
// Se crea la Donation y su FinancialTransaction (INCOME) dentro de la misma
// transacción de base de datos, y solo si el período de receivedAt está
// abierto — así el cierre de mes es una regla real de dominio (PRD sección 28)
// y no solo del frontend.
@Injectable()
export class DonationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly periodsService: AccountingPeriodsService,
    private readonly massIntentionsService: MassIntentionsService,
  ) {}

  list(tenantId: string, massIntentionId?: string) {
    return this.prisma.donation.findMany({
      where: { tenantId, ...(massIntentionId ? { massIntentionId } : {}) },
      orderBy: { receivedAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const donation = await this.prisma.donation.findFirst({ where: { id, tenantId } });
    if (!donation) throw new NotFoundException('Donación no encontrada.');
    return donation;
  }

  async create(tenantId: string, userId: string, dto: CreateDonationDto) {
    const receivedAt = new Date(dto.receivedAt);

    // 1. Regla de cierre de período (lanza ACCOUNTING_PERIOD_CLOSED si aplica)
    await this.periodsService.validateAccountingPeriod(tenantId, receivedAt);

    // 2. La intención debe existir y pertenecer al mismo tenant
    const intention = await this.prisma.massIntention.findFirst({
      where: { id: dto.massIntentionId, tenantId },
    });
    if (!intention) throw new NotFoundException('Intención no encontrada.');

    // Categoría por defecto "Intenciones de misa" para el movimiento generado
    const category = await this.prisma.category.findFirst({
      where: { tenantId, type: 'INCOME', name: 'Intenciones de misa' },
    });

    const donation = await this.prisma.$transaction(async (tx) => {
      const created = await tx.donation.create({
        data: {
          tenantId,
          massIntentionId: dto.massIntentionId,
          amount: dto.amount,
          paymentMethod: dto.paymentMethod,
          receivedAt,
          reference: dto.reference,
          notes: dto.notes,
          createdById: userId,
        },
      });

      await tx.financialTransaction.create({
        data: {
          tenantId,
          type: TransactionType.INCOME,
          amount: dto.amount,
          date: receivedAt,
          categoryId: category?.id,
          description: `Donación - intención: ${intention.description}`,
          sourceType: TransactionSourceType.DONATION,
          sourceId: created.id,
          reference: dto.reference,
          createdById: userId,
        },
      });

      return created;
    });

    await this.massIntentionsService.recomputeStatus(tenantId, dto.massIntentionId);

    await this.auditService.log({
      tenantId,
      userId,
      action: AuditAction.CREATE_DONATION,
      entityType: 'Donation',
      entityId: donation.id,
      newValues: dto,
    });

    return donation;
  }
}
