import { Controller, Get } from '@nestjs/common';
import { TenantRole } from '@prisma/client';
import { AuditService } from './audit.service';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('audit-logs')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles(TenantRole.ADMIN)
  list(@CurrentUser('tenantId') tenantId: string) {
    return this.auditService.listByTenant(tenantId);
  }
}
