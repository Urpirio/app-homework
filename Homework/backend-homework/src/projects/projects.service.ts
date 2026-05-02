import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType, Role } from '@prisma/client';

@Injectable()
export class ProjectsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async create(user: any, data: any) {
    const project = await this.prisma.project.create({
      data: {
        name: data.name,
        description: data.description,
        color: data.color,
        user: { connect: { id: user.userId } },
        institution: user.institutionId ? { connect: { id: user.institutionId } } : undefined,
      },
    });

    await this.notificationsService.create({
      title: 'Nuevo Proyecto',
      message: `Has creado el proyecto "${project.name}"`,
      type: NotificationType.PROJECT,
      userId: user.userId,
    });

    return project;
  }

  async findAllForUser(userId: string) {
    // Proyectos propios
    const ownedProjects = await this.prisma.project.findMany({
      where: { userId },
      include: {
        _count: { select: { tasks: true } },
        members: { include: { user: { select: { id: true, fullName: true, avatarUrl: true } } } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Proyectos donde es miembro
    const memberProjects = await this.prisma.project.findMany({
      where: {
        members: { some: { userId } },
        NOT: { userId }, // Excluir los propios
      },
      include: {
        _count: { select: { tasks: true } },
        members: { include: { user: { select: { id: true, fullName: true, avatarUrl: true } } } },
        user: { select: { id: true, fullName: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return [...ownedProjects, ...memberProjects];
  }

  async findOne(id: string, userId: string) {
    return this.prisma.project.findFirst({
      where: {
        id,
        OR: [
          { userId },
          { members: { some: { userId } } },
        ],
      },
      include: {
        tasks: { orderBy: { createdAt: 'desc' } },
        members: {
          include: {
            user: {
              select: { id: true, fullName: true, avatarUrl: true, email: true },
            },
          },
        },
      },
    });
  }

  async update(id: string, userId: string, data: any) {
    return this.prisma.project.update({
      where: { id, userId },
      data: {
        name: data.name,
        description: data.description,
        color: data.color,
      },
    });
  }

  async remove(id: string, userId: string) {
    return this.prisma.project.delete({
      where: { id, userId },
    });
  }

  // ====== Gestión de Miembros ======

  async addMember(projectId: string, ownerId: string, memberId: string) {
    // Verificar que el proyecto pertenece al usuario que lo solicita
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, userId: ownerId },
    });
    if (!project) {
      throw new Error('Proyecto no encontrado o no tienes permisos.');
    }

    // Si es un proyecto institucional, permitir añadir a cualquier miembro de la misma institución
    if (project.institutionId) {
      const targetUser = await this.prisma.user.findFirst({
        where: { id: memberId, institutionId: project.institutionId }
      });
      if (!targetUser) {
        throw new Error('El usuario no pertenece a esta institución.');
      }
    } else {
      // Si no es institucional, verificar colaboradores (lógica actual)
      const collaboration = await this.prisma.collaborator.findFirst({
        where: {
          status: 'ACTIVE',
          OR: [
            { requesterId: ownerId, addresseeId: memberId },
            { requesterId: memberId, addresseeId: ownerId },
          ],
        },
      });
      if (!collaboration) {
        throw new Error('Este usuario no es un colaborador activo.');
      }
    }

    // Crear la membresía
    const member = await this.prisma.projectMember.create({
      data: {
        projectId,
        userId: memberId,
        role: 'member',
      },
      include: {
        user: { select: { id: true, fullName: true, avatarUrl: true } },
      },
    });

    // Notificar al miembro
    await this.notificationsService.create({
      title: 'Añadido a Proyecto',
      message: `Te han añadido al proyecto "${project.name}"`,
      type: NotificationType.PROJECT,
      userId: memberId,
    });

    return member;
  }

  async getMembers(projectId: string, userId: string) {
    // Verificar acceso (dueño o miembro)
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { userId },
          { members: { some: { userId } } },
        ],
      },
    });
    if (!project) {
      throw new Error('Proyecto no encontrado.');
    }

    return this.prisma.projectMember.findMany({
      where: { projectId },
      include: {
        user: { select: { id: true, fullName: true, avatarUrl: true, email: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async removeMember(projectId: string, ownerId: string, memberId: string) {
    // Solo el dueño puede quitar miembros
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, userId: ownerId },
    });
    if (!project) {
      throw new Error('Proyecto no encontrado o no tienes permisos.');
    }

    return this.prisma.projectMember.deleteMany({
      where: { projectId, userId: memberId },
    });
  }
}
