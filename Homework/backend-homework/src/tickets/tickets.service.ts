import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Role, TicketStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TicketsService {
  constructor(private prisma: PrismaService) {}

  async create(user: any, data: { title: string; description: string; category: string }) {
    return this.prisma.ticket.create({
      data: {
        ...data,
        createdBy: { connect: { id: user.userId } },
      },
    });
  }

  async findAllForUser(userId: string, role?: string) {
    // SUPPORT staff sees: tickets assigned to them + unassigned OPEN tickets
    if (role === 'SUPPORT') {
      return this.prisma.ticket.findMany({
        where: {
          OR: [
            { assignedToId: userId },
            { assignedToId: null, status: TicketStatus.OPEN },
          ],
        },
        include: {
          createdBy: { select: { fullName: true, avatarUrl: true } },
          assignedTo: { select: { fullName: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    // Other roles: only their own tickets
    return this.prisma.ticket.findMany({
      where: {
        OR: [
          { createdById: userId },
          { assignedToId: userId },
        ],
      },
      include: {
        createdBy: { select: { fullName: true } },
        assignedTo: { select: { fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: {
        createdBy: { select: { fullName: true, email: true } },
        assignedTo: { select: { fullName: true, email: true } },
        review: true,
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket no encontrado');
    }

    return ticket;
  }

  async update(id: string, user: any, data: any) {
    const ticket = await this.findOne(id);

    // Only creator or assigned technician or admin can update
    if (
      user.role !== Role.SUPER_ADMIN &&
      user.role !== Role.SUPPORT &&
      user.userId !== ticket.createdById &&
      user.userId !== ticket.assignedToId
    ) {
      throw new ForbiddenException('No tienes permiso para actualizar este ticket');
    }

    return this.prisma.ticket.update({
      where: { id },
      data,
    });
  }

  async assign(id: string, technicianId: string) {
    return this.prisma.ticket.update({
      where: { id },
      data: {
        assignedTo: { connect: { id: technicianId } },
        status: TicketStatus.IN_PROGRESS,
      },
    });
  }
}
