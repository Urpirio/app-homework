import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CollaboratorsService } from '../collaborators/collaborators.service';
import { PrismaService } from '../prisma/prisma.service';
import { MessagesService } from './messages.service';

describe('MessagesService - clearChatHistory', () => {
  let service: MessagesService;
  let prisma: {
    messageDeletion: { upsert: jest.Mock };
    projectMember: { findFirst: jest.Mock };
    project: { findFirst: jest.Mock };
  };
  let collaboratorsService: { isActiveCollaboration: jest.Mock };

  beforeEach(async () => {
    prisma = {
      messageDeletion: {
        upsert: jest.fn(),
      },
      projectMember: {
        findFirst: jest.fn(),
      },
      project: {
        findFirst: jest.fn(),
      },
    };

    collaboratorsService = {
      isActiveCollaboration: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesService,
        { provide: PrismaService, useValue: prisma },
        { provide: CollaboratorsService, useValue: collaboratorsService },
      ],
    }).compile();

    service = module.get<MessagesService>(MessagesService);
  });

  describe('user chat soft-delete', () => {
    it('should throw ForbiddenException when users are not active collaborators', async () => {
      collaboratorsService.isActiveCollaboration.mockResolvedValue(false);

      await expect(
        service.clearChatHistory('user-1', 'user-2', 'user'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should upsert a MessageDeletion record for user chat', async () => {
      collaboratorsService.isActiveCollaboration.mockResolvedValue(true);
      prisma.messageDeletion.upsert.mockResolvedValue({});

      const result = await service.clearChatHistory('user-1', 'user-2', 'user');

      expect(result).toEqual({ message: 'Historial de chat eliminado exitosamente' });
      expect(prisma.messageDeletion.upsert).toHaveBeenCalledWith({
        where: {
          userId_conversationId_conversationType: {
            userId: 'user-1',
            conversationId: 'user-2',
            conversationType: 'user',
          },
        },
        update: { deletedAt: expect.any(Date) },
        create: {
          userId: 'user-1',
          conversationId: 'user-2',
          conversationType: 'user',
          deletedAt: expect.any(Date),
        },
      });
    });

    it('should scope deletion to the requesting user only', async () => {
      collaboratorsService.isActiveCollaboration.mockResolvedValue(true);
      prisma.messageDeletion.upsert.mockResolvedValue({});

      await service.clearChatHistory('user-A', 'user-B', 'user');

      // Verify the deletion is scoped to user-A, not user-B
      const upsertCall = prisma.messageDeletion.upsert.mock.calls[0][0];
      expect(upsertCall.where.userId_conversationId_conversationType.userId).toBe('user-A');
      expect(upsertCall.create.userId).toBe('user-A');
    });
  });

  describe('project chat soft-delete', () => {
    it('should throw ForbiddenException when user is not a project member or owner', async () => {
      prisma.projectMember.findFirst.mockResolvedValue(null);
      prisma.project.findFirst.mockResolvedValue(null);

      await expect(
        service.clearChatHistory('user-1', 'project-1', 'project'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow project member to clear chat history', async () => {
      prisma.projectMember.findFirst.mockResolvedValue({ userId: 'user-1', projectId: 'project-1' });
      prisma.project.findFirst.mockResolvedValue(null);
      prisma.messageDeletion.upsert.mockResolvedValue({});

      const result = await service.clearChatHistory('user-1', 'project-1', 'project');

      expect(result).toEqual({ message: 'Historial de chat eliminado exitosamente' });
      expect(prisma.messageDeletion.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId_conversationId_conversationType: {
              userId: 'user-1',
              conversationId: 'project-1',
              conversationType: 'project',
            },
          },
        }),
      );
    });

    it('should allow project owner to clear chat history', async () => {
      prisma.projectMember.findFirst.mockResolvedValue(null);
      prisma.project.findFirst.mockResolvedValue({ id: 'project-1', userId: 'user-1' });
      prisma.messageDeletion.upsert.mockResolvedValue({});

      const result = await service.clearChatHistory('user-1', 'project-1', 'project');

      expect(result).toEqual({ message: 'Historial de chat eliminado exitosamente' });
    });
  });

  describe('user isolation', () => {
    it('should not affect other users chat history when one user clears', async () => {
      collaboratorsService.isActiveCollaboration.mockResolvedValue(true);
      prisma.messageDeletion.upsert.mockResolvedValue({});

      // User A clears their history with User B
      await service.clearChatHistory('user-A', 'user-B', 'user');

      // The upsert should only reference user-A
      const call = prisma.messageDeletion.upsert.mock.calls[0][0];
      expect(call.create.userId).toBe('user-A');
      expect(call.create.conversationId).toBe('user-B');

      // Verify no operations were done for user-B
      expect(prisma.messageDeletion.upsert).toHaveBeenCalledTimes(1);
    });
  });
});
