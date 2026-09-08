import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { TenantRole } from '@prisma/client';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser, requireTenantId } from '../auth/types/authenticated-user.type';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  list(
    @CurrentUser('tenantId') tenantId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.eventsService.list(tenantId, from, to);
  }

  @Get(':id')
  findOne(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string) {
    return this.eventsService.findOne(tenantId, id);
  }

  @Post()
  @Roles(TenantRole.ADMIN, TenantRole.OPERATOR)
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateEventDto) {
    return this.eventsService.create(requireTenantId(user), user.userId, dto);
  }

  @Patch(':id')
  @Roles(TenantRole.ADMIN, TenantRole.OPERATOR)
  update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateEventDto) {
    return this.eventsService.update(requireTenantId(user), user.userId, id, dto);
  }

  @Delete(':id')
  @Roles(TenantRole.ADMIN)
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.eventsService.remove(requireTenantId(user), user.userId, id);
  }
}
