import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async create(userId: string, data: any) {
    const task = await this.prisma.task.create({
      data,
      include: { project: true },
    });

    await this.notificationsService.create({
      title: 'Nueva Tarea',
      message: `Se ha creado la tarea "${task.title}" en el proyecto "${task.project.name}"`,
      type: NotificationType.TASK,
      userId,
    });

    return task;
  }

  async findAllByProject(projectId: string, userId: string) {
    return this.prisma.task.findMany({
      where: { 
        projectId,
        project: { userId }
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    return this.prisma.task.findFirst({
      where: { 
        id,
        project: { userId }
      },
    });
  }

  async update(id: string, userId: string, data: any) {
    const task = await this.prisma.task.update({
      where: { id },
      data,
      include: { project: true },
    });

    if (data.status === 'DONE') {
      await this.notificationsService.create({
        title: 'Tarea Completada',
        message: `Has completado la tarea "${task.title}"`,
        type: NotificationType.TASK,
        userId,
      });
    }

    return task;
  }

  async remove(id: string, userId: string) {
    return this.prisma.task.delete({
      where: { id },
    });
  }
}
