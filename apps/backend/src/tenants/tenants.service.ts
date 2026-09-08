import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { TenantRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  // Solo Super Admin (controlado por SuperAdminGuard en el controller).
  async create(dto: CreateTenantDto) {
    const existingSlug = await this.prisma.tenant.findUnique({ where: { slug: dto.slug } });
    if (existingSlug) {
      throw new ConflictException('Ya existe una iglesia con ese identificador (slug).');
    }

    return this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          timezone: dto.timezone ?? 'America/Bogota',
          currency: dto.currency ?? 'COP',
        },
      });

      // Categorías por defecto sugeridas en el PRD (sección 11)
      const incomeCategories = ['Colectas', 'Donaciones', 'Intenciones de misa', 'Actividades', 'Venta', 'Otros'];
      const expenseCategories = ['Servicios', 'Mantenimiento', 'Personal', 'Compras', 'Ayudas', 'Transporte', 'Actividades', 'Otros'];

      await tx.category.createMany({
        data: [
          ...incomeCategories.map((name) => ({ tenantId: tenant.id, type: 'INCOME' as const, name })),
          ...expenseCategories.map((name) => ({ tenantId: tenant.id, type: 'EXPENSE' as const, name })),
        ],
      });

      let adminUser = await tx.user.findUnique({ where: { email: dto.adminEmail } });
      if (!adminUser) {
        adminUser = await tx.user.create({
          data: { email: dto.adminEmail, fullName: dto.adminFullName },
        });
      }

      await tx.userTenant.create({
        data: { userId: adminUser.id, tenantId: tenant.id, role: TenantRole.ADMIN },
      });

      // Período contable del mes actual, abierto por defecto
      const now = new Date();
      await tx.accountingPeriod.create({
        data: { tenantId: tenant.id, year: now.getFullYear(), month: now.getMonth() + 1 },
      });

      return tenant;
    });
  }

  findAll() {
    return this.prisma.tenant.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) throw new NotFoundException('Iglesia no encontrada.');
    return tenant;
  }

  async setStatus(id: string, status: 'ACTIVE' | 'SUSPENDED') {
    await this.findOne(id);
    return this.prisma.tenant.update({ where: { id }, data: { status } });
  }
}
