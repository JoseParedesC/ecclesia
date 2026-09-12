import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { TenantRole } from '@prisma/client';
import { TransactionsService } from './transactions.service';
import { VoidTransactionDto } from './dto/void-transaction.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { requireTenantId } from '../../common/utils/require-tenant.util';
import { AuthenticatedUser } from '../../auth/types/authenticated-user.type';

@Controller('financial-transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  list(@CurrentUser('tenantId') tenantId: string, @Query('from') from?: string, @Query('to') to?: string) {
    return this.transactionsService.list(tenantId, from, to);
  }

  @Get(':id')
  findOne(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string) {
    return this.transactionsService.findOne(tenantId, id);
  }

  // Solo ADMIN puede revertir movimientos (misma lógica que cerrar períodos).
  @Post(':id/void')
  @Roles(TenantRole.ADMIN)
  voidTransaction(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: VoidTransactionDto,
  ) {
    return this.transactionsService.voidTransaction(requireTenantId(user), user.userId, id, dto);
  }
}
