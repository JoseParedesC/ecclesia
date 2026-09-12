import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction, TransactionSourceType, TransactionType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { AccountingPeriodsService } from '../../accounting/periods/accounting-periods.service';
import { VoidTransactionDto } from './dto/void-transaction.dto';

// Implementa el punto 18 del PRD ("Correcciones Financieras"): en vez de
// borrar físicamente un movimiento, se crea una REVERSIÓN por el mismo
// monto y signo contrario, dejando ambos movimientos en el libro financiero
// para trazabilidad completa. El movimiento original se marca isVoided=true
// (deja de contar en balances) pero nunca se elimina.
//
// Importante: la reversión respeta el período del movimiento ORIGINAL. Si
// ese período ya está cerrado, no se puede revertir sin intervención de
// Super Admin (fuera del alcance del MVP) — así el cierre sigue siendo una
// garantía real y no un candado que cualquiera puede sortear revirtiendo.
@Injectable()
export class TransactionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly periodsService: AccountingPeriodsService,
  ) {}

  list(tenantId: string, from?: string, to?: string) {
    return this.prisma.financialTransaction.findMany({
      where: {
        tenantId,
        ...(from || to
          ? { date: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } }
          : {}),
      },
      include: { category: true },
      orderBy: { date: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const txn = await this.prisma.financialTransaction.findFirst({ where: { id, tenantId } });
    if (!txn) throw new NotFoundException('Movimiento no encontrado.');
    return txn;
  }

  async voidTransaction(tenantId: string, userId: string, id: string, dto: VoidTransactionDto) {
    const original = await this.findOne(tenantId, id);

    if (original.isVoided) {
      throw new BadRequestException('Este movimiento ya fue anulado.');
    }
    if (original.voidedTxnId) {
      throw new BadRequestException('Este movimiento es en sí mismo una reversión y no puede volver a anularse.');
    }

    // Bloquea la reversión si el período del movimiento original está cerrado.
    await this.periodsService.validateAccountingPeriod(tenantId, original.date);

    const reversal = await this.prisma.$transaction(async (tx) => {
      const created = await tx.financialTransaction.create({
        data: {
          tenantId,
          type: original.type,
          amount: original.amount,
          date: new Date(),
          categoryId: original.categoryId,
          description: `Reversión: ${dto.reason} (movimiento original: ${original.description})`,
          sourceType: TransactionSourceType.MANUAL,
          sourceId: original.id,
          reference: original.reference,
          createdById: userId,
        },
      });

      await tx.financialTransaction.update({
        where: { id: original.id },
        data: { isVoided: true, voidedTxnId: created.id },
      });

      return created;
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: AuditAction.VOID_TRANSACTION,
      entityType: 'FinancialTransaction',
      entityId: original.id,
      oldValues: { isVoided: false },
      newValues: { isVoided: true, reversalId: reversal.id, reason: dto.reason },
    });

    return reversal;
  }
}
