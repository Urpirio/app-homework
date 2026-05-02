import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class ProjectsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async create(userId: string, data: any) {
    const project = await this.prisma.project.create({
      data: {
        ...data,
        userId,
      },
    });

    await this.notificationsService.create({
      title: 'Nuevo Proyecto',
      message: `Has creado el proyecto "${project.name}"`,
      type: NotificationType.PROJECT,
      userId,
    });

    return project;
  }

  async findAllForUser(userId: string) {
    return this.prisma.project.findMany({
      where: { userId },
      include: {
        _count: {
          select: { tasks: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    return this.prisma.project.findFirst({
      where: { id, userId },
      include: { tasks: { orderBy: { createdAt: 'desc' } } },
    });
  }

  async update(id: string, userId: string, data: any) {
    return this.prisma.project.update({
      where: { id, userId },
      data,
    });
  }

  async remove(id: string, userId: string) {
    return this.prisma.project.delete({
      where: { id, userId },
    });
  }
}
