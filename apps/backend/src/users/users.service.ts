import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { TenantRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { InviteUserDto } from './dto/invite-user.dto';

// Todos los métodos reciben tenantId explícitamente desde el AuthenticatedUser
// del request (nunca desde el body) para garantizar el aislamiento multi-tenant.
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async listByTenant(tenantId: string) {
    return this.prisma.userTenant.findMany({
      where: { tenantId },
      include: { user: { select: { id: true, email: true, fullName: true, avatarUrl: true, isActive: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async invite(tenantId: string, dto: InviteUserDto) {
    let user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) {
      user = await this.prisma.user.create({ data: { email: dto.email, fullName: dto.fullName } });
    }

    const existingMembership = await this.prisma.userTenant.findUnique({
      where: { userId_tenantId: { userId: user.id, tenantId } },
    });
    if (existingMembership) {
      throw new ConflictException('Este usuario ya pertenece a la iglesia.');
    }

    return this.prisma.userTenant.create({
      data: { userId: user.id, tenantId, role: dto.role },
      include: { user: true },
    });
  }

  async updateRole(tenantId: string, userId: string, role: TenantRole) {
    const membership = await this.prisma.userTenant.findUnique({
      where: { userId_tenantId: { userId, tenantId } },
    });
    if (!membership) throw new NotFoundException('El usuario no pertenece a esta iglesia.');

    return this.prisma.userTenant.update({
      where: { userId_tenantId: { userId, tenantId } },
      data: { role },
    });
  }

  async deactivate(tenantId: string, userId: string) {
    const membership = await this.prisma.userTenant.findUnique({
      where: { userId_tenantId: { userId, tenantId } },
    });
    if (!membership) throw new NotFoundException('El usuario no pertenece a esta iglesia.');

    return this.prisma.userTenant.update({
      where: { userId_tenantId: { userId, tenantId } },
      data: { isActive: false },
    });
  }
}
