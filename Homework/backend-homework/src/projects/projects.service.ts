import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Project, NotificationType } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ProjectsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async create(userId: string, data: Omit<Prisma.ProjectCreateInput, 'user'>): Promise<Project> {
    const project = await this.prisma.project.create({
      data: {
        ...data,
        user: { connect: { id: userId } },
      },
    });

    await this.notificationsService.create(userId, {
      title: 'Nuevo Proyecto',
      message: `Has creado el proyecto "${project.name}".`,
      type: NotificationType.PROJECT,
    });

    return project;
  }

  async findAllForUser(userId: string): Promise<Project[]> {
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

  async findOne(id: string, userId: string): Promise<Project> {
    const project = await this.prisma.project.findFirst({
      where: { id, userId },
      include: {
        tasks: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    return project;
  }

  async update(id: string, userId: string, data: Prisma.ProjectUpdateInput): Promise<Project> {
    // Verify existence and ownership
    await this.findOne(id, userId);

    return this.prisma.project.update({
      where: { id },
      data,
    });
  }

  async remove(id: string, userId: string): Promise<Project> {
    // Verify existence and ownership
    await this.findOne(id, userId);

    return this.prisma.project.delete({
      where: { id },
    });
  }
}
