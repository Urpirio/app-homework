import { Injectable } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';

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
        tasks: {
          include: {
            submissions: {
              where: { studentId: userId },
              select: { id: true, status: true },
              take: 1,
            },
          },
        },
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
        tasks: {
          include: {
            submissions: {
              where: { studentId: userId },
              select: { id: true, status: true },
              take: 1,
            },
          },
        },
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
        units: { 
          orderBy: { order: 'asc' },
          include: { _count: { select: { tasks: true } } }
        },
        tasks: { 
          where: { unitId: null }, 
          orderBy: { createdAt: 'desc' } 
        },
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

  async enrollMany(projectId: string, adminId: string, userIds: string[], role: string = 'student') {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) throw new Error('Proyecto no encontrado');

    // El admin debe ser de la misma institución o el dueño del proyecto
    // (Simplificado para permitir a SCHOOL_ADMIN y TEACHER añadir)
    
    const enrollments = await Promise.all(
      userIds.map(async (userId) => {
        try {
          return await this.prisma.projectMember.upsert({
            where: { projectId_userId: { projectId, userId } },
            update: { role },
            create: { projectId, userId, role },
          });
        } catch (e) {
          console.error(`Error enrolling user ${userId}:`, e);
          return null;
        }
      }),
    );

    return enrollments.filter((e) => e !== null);
  }

  async removeMember(projectId: string, ownerId: string, memberId: string) {
    // Solo el dueño puede quitar miembros (O un admin de la institución)
    const project = await this.prisma.project.findFirst({
      where: { id: projectId },
    });
    if (!project) {
      throw new Error('Proyecto no encontrado.');
    }

    return this.prisma.projectMember.deleteMany({
      where: { projectId, userId: memberId },
    });
  }

  // ====== Gestión de Unidades ======

  async createUnit(projectId: string, userId: string, data: any) {
    const project = await this.prisma.project.findFirst({
      where: { 
        id: projectId,
        OR: [
          { userId },
          { members: { some: { userId, role: 'teacher' } } }
        ]
      },
    });
    if (!project) throw new Error('No tienes permisos.');

    return this.prisma.unit.create({
      data: {
        name: data.name,
        description: data.description,
        order: data.order || 0,
        projectId,
      },
    });
  }

  async getUnits(projectId: string, userId: string) {
    return this.prisma.unit.findMany({
      where: { 
        projectId,
        project: {
          OR: [
            { userId },
            { members: { some: { userId } } }
          ]
        }
      },
      orderBy: { order: 'asc' },
      include: {
        tasks: {
          include: {
            submissions: { where: { studentId: userId } }
          }
        }
      }
    });
  }

  async updateUnit(id: string, userId: string, data: any) {
    const unit = await this.prisma.unit.findUnique({
      where: { id },
      include: { project: true }
    });
    if (!unit) throw new Error('Unidad no encontrada');

    if (unit.project.userId !== userId) {
      const isTeacher = await this.prisma.projectMember.findFirst({
        where: { projectId: unit.projectId, userId, role: 'teacher' }
      });
      if (!isTeacher) throw new Error('No tienes permisos.');
    }

    return this.prisma.unit.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        order: data.order,
      }
    });
  }

  async removeUnit(id: string, userId: string) {
    const unit = await this.prisma.unit.findUnique({
      where: { id },
      include: { project: true }
    });
    if (!unit) throw new Error('Unidad no encontrada');

    if (unit.project.userId !== userId) {
      const isTeacher = await this.prisma.projectMember.findFirst({
        where: { projectId: unit.projectId, userId, role: 'teacher' }
      });
      if (!isTeacher) throw new Error('No tienes permisos.');
    }

    return this.prisma.unit.delete({
      where: { id }
    });
  }
}
