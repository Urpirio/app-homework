import { ForbiddenException, Injectable } from '@nestjs/common';
import { CollaboratorsService } from '../collaborators/collaborators.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MessagesService {
  constructor(
    private prisma: PrismaService,
    private collaboratorsService: CollaboratorsService,
  ) {}

  async getMessages(userId: string, collaboratorId: string, page = 1, limit = 50) {
      // Validar que son colaboradores activos
      const isActive = await this.collaboratorsService.isActiveCollaboration(userId, collaboratorId);
      if (!isActive) {
        throw new ForbiddenException('No puedes chatear con este usuario. La solicitud aún no ha sido aceptada.');
      }

      const skip = (page - 1) * limit;

      // Check if user has soft-deleted this conversation
      const deletion = await this.prisma.messageDeletion.findUnique({
        where: {
          userId_conversationId_conversationType: {
            userId,
            conversationId: collaboratorId,
            conversationType: 'user',
          },
        },
      });

      const messages = await this.prisma.message.findMany({
        where: {
          OR: [
            { senderId: userId, receiverId: collaboratorId },
            { senderId: collaboratorId, receiverId: userId },
          ],
          ...(deletion && { createdAt: { gt: deletion.deletedAt } }),
        },
        include: {
          attachment: true,
          sender: { select: { id: true, fullName: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      });

      return messages.reverse();
    }

  async getProjectMessages(userId: string, projectId: string, page = 1, limit = 50) {
    // Verificar que el usuario es miembro del proyecto
    const isMember = await this.prisma.projectMember.findFirst({
      where: { projectId, userId },
    });
    const isOwner = await this.prisma.project.findFirst({
      where: { id: projectId, userId },
    });

    if (!isMember && !isOwner) {
      throw new ForbiddenException('No tienes acceso a este chat grupal.');
    }

    const skip = (page - 1) * limit;

    // Check if user has soft-deleted this conversation
    const deletion = await this.prisma.messageDeletion.findUnique({
      where: {
        userId_conversationId_conversationType: {
          userId,
          conversationId: projectId,
          conversationType: 'project',
        },
      },
    });

    const messages = await this.prisma.message.findMany({
      where: {
        projectId,
        ...(deletion && { createdAt: { gt: deletion.deletedAt } }),
      },
      include: {
        attachment: true,
        sender: { select: { id: true, fullName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    return messages.reverse();
  }

  async sendMessage(senderId: string, text: string, options: { 
    receiverId?: string; 
    projectId?: string;
    attachment?: {
      fileName: string;
      fileUrl: string;
      mimeType: string;
      fileSize?: number;
    }
  }) {
    if (options.receiverId) {
      const isActive = await this.collaboratorsService.isActiveCollaboration(senderId, options.receiverId);
      if (!isActive) {
        throw new ForbiddenException('No puedes enviar mensajes. La solicitud aún no ha sido aceptada.');
      }
    }

    if (options.projectId) {
      const isMember = await this.prisma.projectMember.findFirst({
        where: { projectId: options.projectId, userId: senderId },
      });
      const isOwner = await this.prisma.project.findFirst({
        where: { id: options.projectId, userId: senderId },
      });
      if (!isMember && !isOwner) {
        throw new ForbiddenException('No perteneces a este proyecto.');
      }
    }

    const message = await this.prisma.message.create({
      data: {
        text,
        senderId,
        receiverId: options.receiverId,
        projectId: options.projectId,
        ...(options.attachment && {
          attachment: {
            create: {
              fileName: options.attachment.fileName,
              fileUrl: options.attachment.fileUrl,
              mimeType: options.attachment.mimeType,
              fileSize: options.attachment.fileSize,
            },
          },
        }),
      },
      include: {
        attachment: true,
        sender: { select: { id: true, fullName: true, avatarUrl: true } },
      },
    });

    return message;
  }

  async getSharedFiles(userId: string, collaboratorId: string, type?: 'image' | 'document') {
    const isActive = await this.collaboratorsService.isActiveCollaboration(userId, collaboratorId);
    if (!isActive) {
      throw new ForbiddenException('No son colaboradores activos');
    }

    const mimeFilter = type === 'image'
      ? { startsWith: 'image/' }
      : type === 'document'
        ? { not: { startsWith: 'image/' } }
        : undefined;

    const attachments = await this.prisma.attachment.findMany({
      where: {
        message: {
          OR: [
            { senderId: userId, receiverId: collaboratorId },
            { senderId: collaboratorId, receiverId: userId },
          ],
        },
        ...(mimeFilter && { mimeType: mimeFilter }),
      },
      orderBy: { createdAt: 'desc' },
    });

    return attachments;
  }

  async clearChatHistory(userId: string, conversationId: string, type: 'user' | 'project') {
    // Validate access to the conversation
    if (type === 'user') {
      const isActive = await this.collaboratorsService.isActiveCollaboration(userId, conversationId);
      if (!isActive) {
        throw new ForbiddenException('No puedes gestionar este chat. La solicitud aún no ha sido aceptada.');
      }
    } else {
      const isMember = await this.prisma.projectMember.findFirst({
        where: { projectId: conversationId, userId },
      });
      const isOwner = await this.prisma.project.findFirst({
        where: { id: conversationId, userId },
      });
      if (!isMember && !isOwner) {
        throw new ForbiddenException('No tienes acceso a este chat grupal.');
      }
    }

    // Upsert a MessageDeletion record — sets deletedAt to now
    await this.prisma.messageDeletion.upsert({
      where: {
        userId_conversationId_conversationType: {
          userId,
          conversationId,
          conversationType: type,
        },
      },
      update: {
        deletedAt: new Date(),
      },
      create: {
        userId,
        conversationId,
        conversationType: type,
        deletedAt: new Date(),
      },
    });

    return { message: 'Historial de chat eliminado exitosamente' };
  }
}
