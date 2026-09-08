import { Injectable } from '@nestjs/common';
import { AuditAction, PeriodStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { AccountingPeriodClosedException } from '../../common/exceptions/domain.exception';

// Servicio central de la regla de negocio descrita en el PRD (sección 28):
// "Todas las operaciones financieras deben pasar por una validación
// equivalente a validateAccountingPeriod()". Se inyecta en Income, Expense,
// Donation y en cualquier futuro módulo que escriba en FinancialTransaction.
//
// Diseño elegido para la "reapertura" (punto abierto #4 del PRD): NO existe
// endpoint de reapertura en el MVP. La única forma de corregir un período
// cerrado es mediante reversiones (VOID_TRANSACTION) que a su vez también
// respetan el período del movimiento ORIGINAL: si ya está cerrado, tampoco
// se puede revertir sin intervención de Super Admin (fuera del alcance MVP).
@Injectable()
export class AccountingPeriodsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  // Busca (o crea, si nunca se había tocado ese mes) el período correspondiente
  // a una fecha, y lanza AccountingPeriodClosedException si está CLOSED.
  // Debe llamarse SIEMPRE antes de crear/editar/eliminar una operación
  // financiera (Income, Expense, Donation -> FinancialTransaction).
  async validateAccountingPeriod(tenantId: string, date: Date): Promise<void> {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    const period = await this.getOrCreatePeriod(tenantId, year, month);

    if (period.status === PeriodStatus.CLOSED) {
      throw new AccountingPeriodClosedException(year, month);
    }
  }

  async getOrCreatePeriod(tenantId: string, year: number, month: number) {
    const existing = await this.prisma.accountingPeriod.findUnique({
      where: { tenantId_year_month: { tenantId, year, month } },
    });
    if (existing) return existing;

    return this.prisma.accountingPeriod.create({
      data: { tenantId, year, month },
    });
  }

  async list(tenantId: string) {
    return this.prisma.accountingPeriod.findMany({
      where: { tenantId },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
  }

  async findOne(tenantId: string, id: string) {
    return this.prisma.accountingPeriod.findFirstOrThrow({ where: { id, tenantId } });
  }

  // Calcula el resumen (ingresos, egresos, balance) a partir del libro
  // financiero único (FinancialTransaction), tal como recomienda el PRD
  // sección 12, para que el cierre sea consistente con reportes y dashboard.
  async getSummary(tenantId: string, year: number, month: number) {
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 1));

    const transactions = await this.prisma.financialTransaction.findMany({
      where: { tenantId, date: { gte: start, lt: end }, isVoided: false },
      include: { category: true },
    });

    const totalIncome = transactions
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const totalExpense = transactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return {
      year,
      month,
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      transactionCount: transactions.length,
    };
  }

  // Cierre mensual. Solo ADMIN (verificado por RolesGuard en el controller,
  // en línea con la decisión del PRD punto abierto #3: "quién puede cerrar
  // un mes" -> el Administrador de Iglesia).
  async close(tenantId: string, id: string, closedById: string) {
    const period = await this.findOne(tenantId, id);

    if (period.status === PeriodStatus.CLOSED) {
      throw new AccountingPeriodClosedException(period.year, period.month);
    }

    const updated = await this.prisma.accountingPeriod.update({
      where: { id: period.id },
      data: { status: PeriodStatus.CLOSED, closedAt: new Date(), closedById },
    });

    await this.auditService.log({
      tenantId,
      userId: closedById,
      action: AuditAction.CLOSE_PERIOD,
      entityType: 'AccountingPeriod',
      entityId: period.id,
      oldValues: { status: period.status },
      newValues: { status: updated.status, closedAt: updated.closedAt },
    });

    return updated;
  }
}
