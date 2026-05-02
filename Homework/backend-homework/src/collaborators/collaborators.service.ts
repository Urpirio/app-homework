import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType, CollaboratorStatus } from '@prisma/client';

@Injectable()
export class CollaboratorsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async sendRequest(requesterId: string, identityCode: string) {
    // Buscar al usuario destinatario por código de identidad
    const addressee = await this.prisma.user.findUnique({
      where: { identityCode },
    });

    if (!addressee) {
      throw new NotFoundException('No se encontró un usuario con ese código de identidad');
    }

    if (addressee.id === requesterId) {
      throw new ConflictException('No puedes enviarte una solicitud a ti mismo');
    }

    // Verificar si ya existe una relación (en cualquier dirección)
    const existing = await this.prisma.collaborator.findFirst({
      where: {
        OR: [
          { requesterId, addresseeId: addressee.id },
          { requesterId: addressee.id, addresseeId: requesterId },
        ],
      },
    });

    if (existing) {
      if (existing.status === 'ACTIVE') {
        throw new ConflictException('Ya son colaboradores');
      }
      if (existing.status === 'PENDING') {
        throw new ConflictException('Ya existe una solicitud pendiente');
      }
    }

    // Crear la solicitud
    const collaboration = await this.prisma.collaborator.create({
      data: {
        requesterId,
        addresseeId: addressee.id,
      },
      include: {
        requester: { select: { id: true, fullName: true, email: true, role: true, avatarUrl: true, identityCode: true } },
        addressee: { select: { id: true, fullName: true, email: true, role: true, avatarUrl: true, identityCode: true } },
      },
    });

    // Enviar notificación al destinatario
    const requester = await this.prisma.user.findUnique({ where: { id: requesterId } });
    await this.notificationsService.create({
      title: 'Solicitud de colaboración',
      message: `${requester?.fullName} quiere agregarte como colaborador`,
      type: NotificationType.COLLABORATOR_REQUEST,
      userId: addressee.id,
    });

    return collaboration;
  }

  async getCollaborators(userId: string) {
    const collaborations = await this.prisma.collaborator.findMany({
      where: {
        OR: [
          { requesterId: userId },
          { addresseeId: userId },
        ],
      },
      include: {
        requester: { select: { id: true, fullName: true, email: true, role: true, avatarUrl: true, identityCode: true } },
        addressee: { select: { id: true, fullName: true, email: true, role: true, avatarUrl: true, identityCode: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Transformar para que siempre el "otro" usuario sea el colaborador
    return collaborations.map((c) => {
      const isRequester = c.requesterId === userId;
      return {
        id: c.id,
        status: c.status,
        collaborator: isRequester ? c.addressee : c.requester,
        isRequester,
        createdAt: c.createdAt,
      };
    });
  }

  async getPendingRequests(userId: string) {
    const requests = await this.prisma.collaborator.findMany({
      where: {
        addresseeId: userId,
        status: CollaboratorStatus.PENDING,
      },
      include: {
        requester: { select: { id: true, fullName: true, email: true, role: true, avatarUrl: true, identityCode: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return requests.map((r) => ({
      id: r.id,
      collaborator: r.requester,
      createdAt: r.createdAt,
    }));
  }

  async acceptRequest(collaborationId: string, userId: string) {
    const collaboration = await this.prisma.collaborator.findUnique({
      where: { id: collaborationId },
      include: { requester: true },
    });

    if (!collaboration) {
      throw new NotFoundException('Solicitud no encontrada');
    }

    if (collaboration.addresseeId !== userId) {
      throw new ForbiddenException('No tienes permiso para aceptar esta solicitud');
    }

    const updated = await this.prisma.collaborator.update({
      where: { id: collaborationId },
      data: { status: CollaboratorStatus.ACTIVE },
      include: {
        requester: { select: { id: true, fullName: true, email: true, role: true, avatarUrl: true } },
        addressee: { select: { id: true, fullName: true, email: true, role: true, avatarUrl: true } },
      },
    });

    // Notificar al solicitante
    const addressee = await this.prisma.user.findUnique({ where: { id: userId } });
    await this.notificationsService.create({
      title: 'Solicitud aceptada',
      message: `${addressee?.fullName} aceptó tu solicitud de colaboración`,
      type: NotificationType.COLLABORATOR_ACCEPTED,
      userId: collaboration.requesterId,
    });

    return updated;
  }

  async rejectRequest(collaborationId: string, userId: string) {
    const collaboration = await this.prisma.collaborator.findUnique({
      where: { id: collaborationId },
    });

    if (!collaboration) {
      throw new NotFoundException('Solicitud no encontrada');
    }

    if (collaboration.addresseeId !== userId) {
      throw new ForbiddenException('No tienes permiso para rechazar esta solicitud');
    }

    return this.prisma.collaborator.update({
      where: { id: collaborationId },
      data: { status: CollaboratorStatus.REJECTED },
    });
  }

  async getCommonProjects(userId: string, collaboratorId: string) {
    // Proyectos donde userId es dueño y collaboratorId es miembro
    const userProjects = await this.prisma.project.findMany({
      where: {
        userId,
        members: { some: { userId: collaboratorId } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Proyectos donde collaboratorId es dueño y userId es miembro
    const collabProjects = await this.prisma.project.findMany({
      where: {
        userId: collaboratorId,
        members: { some: { userId } },
      },
      include: { user: { select: { fullName: true } } },
      orderBy: { updatedAt: 'desc' },
    });

    return { userProjects, collabProjects };
  }

  async getCollaboratorProfile(collaboratorId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: collaboratorId },
      select: {
        id: true,
        fullName: true,
        email: true,
        avatarUrl: true,
        role: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Colaborador no encontrado');
    }

    const [ownedProjects, memberProjects, ownedTasks, memberTasks] = await Promise.all([
      this.prisma.project.count({ where: { userId: collaboratorId } }),
      this.prisma.project.count({ where: { members: { some: { userId: collaboratorId } } } }),
      this.prisma.task.count({ where: { project: { userId: collaboratorId } } }),
      this.prisma.task.count({ where: { project: { members: { some: { userId: collaboratorId } } } } }),
    ]);

    return {
      ...user,
      stats: {
        projects: ownedProjects + memberProjects,
        tasks: ownedTasks + memberTasks,
      },
    };
  }

  async findByIdentityCode(identityCode: string) {
    const user = await this.prisma.user.findUnique({
      where: { identityCode },
      select: { id: true, fullName: true, email: true, role: true, avatarUrl: true, identityCode: true },
    });

    if (!user) {
      throw new NotFoundException('No se encontró un usuario con ese código');
    }

    return user;
  }

  async isActiveCollaboration(userId1: string, userId2: string): Promise<boolean> {
    const collab = await this.prisma.collaborator.findFirst({
      where: {
        OR: [
          { requesterId: userId1, addresseeId: userId2 },
          { requesterId: userId2, addresseeId: userId1 },
        ],
        status: CollaboratorStatus.ACTIVE,
      },
    });
    return !!collab;
  }
}
