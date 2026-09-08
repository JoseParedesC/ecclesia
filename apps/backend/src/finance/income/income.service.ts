import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction, TransactionSourceType, TransactionType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { AccountingPeriodsService } from '../../accounting/periods/accounting-periods.service';
import { CreateIncomeDto } from './dto/create-income.dto';
import { UpdateIncomeDto } from './dto/update-income.dto';

@Injectable()
export class IncomeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly periodsService: AccountingPeriodsService,
  ) {}

  list(tenantId: string, from?: string, to?: string, categoryId?: string) {
    return this.prisma.income.findMany({
      where: {
        tenantId,
        ...(categoryId ? { categoryId } : {}),
        ...(from || to
          ? { date: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } }
          : {}),
      },
      include: { category: true },
      orderBy: { date: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const income = await this.prisma.income.findFirst({ where: { id, tenantId }, include: { category: true } });
    if (!income) throw new NotFoundException('Ingreso no encontrado.');
    return income;
  }

  async create(tenantId: string, userId: string, dto: CreateIncomeDto) {
    const date = new Date(dto.date);
    await this.periodsService.validateAccountingPeriod(tenantId, date);

    const income = await this.prisma.$transaction(async (tx) => {
      const created = await tx.income.create({
        data: {
          tenantId,
          date,
          categoryId: dto.categoryId,
          description: dto.description,
          amount: dto.amount,
          paymentMethod: dto.paymentMethod,
          reference: dto.reference,
          createdById: userId,
        },
      });

      await tx.financialTransaction.create({
        data: {
          tenantId,
          type: TransactionType.INCOME,
          amount: dto.amount,
          date,
          categoryId: dto.categoryId,
          description: dto.description,
          sourceType: TransactionSourceType.INCOME,
          sourceId: created.id,
          reference: dto.reference,
          createdById: userId,
        },
      });

      return created;
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: AuditAction.CREATE_INCOME,
      entityType: 'Income',
      entityId: income.id,
      newValues: dto,
    });

    return income;
  }

  // Editar/eliminar validan el período de la fecha ORIGINAL del registro
  // (no la nueva, si se intentara cambiar) para que un mes cerrado sea
  // realmente inmutable, tal como exige el PRD sección 15.
  async update(tenantId: string, userId: string, id: string, dto: UpdateIncomeDto) {
    const existing = await this.findOne(tenantId, id);
    await this.periodsService.validateAccountingPeriod(tenantId, existing.date);
    if (dto.date) {
      await this.periodsService.validateAccountingPeriod(tenantId, new Date(dto.date));
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.income.update({
        where: { id },
        data: { ...dto, date: dto.date ? new Date(dto.date) : undefined },
      });
      await tx.financialTransaction.updateMany({
        where: { sourceType: TransactionSourceType.INCOME, sourceId: id },
        data: {
          amount: dto.amount,
          date: dto.date ? new Date(dto.date) : undefined,
          categoryId: dto.categoryId,
          description: dto.description,
          reference: dto.reference,
        },
      });
      return result;
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: AuditAction.UPDATE_INCOME,
      entityType: 'Income',
      entityId: id,
      oldValues: existing,
      newValues: updated,
    });

    return updated;
  }

  async remove(tenantId: string, userId: string, id: string) {
    const existing = await this.findOne(tenantId, id);
    await this.periodsService.validateAccountingPeriod(tenantId, existing.date);

    await this.prisma.$transaction(async (tx) => {
      await tx.financialTransaction.deleteMany({
        where: { sourceType: TransactionSourceType.INCOME, sourceId: id },
      });
      await tx.income.delete({ where: { id } });
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: AuditAction.DELETE_INCOME,
      entityType: 'Income',
      entityId: id,
      oldValues: existing,
    });

    return { success: true };
  }
}
