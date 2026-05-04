import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(user: any, data: { ticketId: string; rating: number; comment?: string }) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: data.ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket no encontrado');
    }

    if (ticket.createdById !== user.userId) {
      throw new ForbiddenException('Solo el creador del ticket puede dejar una reseña');
    }

    return this.prisma.review.create({
      data: {
        rating: data.rating,
        comment: data.comment,
        ticket: { connect: { id: data.ticketId } },
        user: { connect: { id: user.userId } },
      },
    });
  }

  async findOne(id: string) {
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: {
        ticket: {
          select: {
            id: true,
            title: true,
            category: true,
            status: true,
          },
        },
        user: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!review) {
      throw new NotFoundException('Reseña no encontrada');
    }

    return review;
  }

  async findAllForTechnician(technicianId: string) {
    return this.prisma.review.findMany({
      where: {
        ticket: { assignedToId: technicianId },
      },
      include: {
        user: { select: { fullName: true, avatarUrl: true } },
        ticket: { select: { title: true, category: true } },
      },
    });
  }


  async getAverageRating(technicianId: string) {
    const result = await this.prisma.review.aggregate({
      where: {
        ticket: { assignedToId: technicianId },
      },
      _avg: { rating: true },
      _count: { rating: true },
    });

    return {
      average: result._avg.rating || 0,
      total: result._count.rating || 0,
    };
  }
}
