import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  // Dashboard principal (PRD sección 20)
  async dashboard(tenantId: string) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 1));

    const [transactions, intentionsCount, donationsAgg, upcomingEvents] = await Promise.all([
      this.prisma.financialTransaction.findMany({
        where: { tenantId, date: { gte: start, lt: end }, isVoided: false },
      }),
      this.prisma.massIntention.count({ where: { tenantId, createdAt: { gte: start, lt: end } } }),
      this.prisma.donation.aggregate({
        where: { tenantId, receivedAt: { gte: start, lt: end } },
        _sum: { amount: true },
      }),
      this.prisma.event.findMany({
        where: { tenantId, startDatetime: { gte: now } },
        orderBy: { startDatetime: 'asc' },
        take: 5,
      }),
    ]);

    const totalIncome = transactions.filter((t) => t.type === 'INCOME').reduce((s, t) => s + Number(t.amount), 0);
    const totalExpense = transactions.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + Number(t.amount), 0);

    return {
      period: { year, month },
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      massIntentionsCount: intentionsCount,
      donationsTotal: Number(donationsAgg._sum.amount ?? 0),
      upcomingEvents,
    };
  }

  // Reporte mensual (PRD sección 21)
  async monthly(tenantId: string, year: number, month: number) {
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 1));

    const transactions = await this.prisma.financialTransaction.findMany({
      where: { tenantId, date: { gte: start, lt: end }, isVoided: false },
      include: { category: true },
    });

    const byCategory = (type: 'INCOME' | 'EXPENSE') => {
      const map = new Map<string, number>();
      transactions
        .filter((t) => t.type === type)
        .forEach((t) => {
          const key = t.category?.name ?? 'Sin categoría';
          map.set(key, (map.get(key) ?? 0) + Number(t.amount));
        });
      return Array.from(map.entries()).map(([category, total]) => ({ category, total }));
    };

    const totalIncome = transactions.filter((t) => t.type === 'INCOME').reduce((s, t) => s + Number(t.amount), 0);
    const totalExpense = transactions.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + Number(t.amount), 0);

    const [intentionsCount, donationsAgg] = await Promise.all([
      this.prisma.massIntention.count({ where: { tenantId, createdAt: { gte: start, lt: end } } }),
      this.prisma.donation.aggregate({ where: { tenantId, receivedAt: { gte: start, lt: end } }, _sum: { amount: true } }),
    ]);

    return {
      year,
      month,
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      incomeByCategory: byCategory('INCOME'),
      expenseByCategory: byCategory('EXPENSE'),
      massIntentionsCount: intentionsCount,
      donationsTotal: Number(donationsAgg._sum.amount ?? 0),
    };
  }

  // Reporte de intenciones (PRD sección 21)
  async massIntentionsReport(tenantId: string) {
    const intentions = await this.prisma.massIntention.findMany({
      where: { tenantId },
      include: { event: true, donations: true },
      orderBy: { createdAt: 'desc' },
    });

    return intentions.map((i) => ({
      fecha: i.event?.startDatetime ?? i.createdAt,
      misa: i.event?.title ?? null,
      solicitante: i.requesterName,
      intencion: i.description,
      valorEsperado: Number(i.expectedAmount),
      valorRecibido: i.donations.reduce((s, d) => s + Number(d.amount), 0),
      estado: i.status,
    }));
  }
}
