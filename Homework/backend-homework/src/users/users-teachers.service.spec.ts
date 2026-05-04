import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from './users.service';

describe('UsersService - Teacher Endpoints', () => {
  let service: UsersService;
  let prisma: {
    user: { findUnique: jest.Mock; findMany: jest.Mock; count: jest.Mock };
    project: { findMany: jest.Mock; count: jest.Mock };
    projectMember: { findMany: jest.Mock };
    submission: { aggregate: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      project: {
        findMany: jest.fn(),
        count: jest.fn(),
      },
      projectMember: {
        findMany: jest.fn(),
      },
      submission: {
        aggregate: jest.fn(),
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

  describe('getTeacherStudents', () => {
    const teacherId = 'teacher-1';
    const teacher = { id: teacherId, role: 'TEACHER', fullName: 'Prof. García' };

    it('should throw NotFoundException when teacher does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getTeacherStudents('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return empty data when teacher has no classroom subjects', async () => {
      prisma.user.findUnique.mockResolvedValue(teacher);
      prisma.project.findMany.mockResolvedValue([]);
      prisma.projectMember.findMany.mockResolvedValue([]);

      const result = await service.getTeacherStudents(teacherId);

      expect(result).toEqual({ data: [], total: 0, page: 1, limit: 20 });
    });

    it('should return DISTINCT students from classrooms where teacher teaches', async () => {
      prisma.user.findUnique.mockResolvedValue(teacher);
      // Teacher owns a project in classroom-1
      prisma.project.findMany.mockResolvedValue([
        { classroomId: 'classroom-1' },
      ]);
      // Teacher is also a member in classroom-2
      prisma.projectMember.findMany.mockResolvedValue([
        { project: { classroomId: 'classroom-2' } },
      ]);

      const students = [
        {
          id: 'student-1',
          fullName: 'Ana López',
          email: 'ana@test.com',
          avatarUrl: null,
          classroomId: 'classroom-1',
          classroom: { name: 'Aula 1A' },
        },
        {
          id: 'student-2',
          fullName: 'Carlos Ruiz',
          email: 'carlos@test.com',
          avatarUrl: 'avatar.jpg',
          classroomId: 'classroom-2',
          classroom: { name: 'Aula 2B' },
        },
      ];

      prisma.user.findMany.mockResolvedValue(students);
      prisma.user.count.mockResolvedValue(2);

      const result = await service.getTeacherStudents(teacherId);

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.data[0]).toEqual({
        id: 'student-1',
        fullName: 'Ana López',
        email: 'ana@test.com',
        avatarUrl: null,
        classroomId: 'classroom-1',
        classroomName: 'Aula 1A',
      });
      expect(result.data[1]).toEqual({
        id: 'student-2',
        fullName: 'Carlos Ruiz',
        email: 'carlos@test.com',
        avatarUrl: 'avatar.jpg',
        classroomId: 'classroom-2',
        classroomName: 'Aula 2B',
      });

      // Verify the query filters by STUDENT role and correct classrooms
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            role: 'STUDENT',
            classroomId: { in: ['classroom-1', 'classroom-2'] },
          },
        }),
      );
    });

    it('should filter by classroomId when provided', async () => {
      prisma.user.findUnique.mockResolvedValue(teacher);
      prisma.project.findMany.mockResolvedValue([
        { classroomId: 'classroom-1' },
        { classroomId: 'classroom-2' },
      ]);
      prisma.projectMember.findMany.mockResolvedValue([]);

      prisma.user.findMany.mockResolvedValue([
        {
          id: 'student-1',
          fullName: 'Ana López',
          email: 'ana@test.com',
          avatarUrl: null,
          classroomId: 'classroom-1',
          classroom: { name: 'Aula 1A' },
        },
      ]);
      prisma.user.count.mockResolvedValue(1);

      const result = await service.getTeacherStudents(teacherId, {
        classroomId: 'classroom-1',
      });

      expect(result.data).toHaveLength(1);
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            role: 'STUDENT',
            classroomId: { in: ['classroom-1'] },
          },
        }),
      );
    });

    it('should return empty when classroomId filter does not match any teacher classroom', async () => {
      prisma.user.findUnique.mockResolvedValue(teacher);
      prisma.project.findMany.mockResolvedValue([
        { classroomId: 'classroom-1' },
      ]);
      prisma.projectMember.findMany.mockResolvedValue([]);

      const result = await service.getTeacherStudents(teacherId, {
        classroomId: 'classroom-999',
      });

      expect(result).toEqual({ data: [], total: 0, page: 1, limit: 20 });
      expect(prisma.user.findMany).not.toHaveBeenCalled();
    });

    it('should apply pagination correctly', async () => {
      prisma.user.findUnique.mockResolvedValue(teacher);
      prisma.project.findMany.mockResolvedValue([
        { classroomId: 'classroom-1' },
      ]);
      prisma.projectMember.findMany.mockResolvedValue([]);
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(25);

      const result = await service.getTeacherStudents(teacherId, {
        page: 2,
        limit: 10,
      });

      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        }),
      );
    });

    it('should deduplicate classrooms when teacher owns and is member in same classroom', async () => {
      prisma.user.findUnique.mockResolvedValue(teacher);
      // Teacher owns a project in classroom-1
      prisma.project.findMany.mockResolvedValue([
        { classroomId: 'classroom-1' },
      ]);
      // Teacher is also a member of another project in classroom-1
      prisma.projectMember.findMany.mockResolvedValue([
        { project: { classroomId: 'classroom-1' } },
      ]);

      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(0);

      await service.getTeacherStudents(teacherId);

      // Should only query with one classroom-1, not duplicated
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            role: 'STUDENT',
            classroomId: { in: ['classroom-1'] },
          },
        }),
      );
    });
  });

  describe('getTeacherSubjects', () => {
    const teacherId = 'teacher-1';
    const teacher = { id: teacherId, role: 'TEACHER', fullName: 'Prof. García' };

    it('should throw NotFoundException when teacher does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getTeacherSubjects('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return subjects with classroom context, student counts, and stats', async () => {
      prisma.user.findUnique.mockResolvedValue(teacher);

      const projects = [
        {
          id: 'project-1',
          name: 'Matemáticas',
          classroomId: 'classroom-1',
          classroom: { id: 'classroom-1', name: 'Aula 1A' },
          _count: { tasks: 12 },
        },
        {
          id: 'project-2',
          name: 'Ciencias',
          classroomId: 'classroom-2',
          classroom: { id: 'classroom-2', name: 'Aula 2B' },
          _count: { tasks: 8 },
        },
      ];

      prisma.project.findMany.mockResolvedValue(projects);
      prisma.project.count.mockResolvedValue(2);

      // Student counts for each classroom
      prisma.user.count
        .mockResolvedValueOnce(30) // classroom-1
        .mockResolvedValueOnce(25); // classroom-2

      // Avg grades for each project
      prisma.submission.aggregate
        .mockResolvedValueOnce({ _avg: { grade: 78.5 } })
        .mockResolvedValueOnce({ _avg: { grade: 85.0 } });

      const result = await service.getTeacherSubjects(teacherId);

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);

      expect(result.data[0]).toEqual({
        id: 'project-1',
        name: 'Matemáticas',
        classroomId: 'classroom-1',
        classroomName: 'Aula 1A',
        studentCount: 30,
        taskCount: 12,
        avgGrade: 78.5,
      });

      expect(result.data[1]).toEqual({
        id: 'project-2',
        name: 'Ciencias',
        classroomId: 'classroom-2',
        classroomName: 'Aula 2B',
        studentCount: 25,
        taskCount: 8,
        avgGrade: 85.0,
      });
    });

    it('should return null avgGrade when no graded submissions exist', async () => {
      prisma.user.findUnique.mockResolvedValue(teacher);

      prisma.project.findMany.mockResolvedValue([
        {
          id: 'project-1',
          name: 'Matemáticas',
          classroomId: 'classroom-1',
          classroom: { id: 'classroom-1', name: 'Aula 1A' },
          _count: { tasks: 5 },
        },
      ]);
      prisma.project.count.mockResolvedValue(1);
      prisma.user.count.mockResolvedValue(15);
      prisma.submission.aggregate.mockResolvedValue({ _avg: { grade: null } });

      const result = await service.getTeacherSubjects(teacherId);

      expect(result.data[0].avgGrade).toBeNull();
    });

    it('should apply pagination correctly', async () => {
      prisma.user.findUnique.mockResolvedValue(teacher);
      prisma.project.findMany.mockResolvedValue([]);
      prisma.project.count.mockResolvedValue(10);

      const result = await service.getTeacherSubjects(teacherId, {
        page: 3,
        limit: 5,
      });

      expect(result.page).toBe(3);
      expect(result.limit).toBe(5);
      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 5,
        }),
      );
    });

    it('should query projects where teacher is owner OR member with teacher role', async () => {
      prisma.user.findUnique.mockResolvedValue(teacher);
      prisma.project.findMany.mockResolvedValue([]);
      prisma.project.count.mockResolvedValue(0);

      await service.getTeacherSubjects(teacherId);

      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            classroomId: { not: null },
            OR: [
              { userId: teacherId },
              { members: { some: { userId: teacherId, role: 'teacher' } } },
            ],
          },
        }),
      );
    });

    it('should return empty data when teacher has no subjects', async () => {
      prisma.user.findUnique.mockResolvedValue(teacher);
      prisma.project.findMany.mockResolvedValue([]);
      prisma.project.count.mockResolvedValue(0);

      const result = await service.getTeacherSubjects(teacherId);

      expect(result).toEqual({ data: [], total: 0, page: 1, limit: 20 });
    });
  });
});
