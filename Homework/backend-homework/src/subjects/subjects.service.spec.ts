import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { SubjectsService } from './subjects.service';

describe('SubjectsService', () => {
  let service: SubjectsService;
  let prisma: {
    project: {
      findUnique: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    projectMember: {
      deleteMany: jest.Mock;
      create: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      project: {
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      projectMember: {
        deleteMany: jest.fn(),
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubjectsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<SubjectsService>(SubjectsService);
  });

  describe('update', () => {
    const subjectId = 'subject-1';
    const existingProject = {
      id: subjectId,
      name: 'Matemáticas',
      userId: 'teacher-1',
      members: [{ userId: 'teacher-2', role: 'teacher' }],
    };

    it('should throw NotFoundException when subject does not exist', async () => {
      prisma.project.findUnique.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', { userId: 'admin-1', role: 'SCHOOL_ADMIN' }, { name: 'New' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should allow SCHOOL_ADMIN to update any subject', async () => {
      prisma.project.findUnique.mockResolvedValue(existingProject);
      prisma.project.update.mockResolvedValue({
        ...existingProject,
        name: 'Ciencias',
        members: [],
        _count: { tasks: 5, members: 1 },
      });

      const result = await service.update(
        subjectId,
        { userId: 'admin-1', role: 'SCHOOL_ADMIN' },
        { name: 'Ciencias' },
      );

      expect(result.name).toBe('Ciencias');
    });

    it('should allow TEACHER who owns the subject to update', async () => {
      prisma.project.findUnique.mockResolvedValue(existingProject);
      prisma.project.update.mockResolvedValue({
        ...existingProject,
        description: 'Updated desc',
        members: [],
        _count: { tasks: 5, members: 1 },
      });

      const result = await service.update(
        subjectId,
        { userId: 'teacher-1', role: 'TEACHER' },
        { description: 'Updated desc' },
      );

      expect(result.description).toBe('Updated desc');
    });

    it('should allow TEACHER who is a member to update', async () => {
      prisma.project.findUnique.mockResolvedValue(existingProject);
      prisma.project.update.mockResolvedValue({
        ...existingProject,
        color: '#FF0000',
        members: [],
        _count: { tasks: 5, members: 1 },
      });

      await service.update(
        subjectId,
        { userId: 'teacher-2', role: 'TEACHER' },
        { color: '#FF0000' },
      );

      expect(prisma.project.update).toHaveBeenCalled();
    });

    it('should throw ForbiddenException when TEACHER is not owner or member', async () => {
      prisma.project.findUnique.mockResolvedValue(existingProject);

      await expect(
        service.update(
          subjectId,
          { userId: 'teacher-999', role: 'TEACHER' },
          { name: 'Hack' },
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should update teacher assignments when teacherIds provided', async () => {
      prisma.project.findUnique
        .mockResolvedValueOnce(existingProject) // initial lookup
        .mockResolvedValueOnce({ // re-fetch after member update
          ...existingProject,
          members: [{ userId: 'teacher-3', role: 'teacher', user: { id: 'teacher-3', fullName: 'New Teacher', role: 'TEACHER' } }],
          _count: { tasks: 5, members: 1 },
        });
      prisma.project.update.mockResolvedValue(existingProject);
      prisma.projectMember.deleteMany.mockResolvedValue({ count: 1 });
      prisma.projectMember.create.mockResolvedValue({});

      const result = await service.update(
        subjectId,
        { userId: 'admin-1', role: 'SCHOOL_ADMIN' },
        { teacherIds: ['teacher-3'] },
      );

      expect(prisma.projectMember.deleteMany).toHaveBeenCalledWith({
        where: { projectId: subjectId, role: 'teacher' },
      });
      expect(prisma.projectMember.create).toHaveBeenCalledWith({
        data: { projectId: subjectId, userId: 'teacher-3', role: 'teacher' },
      });
      expect(result.members).toHaveLength(1);
    });
  });

  describe('remove', () => {
    it('should throw NotFoundException when subject does not exist', async () => {
      prisma.project.findUnique.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should delete subject with cascade and return success message', async () => {
      prisma.project.findUnique.mockResolvedValue({
        id: 'subject-1',
        name: 'Matemáticas',
        _count: { tasks: 10, units: 3, members: 5 },
      });
      prisma.project.delete.mockResolvedValue({});

      const result = await service.remove('subject-1');

      expect(result).toEqual({ message: 'Materia eliminada exitosamente' });
      expect(prisma.project.delete).toHaveBeenCalledWith({
        where: { id: 'subject-1' },
      });
    });

    it('should delete subject even when it has no tasks or members', async () => {
      prisma.project.findUnique.mockResolvedValue({
        id: 'subject-2',
        name: 'Empty Subject',
        _count: { tasks: 0, units: 0, members: 0 },
      });
      prisma.project.delete.mockResolvedValue({});

      const result = await service.remove('subject-2');

      expect(result).toEqual({ message: 'Materia eliminada exitosamente' });
    });
  });
});
