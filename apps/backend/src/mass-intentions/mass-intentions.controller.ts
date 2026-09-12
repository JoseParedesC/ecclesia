import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { TenantRole } from '@prisma/client';
import { MassIntentionsService } from './mass-intentions.service';
import { CreateMassIntentionDto } from './dto/create-mass-intention.dto';
import { UpdateMassIntentionDto } from './dto/update-mass-intention.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { requireTenantId } from '../common/utils/require-tenant.util';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';

@Controller('mass-intentions')
export class MassIntentionsController {
  constructor(private readonly massIntentionsService: MassIntentionsService) {}

  @Get()
  list(@CurrentUser('tenantId') tenantId: string, @Query('status') status?: string) {
    return this.massIntentionsService.list(tenantId, status);
  }

  @Get(':id')
  findOne(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string) {
    return this.massIntentionsService.findOne(tenantId, id);
  }

  @Post()
  @Roles(TenantRole.ADMIN, TenantRole.OPERATOR)
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateMassIntentionDto) {
    return this.massIntentionsService.create(requireTenantId(user), user.userId, dto);
  }

  @Patch(':id')
  @Roles(TenantRole.ADMIN, TenantRole.OPERATOR)
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateMassIntentionDto,
  ) {
    return this.massIntentionsService.update(requireTenantId(user), user.userId, id, dto);
  }

  @Delete(':id')
  @Roles(TenantRole.ADMIN)
  remove(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string) {
    return this.massIntentionsService.remove(tenantId, id);
  }
}
