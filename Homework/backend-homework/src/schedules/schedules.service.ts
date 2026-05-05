import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SchedulesService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: { institutionId?: string; projectId?: string; userId?: string }) {
    return this.prisma.schedule.findMany({
      where: {
        ...(query.institutionId ? { institutionId: query.institutionId } : {}),
        projectId: query.projectId,
        project: query.userId ? {
          OR: [
            { userId: query.userId },
            { members: { some: { userId: query.userId } } }
          ]
        } : undefined
      },
      include: {
        project: { select: { id: true, name: true, color: true } }
      },
      orderBy: [
        { startTime: 'asc' }
      ]
    });
  }

  async create(data: any) {
    return this.prisma.schedule.create({
      data: {
        day: data.day,
        startTime: data.startTime,
        endTime: data.endTime,
        room: data.room,
        projectId: data.projectId,
        institutionId: data.institutionId
      }
    });
  }

  async remove(id: string) {
    return this.prisma.schedule.delete({ where: { id } });
  }
}
