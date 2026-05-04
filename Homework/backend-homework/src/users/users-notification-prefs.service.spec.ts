import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from './users.service';

describe('UsersService - Notification Preferences', () => {
  let service: UsersService;
  let prisma: {
    user: { findUnique: jest.Mock; update: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('getNotificationPreferences', () => {
    it('should throw NotFoundException when user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getNotificationPreferences('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return default preferences when user has no stored preferences', async () => {
      prisma.user.findUnique.mockResolvedValue({
        notificationPreferences: null,
      });

      const result = await service.getNotificationPreferences('user-1');

      expect(result).toEqual({
        assignments: true,
        grades: true,
        messages: true,
        system: true,
        deadlines: true,
        emailNotifications: false,
      });
    });

    it('should return stored preferences when they exist', async () => {
      prisma.user.findUnique.mockResolvedValue({
        notificationPreferences: {
          assignments: false,
          grades: true,
          messages: false,
          system: true,
          deadlines: false,
          emailNotifications: true,
        },
      });

      const result = await service.getNotificationPreferences('user-1');

      expect(result).toEqual({
        assignments: false,
        grades: true,
        messages: false,
        system: true,
        deadlines: false,
        emailNotifications: true,
      });
    });

    it('should fill in defaults for missing fields in stored preferences', async () => {
      prisma.user.findUnique.mockResolvedValue({
        notificationPreferences: {
          assignments: false,
          // other fields missing
        },
      });

      const result = await service.getNotificationPreferences('user-1');

      expect(result.assignments).toBe(false);
      // Missing fields should get defaults
      expect(result.grades).toBe(true);
      expect(result.messages).toBe(true);
      expect(result.system).toBe(true);
      expect(result.deadlines).toBe(true);
      expect(result.emailNotifications).toBe(false);
    });
  });

  describe('updateNotificationPreferences', () => {
    it('should throw NotFoundException when user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.updateNotificationPreferences('nonexistent', {
          assignments: true,
          grades: true,
          messages: true,
          system: true,
          deadlines: true,
          emailNotifications: false,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should store preferences and return them', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'user-1' });
      prisma.user.update.mockResolvedValue({});

      const prefs = {
        assignments: false,
        grades: true,
        messages: false,
        system: true,
        deadlines: true,
        emailNotifications: true,
      };

      const result = await service.updateNotificationPreferences('user-1', prefs);

      expect(result).toEqual(prefs);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { notificationPreferences: prefs },
      });
    });

    it('should coerce values to booleans', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'user-1' });
      prisma.user.update.mockResolvedValue({});

      const result = await service.updateNotificationPreferences('user-1', {
        assignments: true,
        grades: false,
        messages: true,
        system: false,
        deadlines: true,
        emailNotifications: false,
      });

      // All values should be booleans
      expect(typeof result.assignments).toBe('boolean');
      expect(typeof result.grades).toBe('boolean');
      expect(typeof result.messages).toBe('boolean');
      expect(typeof result.system).toBe('boolean');
      expect(typeof result.deadlines).toBe('boolean');
      expect(typeof result.emailNotifications).toBe('boolean');
    });

    it('should round-trip preferences (update then get returns same values)', async () => {
      const prefs = {
        assignments: false,
        grades: false,
        messages: true,
        system: false,
        deadlines: true,
        emailNotifications: true,
      };

      prisma.user.findUnique.mockResolvedValue({ id: 'user-1' });
      prisma.user.update.mockResolvedValue({});

      const updateResult = await service.updateNotificationPreferences('user-1', prefs);

      // Now simulate get returning what was stored
      prisma.user.findUnique.mockResolvedValue({
        notificationPreferences: updateResult,
      });

      const getResult = await service.getNotificationPreferences('user-1');

      expect(getResult).toEqual(updateResult);
    });
  });
});
