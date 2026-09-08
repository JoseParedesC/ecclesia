import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction, TransactionSourceType, TransactionType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { AccountingPeriodsService } from '../../accounting/periods/accounting-periods.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

@Injectable()
export class ExpensesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly periodsService: AccountingPeriodsService,
  ) {}

  list(tenantId: string, from?: string, to?: string, categoryId?: string) {
    return this.prisma.expense.findMany({
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
    const expense = await this.prisma.expense.findFirst({ where: { id, tenantId }, include: { category: true } });
    if (!expense) throw new NotFoundException('Egreso no encontrado.');
    return expense;
  }

  async create(tenantId: string, userId: string, dto: CreateExpenseDto) {
    const date = new Date(dto.date);
    await this.periodsService.validateAccountingPeriod(tenantId, date);

    const expense = await this.prisma.$transaction(async (tx) => {
      const created = await tx.expense.create({
        data: {
          tenantId,
          date,
          categoryId: dto.categoryId,
          description: dto.description,
          amount: dto.amount,
          paymentMethod: dto.paymentMethod,
          reference: dto.reference,
          supplier: dto.supplier,
          notes: dto.notes,
          createdById: userId,
        },
      });

      await tx.financialTransaction.create({
        data: {
          tenantId,
          type: TransactionType.EXPENSE,
          amount: dto.amount,
          date,
          categoryId: dto.categoryId,
          description: dto.description,
          sourceType: TransactionSourceType.EXPENSE,
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
      action: AuditAction.CREATE_EXPENSE,
      entityType: 'Expense',
      entityId: expense.id,
      newValues: dto,
    });

    return expense;
  }

  async update(tenantId: string, userId: string, id: string, dto: UpdateExpenseDto) {
    const existing = await this.findOne(tenantId, id);
    await this.periodsService.validateAccountingPeriod(tenantId, existing.date);
    if (dto.date) {
      await this.periodsService.validateAccountingPeriod(tenantId, new Date(dto.date));
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.expense.update({
        where: { id },
        data: { ...dto, date: dto.date ? new Date(dto.date) : undefined },
      });
      await tx.financialTransaction.updateMany({
        where: { sourceType: TransactionSourceType.EXPENSE, sourceId: id },
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
      action: AuditAction.UPDATE_EXPENSE,
      entityType: 'Expense',
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
        where: { sourceType: TransactionSourceType.EXPENSE, sourceId: id },
      });
      await tx.expense.delete({ where: { id } });
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: AuditAction.DELETE_EXPENSE,
      entityType: 'Expense',
      entityId: id,
      oldValues: existing,
    });

    return { success: true };
  }
}
