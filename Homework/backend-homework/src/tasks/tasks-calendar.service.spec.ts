import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { TasksService } from './tasks.service';

describe('TasksService - getCalendarTasks', () => {
  let service: TasksService;
  let prisma: {
    user: { findUnique: jest.Mock };
    task: { findMany: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
      },
      task: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: PrismaService, useValue: prisma },
        { provide: NotificationsService, useValue: {} },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  const makeTasks = (overrides: Partial<any>[] = []) =>
    overrides.map((o, i) => ({
      id: `task-${i + 1}`,
      title: `Task ${i + 1}`,
      dueDate: new Date('2025-01-15T23:59:00Z'),
      status: 'TODO',
      project: { name: 'Math', color: '#FF0000' },
      ...o,
    }));

  describe('response format', () => {
    it('should return tasks with projectName and projectColor', async () => {
      prisma.user.findUnique.mockResolvedValue({ classroomId: 'class-1' });
      prisma.task.findMany.mockResolvedValue(
        makeTasks([
          {
            id: 'task-1',
            title: 'Homework 1',
            dueDate: new Date('2025-01-15T23:59:00Z'),
            status: 'TODO',
            project: { name: 'Mathematics', color: '#3498db' },
          },
        ]),
      );

      const result = await service.getCalendarTasks('student-1', 'STUDENT', {
        startDate: '2025-01-01',
        endDate: '2025-01-31',
      });

      expect(result.tasks).toHaveLength(1);
      expect(result.tasks[0]).toEqual({
        id: 'task-1',
        title: 'Homework 1',
        dueDate: '2025-01-15T23:59:00.000Z',
        status: 'TODO',
        projectName: 'Mathematics',
        projectColor: '#3498db',
      });
    });

    it('should return empty tasks array when no tasks match', async () => {
      prisma.user.findUnique.mockResolvedValue({ classroomId: 'class-1' });
      prisma.task.findMany.mockResolvedValue([]);

      const result = await service.getCalendarTasks('student-1', 'STUDENT', {
        startDate: '2025-01-01',
        endDate: '2025-01-31',
      });

      expect(result).toEqual({ tasks: [] });
    });

    it('should handle tasks with null dueDate in response', async () => {
      prisma.user.findUnique.mockResolvedValue({ classroomId: 'class-1' });
      prisma.task.findMany.mockResolvedValue(
        makeTasks([{ dueDate: null }]),
      );

      const result = await service.getCalendarTasks('student-1', 'STUDENT');

      expect(result.tasks[0].dueDate).toBeNull();
    });
  });

  describe('date range filtering', () => {
    it('should filter by startDate and endDate when both provided', async () => {
      prisma.user.findUnique.mockResolvedValue({ classroomId: 'class-1' });
      prisma.task.findMany.mockResolvedValue([]);

      await service.getCalendarTasks('student-1', 'STUDENT', {
        startDate: '2025-01-01',
        endDate: '2025-01-31',
      });

      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            dueDate: {
              gte: new Date('2025-01-01'),
              lte: new Date('2025-01-31'),
            },
          }),
        }),
      );
    });

    it('should filter by startDate only when endDate not provided', async () => {
      prisma.user.findUnique.mockResolvedValue({ classroomId: 'class-1' });
      prisma.task.findMany.mockResolvedValue([]);

      await service.getCalendarTasks('student-1', 'STUDENT', {
        startDate: '2025-01-01',
      });

      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            dueDate: { gte: new Date('2025-01-01') },
          }),
        }),
      );
    });

    it('should require non-null dueDate when no date range provided', async () => {
      prisma.user.findUnique.mockResolvedValue({ classroomId: 'class-1' });
      prisma.task.findMany.mockResolvedValue([]);

      await service.getCalendarTasks('student-1', 'STUDENT');

      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            dueDate: { not: null },
          }),
        }),
      );
    });
  });

  describe('STUDENT role filtering', () => {
    it('should filter tasks by student classroom', async () => {
      prisma.user.findUnique.mockResolvedValue({ classroomId: 'class-1' });
      prisma.task.findMany.mockResolvedValue([]);

      await service.getCalendarTasks('student-1', 'STUDENT', {
        startDate: '2025-01-01',
        endDate: '2025-01-31',
      });

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'student-1' },
        select: { classroomId: true },
      });

      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            project: { classroomId: 'class-1' },
          }),
        }),
      );
    });

    it('should return no tasks when student has no classroom', async () => {
      prisma.user.findUnique.mockResolvedValue({ classroomId: null });
      prisma.task.findMany.mockResolvedValue([]);

      await service.getCalendarTasks('student-1', 'STUDENT');

      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            project: { id: '__none__' },
          }),
        }),
      );
    });
  });

  describe('TEACHER role filtering', () => {
    it('should filter tasks by teacher ownership or membership', async () => {
      prisma.task.findMany.mockResolvedValue([]);

      await service.getCalendarTasks('teacher-1', 'TEACHER', {
        startDate: '2025-01-01',
        endDate: '2025-01-31',
      });

      // Teacher should NOT trigger a user lookup
      expect(prisma.user.findUnique).not.toHaveBeenCalled();

      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            project: {
              OR: [
                { userId: 'teacher-1' },
                { members: { some: { userId: 'teacher-1' } } },
              ],
            },
          }),
        }),
      );
    });
  });

  describe('ADMIN role filtering', () => {
    it('should filter SCHOOL_ADMIN tasks by institution', async () => {
      prisma.user.findUnique.mockResolvedValue({ institutionId: 'inst-1' });
      prisma.task.findMany.mockResolvedValue([]);

      await service.getCalendarTasks('admin-1', 'SCHOOL_ADMIN', {
        startDate: '2025-01-01',
        endDate: '2025-01-31',
      });

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'admin-1' },
        select: { institutionId: true },
      });

      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            project: { institutionId: 'inst-1' },
          }),
        }),
      );
    });

    it('should filter SUPER_ADMIN tasks by institution', async () => {
      prisma.user.findUnique.mockResolvedValue({ institutionId: 'inst-1' });
      prisma.task.findMany.mockResolvedValue([]);

      await service.getCalendarTasks('super-1', 'SUPER_ADMIN');

      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            project: { institutionId: 'inst-1' },
          }),
        }),
      );
    });

    it('should return all tasks when admin has no institution', async () => {
      prisma.user.findUnique.mockResolvedValue({ institutionId: null });
      prisma.task.findMany.mockResolvedValue([]);

      await service.getCalendarTasks('super-1', 'SUPER_ADMIN');

      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            project: {},
          }),
        }),
      );
    });
  });

  describe('unknown role', () => {
    it('should return no tasks for unknown roles', async () => {
      prisma.task.findMany.mockResolvedValue([]);

      await service.getCalendarTasks('user-1', 'UNKNOWN_ROLE');

      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            project: { id: '__none__' },
          }),
        }),
      );
    });
  });

  describe('ordering', () => {
    it('should order tasks by dueDate ascending', async () => {
      prisma.user.findUnique.mockResolvedValue({ classroomId: 'class-1' });
      prisma.task.findMany.mockResolvedValue([]);

      await service.getCalendarTasks('student-1', 'STUDENT');

      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { dueDate: 'asc' },
        }),
      );
    });
  });

  describe('project include', () => {
    it('should include project name and color', async () => {
      prisma.user.findUnique.mockResolvedValue({ classroomId: 'class-1' });
      prisma.task.findMany.mockResolvedValue([]);

      await service.getCalendarTasks('student-1', 'STUDENT');

      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            project: {
              select: { name: true, color: true },
            },
          },
        }),
      );
    });
  });
});
