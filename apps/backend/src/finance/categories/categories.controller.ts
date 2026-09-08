import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { TenantRole } from '@prisma/client';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

// Rutas alineadas 1:1 con la convención REST por defecto de
// createRestAdapter (ver README de @joseparedesc/master-crud).
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  list(@CurrentUser('tenantId') tenantId: string) {
    return this.categoriesService.list(tenantId);
  }

  @Get(':id')
  getById(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string) {
    return this.categoriesService.getById(tenantId, id);
  }

  @Get(':id/references')
  countReferences(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string) {
    return this.categoriesService.countReferences(tenantId, id);
  }

  @Post()
  @Roles(TenantRole.ADMIN)
  create(@CurrentUser('tenantId') tenantId: string, @Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(tenantId, dto);
  }

  @Patch(':id')
  @Roles(TenantRole.ADMIN)
  update(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(tenantId, id, dto);
  }

  @Patch(':id/active')
  @Roles(TenantRole.ADMIN)
  setActive(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
  ) {
    return this.categoriesService.setActive(tenantId, id, isActive);
  }

  @Delete(':id')
  @Roles(TenantRole.ADMIN)
  remove(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string) {
    return this.categoriesService.remove(tenantId, id);
  }
}
