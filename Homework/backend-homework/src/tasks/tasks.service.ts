import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Task, NotificationType } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async create(userId: string, data: Prisma.TaskUncheckedCreateInput): Promise<Task> {
    const project = await this.prisma.project.findUnique({
      where: { id: data.projectId },
    });

    if (!project) {
      throw new NotFoundException(`Project not found`);
    }

    if (project.userId !== userId) {
      throw new ForbiddenException(`You do not own this project`);
    }

    const task = await this.prisma.task.create({
      data,
    });

    await this.notificationsService.create(userId, {
      title: 'Nueva Tarea',
      message: `Has creado la tarea "${task.title}".`,
      type: NotificationType.TASK,
    });

    return task;
  }

  async findAllByProject(projectId: string, userId: string): Promise<Task[]> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException(`Project not found`);
    }

    if (project.userId !== userId) {
      throw new ForbiddenException(`You do not own this project`);
    }

    return this.prisma.task.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string): Promise<Task> {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!task) {
      throw new NotFoundException(`Task not found`);
    }

    if (task.project.userId !== userId) {
      throw new ForbiddenException(`You do not own the project for this task`);
    }

    return task;
  }

  async update(id: string, userId: string, data: Prisma.TaskUpdateInput): Promise<Task> {
    await this.findOne(id, userId);

    const task = await this.prisma.task.update({
      where: { id },
      data,
    });

    if (data.status) {
      await this.notificationsService.create(userId, {
        title: 'Tarea Actualizada',
        message: `El estado de "${task.title}" cambió a ${task.status}.`,
        type: NotificationType.TASK,
      });
    }

    return task;
  }

  async remove(id: string, userId: string): Promise<Task> {
    await this.findOne(id, userId);

    return this.prisma.task.delete({
      where: { id },
    });
  }
}
