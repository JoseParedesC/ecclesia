import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

// Este servicio expone exactamente los 7 métodos que espera el contrato
// MasterCrudAdapter<T> del paquete @joseparedesc/master-crud (ver README):
// list, getById, create, update, setActive, remove, countReferences.
// El frontend usa createRestAdapter apuntando a /api/categories siguiendo
// la convención REST por defecto documentada ahí.
@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  list(tenantId: string) {
    return this.prisma.category.findMany({ where: { tenantId }, orderBy: { name: 'asc' } });
  }

  async getById(tenantId: string, id: string) {
    const category = await this.prisma.category.findFirst({ where: { id, tenantId } });
    if (!category) throw new NotFoundException('Categoría no encontrada.');
    return category;
  }

  async create(tenantId: string, dto: CreateCategoryDto) {
    const existing = await this.prisma.category.findUnique({
      where: { tenantId_type_name: { tenantId, type: dto.type, name: dto.name } },
    });
    if (existing) throw new ConflictException('Ya existe una categoría con ese nombre y tipo.');

    return this.prisma.category.create({ data: { tenantId, type: dto.type, name: dto.name } });
  }

  async update(tenantId: string, id: string, dto: UpdateCategoryDto) {
    await this.getById(tenantId, id);
    return this.prisma.category.update({ where: { id }, data: dto });
  }

  async setActive(tenantId: string, id: string, isActive: boolean) {
    await this.getById(tenantId, id);
    return this.prisma.category.update({ where: { id }, data: { isActive } });
  }

  // Pre-check usado por master-crud antes de pedir confirmación de borrado
  // (ver README: "Manejo de no se puede eliminar: está en uso").
  async countReferences(tenantId: string, id: string) {
    await this.getById(tenantId, id);
    const [incomeCount, expenseCount, txnCount] = await Promise.all([
      this.prisma.income.count({ where: { tenantId, categoryId: id } }),
      this.prisma.expense.count({ where: { tenantId, categoryId: id } }),
      this.prisma.financialTransaction.count({ where: { tenantId, categoryId: id } }),
    ]);

    const referencedBy = [
      incomeCount > 0 && { description: 'Ingresos', count: incomeCount },
      expenseCount > 0 && { description: 'Egresos', count: expenseCount },
      txnCount > 0 && { description: 'Movimientos financieros', count: txnCount },
    ].filter(Boolean);

    return { referencedBy };
  }

  async remove(tenantId: string, id: string) {
    await this.getById(tenantId, id);
    const { referencedBy } = await this.countReferences(tenantId, id);

    if (referencedBy.length > 0) {
      // Responde 409 con el mismo formato que master-crud sabe interpretar
      // como fallback cuando no se llamó a /references antes (ver README).
      throw new ConflictException({ referencedBy });
    }

    // Sin referencias: borrado físico permitido (maestro sin historial).
    await this.prisma.category.delete({ where: { id } });
    return { success: true };
  }
}
