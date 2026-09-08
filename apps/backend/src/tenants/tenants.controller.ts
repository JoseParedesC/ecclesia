import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { SuperAdminOnly } from '../common/decorators/super-admin.decorator';

// Todas las rutas aquí son de administración global del SaaS.
@SuperAdminOnly()
@Controller('super-admin/tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  create(@Body() dto: CreateTenantDto) {
    return this.tenantsService.create(dto);
  }

  @Get()
  findAll() {
    return this.tenantsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tenantsService.findOne(id);
  }

  @Patch(':id/activate')
  activate(@Param('id') id: string) {
    return this.tenantsService.setStatus(id, 'ACTIVE');
  }

  @Patch(':id/suspend')
  suspend(@Param('id') id: string) {
    return this.tenantsService.setStatus(id, 'SUSPENDED');
  }
}
