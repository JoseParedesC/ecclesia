import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { TenantRole } from '@prisma/client';
import { AccountingPeriodsService } from './accounting-periods.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { requireTenantId } from '../../common/utils/require-tenant.util';
import { AuthenticatedUser } from '../../auth/types/authenticated-user.type';

@Controller('accounting-periods')
export class AccountingPeriodsController {
  constructor(private readonly periodsService: AccountingPeriodsService) {}

  @Get()
  list(@CurrentUser('tenantId') tenantId: string) {
    return this.periodsService.list(tenantId);
  }

  @Get(':id')
  findOne(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string) {
    return this.periodsService.findOne(tenantId, id);
  }

  @Get(':id/summary')
  async summary(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string) {
    const period = await this.periodsService.findOne(tenantId, id);
    return this.periodsService.getSummary(tenantId, period.year, period.month);
  }

  // Nota PRD sección 27: "No debe existir inicialmente un endpoint público
  // para reabrir períodos" -> por eso no existe /accounting-periods/:id/reopen.
  @Post(':id/close')
  @Roles(TenantRole.ADMIN)
  close(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.periodsService.close(requireTenantId(user), id, user.userId);
  }
}
