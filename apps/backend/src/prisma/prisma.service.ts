import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

// Cliente Prisma como servicio inyectable en toda la app.
// Todas las queries de negocio DEBEN filtrar por tenantId; este servicio
// no aplica el filtro automáticamente (ver TenantPrismaService / TenantGuard)
// para dejar explícito, en cada repositorio, el filtro multi-tenant.
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
