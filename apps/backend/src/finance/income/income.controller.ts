import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { TenantRole } from '@prisma/client';
import { IncomeService } from './income.service';
import { CreateIncomeDto } from './dto/create-income.dto';
import { UpdateIncomeDto } from './dto/update-income.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { requireTenantId } from '../../common/utils/require-tenant.util';
import { AuthenticatedUser } from '../../auth/types/authenticated-user.type';

@Controller('income')
export class IncomeController {
  constructor(private readonly incomeService: IncomeService) {}

  @Get()
  list(
    @CurrentUser('tenantId') tenantId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.incomeService.list(tenantId, from, to, categoryId);
  }

  @Get(':id')
  findOne(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string) {
    return this.incomeService.findOne(tenantId, id);
  }

  @Post()
  @Roles(TenantRole.ADMIN, TenantRole.OPERATOR)
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateIncomeDto) {
    return this.incomeService.create(requireTenantId(user), user.userId, dto);
  }

  @Patch(':id')
  @Roles(TenantRole.ADMIN)
  update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateIncomeDto) {
    return this.incomeService.update(requireTenantId(user), user.userId, id, dto);
  }

  @Delete(':id')
  @Roles(TenantRole.ADMIN)
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.incomeService.remove(requireTenantId(user), user.userId, id);
  }
}
