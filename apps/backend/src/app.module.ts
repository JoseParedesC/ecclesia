import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { PrismaModule } from './prisma/prisma.module';
import { AuditModule } from './audit/audit.module';
import { AccountingPeriodsModule } from './accounting/periods/accounting-periods.module';

import { AuthModule } from './auth/auth.module';
import { TenantsModule } from './tenants/tenants.module';
import { UsersModule } from './users/users.module';
import { EventsModule } from './events/events.module';
import { MassIntentionsModule } from './mass-intentions/mass-intentions.module';
import { DonationsModule } from './donations/donations.module';
import { CategoriesModule } from './finance/categories/categories.module';
import { IncomeModule } from './finance/income/income.module';
import { ExpensesModule } from './finance/expenses/expenses.module';
import { ReportsModule } from './reports/reports.module';

import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { SuperAdminGuard } from './common/guards/super-admin.guard';
import { RolesGuard } from './common/guards/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 200 }]),

    // Globales (ver @Global() en cada módulo)
    PrismaModule,
    AuditModule,
    AccountingPeriodsModule,

    // Autenticación / administración
    AuthModule,
    TenantsModule,
    UsersModule,

    // Módulos de negocio (MVP, PRD sección 30)
    EventsModule,
    MassIntentionsModule,
    DonationsModule,
    CategoriesModule,
    IncomeModule,
    ExpensesModule,
    ReportsModule,
  ],
  providers: [
    // Orden de ejecución: Nest aplica los APP_GUARD en el orden en que se
    // registran. 1) Autenticación JWT (o @Public()) 2) Super Admin 3) Roles
    // de tenant. Así, todo endpoint sin @Public() exige un JWT válido antes
    // de evaluar ninguna otra regla de autorización.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: SuperAdminGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
