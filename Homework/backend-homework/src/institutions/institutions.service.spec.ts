import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { InstitutionsService } from './institutions.service';

describe('InstitutionsService', () => {
  let service: InstitutionsService;
  let prisma: {
    institution: {
      findUnique: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    user: {
      findUnique: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
      count: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      institution: {
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        count: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InstitutionsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<InstitutionsService>(InstitutionsService);
  });

  describe('update', () => {
    it('should throw NotFoundException when institution does not exist', async () => {
      prisma.institution.findUnique.mockResolvedValue(null);

      await expect(service.update('nonexistent', { name: 'New Name' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should update institution and return with counts', async () => {
      prisma.institution.findUnique.mockResolvedValue({ id: 'inst-1', name: 'Old Name' });
      prisma.institution.update.mockResolvedValue({
        id: 'inst-1',
        name: 'Updated Name',
        address: '123 Main St',
        _count: { users: 10, projects: 5 },
      });

      const result = await service.update('inst-1', { name: 'Updated Name', address: '123 Main St' });

      expect(result.name).toBe('Updated Name');
      expect(result._count.users).toBe(10);
      expect(prisma.institution.update).toHaveBeenCalledWith({
        where: { id: 'inst-1' },
        data: { name: 'Updated Name', address: '123 Main St' },
        include: { _count: { select: { users: true, projects: true } } },
      });
    });

    it('should allow partial updates', async () => {
      prisma.institution.findUnique.mockResolvedValue({ id: 'inst-1', name: 'Old Name' });
      prisma.institution.update.mockResolvedValue({
        id: 'inst-1',
        name: 'Old Name',
        logoUrl: 'new-logo.png',
        _count: { users: 0, projects: 0 },
      });

      await service.update('inst-1', { logoUrl: 'new-logo.png' });

      expect(prisma.institution.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { logoUrl: 'new-logo.png' },
        }),
      );
    });
  });

  describe('softDelete', () => {
    it('should throw NotFoundException when institution does not exist', async () => {
      prisma.institution.findUnique.mockResolvedValue(null);

      await expect(service.softDelete('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should deactivate all users and delete institution', async () => {
      prisma.institution.findUnique.mockResolvedValue({
        id: 'inst-1',
        name: 'Test Institution',
        _count: { users: 5, classrooms: 2, projects: 3 },
      });
      prisma.user.updateMany.mockResolvedValue({ count: 5 });
      prisma.institution.delete.mockResolvedValue({});

      const result = await service.softDelete('inst-1');

      expect(result).toEqual({ message: 'Institución eliminada exitosamente' });
      expect(prisma.user.updateMany).toHaveBeenCalledWith({
        where: { institutionId: 'inst-1' },
        data: { isVerified: false },
      });
      expect(prisma.institution.delete).toHaveBeenCalledWith({
        where: { id: 'inst-1' },
      });
    });
  });

  describe('assignAdmin', () => {
    const institutionId = 'inst-1';

    it('should throw NotFoundException when institution does not exist', async () => {
      prisma.institution.findUnique.mockResolvedValue(null);

      await expect(service.assignAdmin('nonexistent', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when user does not exist', async () => {
      prisma.institution.findUnique.mockResolvedValue({ id: institutionId });
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.assignAdmin(institutionId, 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when user does not belong to institution', async () => {
      prisma.institution.findUnique.mockResolvedValue({ id: institutionId });
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        role: 'TEACHER',
        institutionId: 'other-inst',
      });

      await expect(service.assignAdmin(institutionId, 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when user is SUPER_ADMIN', async () => {
      prisma.institution.findUnique.mockResolvedValue({ id: institutionId });
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        role: 'SUPER_ADMIN',
        institutionId,
      });

      await expect(service.assignAdmin(institutionId, 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when user is already SCHOOL_ADMIN', async () => {
      prisma.institution.findUnique.mockResolvedValue({ id: institutionId });
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        role: 'SCHOOL_ADMIN',
        institutionId,
      });

      await expect(service.assignAdmin(institutionId, 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should promote user to SCHOOL_ADMIN', async () => {
      prisma.institution.findUnique.mockResolvedValue({ id: institutionId });
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        role: 'TEACHER',
        institutionId,
      });
      prisma.user.update.mockResolvedValue({
        id: 'user-1',
        fullName: 'Test User',
        email: 'test@test.com',
        role: 'SCHOOL_ADMIN',
      });

      const result = await service.assignAdmin(institutionId, 'user-1');

      expect(result.role).toBe('SCHOOL_ADMIN');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { role: 'SCHOOL_ADMIN' },
        select: { id: true, fullName: true, email: true, role: true },
      });
    });
  });

  describe('removeAdmin', () => {
    const institutionId = 'inst-1';

    it('should throw NotFoundException when institution does not exist', async () => {
      prisma.institution.findUnique.mockResolvedValue(null);

      await expect(service.removeAdmin('nonexistent', 'admin-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when admin does not exist', async () => {
      prisma.institution.findUnique.mockResolvedValue({ id: institutionId });
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.removeAdmin(institutionId, 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when admin does not belong to institution', async () => {
      prisma.institution.findUnique.mockResolvedValue({ id: institutionId });
      prisma.user.findUnique.mockResolvedValue({
        id: 'admin-1',
        role: 'SCHOOL_ADMIN',
        institutionId: 'other-inst',
      });

      await expect(service.removeAdmin(institutionId, 'admin-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when user is not SCHOOL_ADMIN', async () => {
      prisma.institution.findUnique.mockResolvedValue({ id: institutionId });
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        role: 'TEACHER',
        institutionId,
      });

      await expect(service.removeAdmin(institutionId, 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when removing the last admin', async () => {
      prisma.institution.findUnique.mockResolvedValue({ id: institutionId });
      prisma.user.findUnique.mockResolvedValue({
        id: 'admin-1',
        role: 'SCHOOL_ADMIN',
        institutionId,
      });
      prisma.user.count.mockResolvedValue(1);

      await expect(service.removeAdmin(institutionId, 'admin-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should demote admin to TEACHER when multiple admins exist', async () => {
      prisma.institution.findUnique.mockResolvedValue({ id: institutionId });
      prisma.user.findUnique.mockResolvedValue({
        id: 'admin-1',
        role: 'SCHOOL_ADMIN',
        institutionId,
      });
      prisma.user.count.mockResolvedValue(2);
      prisma.user.update.mockResolvedValue({
        id: 'admin-1',
        fullName: 'Admin User',
        email: 'admin@test.com',
        role: 'TEACHER',
      });

      const result = await service.removeAdmin(institutionId, 'admin-1');

      expect(result.role).toBe('TEACHER');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'admin-1' },
        data: { role: 'TEACHER' },
        select: { id: true, fullName: true, email: true, role: true },
      });
    });
  });
});
