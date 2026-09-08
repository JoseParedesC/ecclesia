import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateMassIntentionDto } from './dto/create-mass-intention.dto';
import { UpdateMassIntentionDto } from './dto/update-mass-intention.dto';

@Injectable()
export class MassIntentionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  list(tenantId: string, status?: string) {
    return this.prisma.massIntention.findMany({
      where: { tenantId, ...(status ? { status: status as any } : {}) },
      include: { event: true, donations: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const intention = await this.prisma.massIntention.findFirst({
      where: { id, tenantId },
      include: { event: true, donations: true },
    });
    if (!intention) throw new NotFoundException('Intención no encontrada.');
    return intention;
  }

  async create(tenantId: string, userId: string, dto: CreateMassIntentionDto) {
    const intention = await this.prisma.massIntention.create({
      data: {
        tenantId,
        eventId: dto.eventId,
        intentionType: dto.intentionType,
        description: dto.description,
        requesterName: dto.requesterName,
        requesterPhone: dto.requesterPhone,
        expectedAmount: dto.expectedAmount,
        notes: dto.notes,
      },
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: AuditAction.CREATE_INTENTION,
      entityType: 'MassIntention',
      entityId: intention.id,
      newValues: dto,
    });

    return intention;
  }

  async update(tenantId: string, userId: string, id: string, dto: UpdateMassIntentionDto) {
    const existing = await this.findOne(tenantId, id);
    const updated = await this.prisma.massIntention.update({ where: { id }, data: dto as any });

    await this.auditService.log({
      tenantId,
      userId,
      action: AuditAction.UPDATE_INTENTION,
      entityType: 'MassIntention',
      entityId: id,
      oldValues: existing,
      newValues: updated,
    });

    return updated;
  }

  async remove(tenantId: string, id: string) {
    const intention = await this.findOne(tenantId, id);
    if (intention.donations.length > 0) {
      throw new NotFoundException('No se puede eliminar una intención con donaciones registradas.');
    }
    await this.prisma.massIntention.delete({ where: { id } });
    return { success: true };
  }

  // Recalcula el estado (PENDING/PARTIALLY_FUNDED/FUNDED) tras cada donación.
  // Ver PRD sección 8: la intención puede existir sin dinero, con dinero
  // parcial, o completamente cubierta.
  async recomputeStatus(tenantId: string, id: string) {
    const intention = await this.prisma.massIntention.findFirstOrThrow({
      where: { id, tenantId },
      include: { donations: true },
    });

    const totalReceived = intention.donations.reduce((sum, d) => sum + Number(d.amount), 0);
    const expected = Number(intention.expectedAmount);

    const status =
      totalReceived <= 0 ? 'PENDING' : totalReceived < expected ? 'PARTIALLY_FUNDED' : 'FUNDED';

    return this.prisma.massIntention.update({ where: { id }, data: { status } });
  }
}
