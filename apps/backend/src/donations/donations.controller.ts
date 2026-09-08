import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { TenantRole } from '@prisma/client';
import { DonationsService } from './donations.service';
import { CreateDonationDto } from './dto/create-donation.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser, requireTenantId } from '../auth/types/authenticated-user.type';

@Controller('donations')
export class DonationsController {
  constructor(private readonly donationsService: DonationsService) {}

  @Get()
  list(@CurrentUser('tenantId') tenantId: string, @Query('massIntentionId') massIntentionId?: string) {
    return this.donationsService.list(tenantId, massIntentionId);
  }

  @Get(':id')
  findOne(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string) {
    return this.donationsService.findOne(tenantId, id);
  }

  @Post()
  @Roles(TenantRole.ADMIN, TenantRole.OPERATOR)
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateDonationDto) {
    return this.donationsService.create(requireTenantId(user), user.userId, dto);
  }
}
