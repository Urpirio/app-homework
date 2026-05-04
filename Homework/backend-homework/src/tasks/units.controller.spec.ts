import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { TasksService } from './tasks.service';

describe('TasksService - getUnitTasks', () => {
  let service: TasksService;
  let prisma: {
    unit: { findUnique: jest.Mock };
    task: { findMany: jest.Mock; count: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      unit: {
        findUnique: jest.fn(),
      },
      task: {
        findMany: jest.fn(),
        count: jest.fn(),
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

  const unitId = 'unit-1';
  const unit = { id: unitId, name: 'Unit 1', projectId: 'project-1' };

  it('should throw NotFoundException when unit does not exist', async () => {
    prisma.unit.findUnique.mockResolvedValue(null);

    await expect(service.getUnitTasks('nonexistent')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should return paginated tasks with default page=1 and limit=15', async () => {
    prisma.unit.findUnique.mockResolvedValue(unit);

    const tasks = [
      {
        id: 'task-1',
        title: 'Assignment 1',
        status: 'TODO',
        type: 'ASSIGNMENT',
        dueDate: new Date('2025-02-15T23:59:00Z'),
        maxGrade: 100,
        _count: { submissions: 5 },
      },
      {
        id: 'task-2',
        title: 'Quiz 1',
        status: 'IN_PROGRESS',
        type: 'QUIZ',
        dueDate: null,
        maxGrade: 50,
        _count: { submissions: 0 },
      },
    ];

    prisma.task.findMany.mockResolvedValue(tasks);
    prisma.task.count.mockResolvedValue(2);

    const result = await service.getUnitTasks(unitId);

    expect(result.data).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(15);

    expect(result.data[0]).toEqual({
      id: 'task-1',
      title: 'Assignment 1',
      status: 'TODO',
      type: 'ASSIGNMENT',
      dueDate: '2025-02-15T23:59:00.000Z',
      maxGrade: 100,
      submissionCount: 5,
    });

    expect(result.data[1]).toEqual({
      id: 'task-2',
      title: 'Quiz 1',
      status: 'IN_PROGRESS',
      type: 'QUIZ',
      dueDate: null,
      maxGrade: 50,
      submissionCount: 0,
    });
  });

  it('should apply pagination correctly', async () => {
    prisma.unit.findUnique.mockResolvedValue(unit);
    prisma.task.findMany.mockResolvedValue([]);
    prisma.task.count.mockResolvedValue(30);

    const result = await service.getUnitTasks(unitId, { page: 2, limit: 10 });

    expect(result.page).toBe(2);
    expect(result.limit).toBe(10);
    expect(prisma.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10,
        take: 10,
      }),
    );
  });

  it('should filter by status when provided', async () => {
    prisma.unit.findUnique.mockResolvedValue(unit);
    prisma.task.findMany.mockResolvedValue([]);
    prisma.task.count.mockResolvedValue(0);

    await service.getUnitTasks(unitId, { status: 'TODO' });

    expect(prisma.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          unitId,
          status: 'TODO',
        }),
      }),
    );
  });

  it('should filter by deadlineBefore when provided', async () => {
    prisma.unit.findUnique.mockResolvedValue(unit);
    prisma.task.findMany.mockResolvedValue([]);
    prisma.task.count.mockResolvedValue(0);

    await service.getUnitTasks(unitId, { deadlineBefore: '2025-03-01' });

    expect(prisma.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          unitId,
          dueDate: { lte: new Date('2025-03-01') },
        }),
      }),
    );
  });

  it('should filter by deadlineAfter when provided', async () => {
    prisma.unit.findUnique.mockResolvedValue(unit);
    prisma.task.findMany.mockResolvedValue([]);
    prisma.task.count.mockResolvedValue(0);

    await service.getUnitTasks(unitId, { deadlineAfter: '2025-01-01' });

    expect(prisma.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          unitId,
          dueDate: { gte: new Date('2025-01-01') },
        }),
      }),
    );
  });

  it('should combine deadlineBefore and deadlineAfter filters', async () => {
    prisma.unit.findUnique.mockResolvedValue(unit);
    prisma.task.findMany.mockResolvedValue([]);
    prisma.task.count.mockResolvedValue(0);

    await service.getUnitTasks(unitId, {
      deadlineBefore: '2025-03-01',
      deadlineAfter: '2025-01-01',
    });

    expect(prisma.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          unitId,
          dueDate: {
            lte: new Date('2025-03-01'),
            gte: new Date('2025-01-01'),
          },
        }),
      }),
    );
  });

  it('should combine status and deadline filters', async () => {
    prisma.unit.findUnique.mockResolvedValue(unit);
    prisma.task.findMany.mockResolvedValue([]);
    prisma.task.count.mockResolvedValue(0);

    await service.getUnitTasks(unitId, {
      status: 'IN_PROGRESS',
      deadlineBefore: '2025-06-01',
    });

    expect(prisma.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          unitId,
          status: 'IN_PROGRESS',
          dueDate: { lte: new Date('2025-06-01') },
        }),
      }),
    );
  });

  it('should return empty data when unit has no tasks', async () => {
    prisma.unit.findUnique.mockResolvedValue(unit);
    prisma.task.findMany.mockResolvedValue([]);
    prisma.task.count.mockResolvedValue(0);

    const result = await service.getUnitTasks(unitId);

    expect(result).toEqual({ data: [], total: 0, page: 1, limit: 15 });
  });

  it('should include submission counts via _count', async () => {
    prisma.unit.findUnique.mockResolvedValue(unit);

    prisma.task.findMany.mockResolvedValue([
      {
        id: 'task-1',
        title: 'Exam',
        status: 'DONE',
        type: 'EXAM',
        dueDate: new Date('2025-01-20T12:00:00Z'),
        maxGrade: 100,
        _count: { submissions: 25 },
      },
    ]);
    prisma.task.count.mockResolvedValue(1);

    const result = await service.getUnitTasks(unitId);

    expect(result.data[0].submissionCount).toBe(25);
  });

  it('should query tasks filtered by unitId', async () => {
    prisma.unit.findUnique.mockResolvedValue(unit);
    prisma.task.findMany.mockResolvedValue([]);
    prisma.task.count.mockResolvedValue(0);

    await service.getUnitTasks(unitId);

    expect(prisma.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ unitId }),
      }),
    );
    expect(prisma.task.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ unitId }),
      }),
    );
  });
});
