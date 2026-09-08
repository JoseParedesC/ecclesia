import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { TenantRole } from '@prisma/client';
import { UsersService } from './users.service';
import { InviteUserDto } from './dto/invite-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(TenantRole.ADMIN)
  list(@CurrentUser('tenantId') tenantId: string) {
    return this.usersService.listByTenant(tenantId);
  }

  @Post('invite')
  @Roles(TenantRole.ADMIN)
  invite(@CurrentUser('tenantId') tenantId: string, @Body() dto: InviteUserDto) {
    return this.usersService.invite(tenantId, dto);
  }

  @Patch(':userId/role')
  @Roles(TenantRole.ADMIN)
  updateRole(
    @CurrentUser('tenantId') tenantId: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateUserRoleDto,
  ) {
    return this.usersService.updateRole(tenantId, userId, dto.role);
  }

  @Patch(':userId/deactivate')
  @Roles(TenantRole.ADMIN)
  deactivate(@CurrentUser('tenantId') tenantId: string, @Param('userId') userId: string) {
    return this.usersService.deactivate(tenantId, userId);
  }
}
