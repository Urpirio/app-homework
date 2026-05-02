import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CollaboratorsService } from '../collaborators/collaborators.service';

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

    const messages = await this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: collaboratorId },
          { senderId: collaboratorId, receiverId: userId },
        ],
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

  async sendMessage(senderId: string, receiverId: string, text: string, attachment?: {
    fileName: string;
    fileUrl: string;
    mimeType: string;
    fileSize?: number;
  }) {
    // Validar que son colaboradores activos
    const isActive = await this.collaboratorsService.isActiveCollaboration(senderId, receiverId);
    if (!isActive) {
      throw new ForbiddenException('No puedes enviar mensajes. La solicitud aún no ha sido aceptada.');
    }

    const message = await this.prisma.message.create({
      data: {
        text,
        senderId,
        receiverId,
        ...(attachment && {
          attachment: {
            create: {
              fileName: attachment.fileName,
              fileUrl: attachment.fileUrl,
              mimeType: attachment.mimeType,
              fileSize: attachment.fileSize,
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

  async clearChat(userId: string, collaboratorId: string) {
    return this.prisma.message.deleteMany({
      where: {
        OR: [
          { senderId: userId, receiverId: collaboratorId },
          { senderId: collaboratorId, receiverId: userId },
        ],
      },
    });
  }
}
