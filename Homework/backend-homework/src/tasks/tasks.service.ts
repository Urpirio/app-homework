import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType, TaskType } from '@prisma/client';

@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async create(userId: string, data: any) {
    let status = data.status;
    if (status) {
      status = status.toUpperCase().replace(/-/g, '_');
    }
    const task = await this.prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        status: status,
        type: data.type as TaskType,
        maxGrade: data.maxGrade,
        project: { connect: { id: data.projectId } },
        unit: data.unitId ? { connect: { id: data.unitId } } : undefined,
        dueDate: data.dueDate,
      },
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
        OR: [
          { project: { userId } },
          { project: { members: { some: { userId } } } }
        ]
      },
      include: { 
        project: {
          include: { user: { select: { fullName: true } } }
        },
        unit: true,
        submissions: {
          where: { studentId: userId },
          take: 1
        }
      },
    });
  }

  async update(id: string, userId: string, data: any) {
    // Verificar que la tarea pertenece al usuario
    const existingTask = await this.prisma.task.findFirst({
      where: { id, project: { userId } },
    });

    if (!existingTask) {
      throw new Error('Task not found or unauthorized');
    }

    let status = data.status;
    if (status) {
      status = status.toUpperCase().replace(/-/g, '_');
    }

    const task = await this.prisma.task.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        status: status,
        type: data.type as TaskType,
        maxGrade: data.maxGrade,
        unit: data.unitId ? { connect: { id: data.unitId } } : (data.unitId === null ? { disconnect: true } : undefined),
        dueDate: data.dueDate,
      },
      include: { project: true },
    });

    if (status === 'DONE' && existingTask.status !== 'DONE') {
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
    // Verificar propiedad antes de eliminar
    const task = await this.prisma.task.findFirst({
      where: { id, project: { userId } },
    });

    if (!task) {
      throw new Error('Task not found or unauthorized');
    }

    return this.prisma.task.delete({
      where: { id },
    });
  }
}
