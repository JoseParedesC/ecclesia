import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  // Rango de fechas para las vistas de calendario (mensual/semanal/diaria/lista).
  list(tenantId: string, from?: string, to?: string) {
    return this.prisma.event.findMany({
      where: {
        tenantId,
        ...(from || to
          ? {
              startDatetime: {
                ...(from ? { gte: new Date(from) } : {}),
                ...(to ? { lte: new Date(to) } : {}),
              },
            }
          : {}),
      },
      include: { massIntentions: true },
      orderBy: { startDatetime: 'asc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    // Siempre filtrando por tenantId: un id válido de otro tenant debe
    // comportarse igual que un id inexistente (ver PRD sección 26).
    const event = await this.prisma.event.findFirst({
      where: { id, tenantId },
      include: { massIntentions: { include: { donations: true } } },
    });
    if (!event) throw new NotFoundException('Evento no encontrado.');
    return event;
  }

  async create(tenantId: string, userId: string, dto: CreateEventDto) {
    const event = await this.prisma.event.create({
      data: {
        tenantId,
        title: dto.title,
        description: dto.description,
        eventType: dto.eventType,
        startDatetime: new Date(dto.startDatetime),
        endDatetime: dto.endDatetime ? new Date(dto.endDatetime) : undefined,
        location: dto.location,
        createdById: userId,
      },
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: AuditAction.CREATE_EVENT,
      entityType: 'Event',
      entityId: event.id,
      newValues: dto,
    });

    return event;
  }

  async update(tenantId: string, userId: string, id: string, dto: UpdateEventDto) {
    const existing = await this.findOne(tenantId, id);

    const updated = await this.prisma.event.update({
      where: { id },
      data: {
        ...dto,
        startDatetime: dto.startDatetime ? new Date(dto.startDatetime) : undefined,
        endDatetime: dto.endDatetime ? new Date(dto.endDatetime) : undefined,
      },
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: AuditAction.UPDATE_EVENT,
      entityType: 'Event',
      entityId: id,
      oldValues: existing,
      newValues: updated,
    });

    return updated;
  }

  async remove(tenantId: string, userId: string, id: string) {
    const existing = await this.findOne(tenantId, id);
    await this.prisma.event.delete({ where: { id } });

    await this.auditService.log({
      tenantId,
      userId,
      action: AuditAction.DELETE_EVENT,
      entityType: 'Event',
      entityId: id,
      oldValues: existing,
    });

    return { success: true };
  }
}
