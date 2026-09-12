import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { TenantRole } from '@prisma/client';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { requireTenantId } from '../../common/utils/require-tenant.util';
import { AuthenticatedUser } from '../../auth/types/authenticated-user.type';

@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  list(
    @CurrentUser('tenantId') tenantId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.expensesService.list(tenantId, from, to, categoryId);
  }

  @Get(':id')
  findOne(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string) {
    return this.expensesService.findOne(tenantId, id);
  }

  @Post()
  @Roles(TenantRole.ADMIN, TenantRole.OPERATOR)
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateExpenseDto) {
    return this.expensesService.create(requireTenantId(user), user.userId, dto);
  }

  @Patch(':id')
  @Roles(TenantRole.ADMIN)
  update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateExpenseDto) {
    return this.expensesService.update(requireTenantId(user), user.userId, id, dto);
  }

  @Delete(':id')
  @Roles(TenantRole.ADMIN)
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.expensesService.remove(requireTenantId(user), user.userId, id);
  }
}
