import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from './users.service';

describe('UsersService - getUserTickets', () => {
  let service: UsersService;
  let prisma: {
    user: { findUnique: jest.Mock };
    ticket: { findMany: jest.Mock; count: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
      },
      ticket: {
        findMany: jest.fn(),
        count: jest.fn(),
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

  const userId = 'user-1';
  const user = { id: userId, role: 'SUPPORT', fullName: 'Support Agent' };

  it('should throw NotFoundException when user does not exist', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(service.getUserTickets('nonexistent')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should return paginated tickets for a user with default pagination', async () => {
    prisma.user.findUnique.mockResolvedValue(user);

    const tickets = [
      {
        id: 'ticket-1',
        title: 'Login issue',
        description: 'Cannot login',
        category: 'Technical',
        status: 'OPEN',
        createdById: userId,
        assignedToId: null,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
        createdBy: { id: userId, fullName: 'Support Agent', email: 'agent@test.com', avatarUrl: null },
        assignedTo: null,
        review: null,
      },
      {
        id: 'ticket-2',
        title: 'Grade error',
        description: 'Wrong grade',
        category: 'Academic',
        status: 'RESOLVED',
        createdById: 'other-user',
        assignedToId: userId,
        createdAt: new Date('2025-01-02'),
        updatedAt: new Date('2025-01-03'),
        createdBy: { id: 'other-user', fullName: 'Student', email: 'student@test.com', avatarUrl: null },
        assignedTo: { id: userId, fullName: 'Support Agent', email: 'agent@test.com', avatarUrl: null },
        review: { id: 'review-1', rating: 5, comment: 'Great help', ticketId: 'ticket-2', userId: 'other-user', createdAt: new Date() },
      },
    ];

    prisma.ticket.findMany.mockResolvedValue(tickets);
    prisma.ticket.count.mockResolvedValue(2);

    const result = await service.getUserTickets(userId);

    expect(result.data).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);

    // Verify the where clause includes OR for createdBy and assignedTo
    expect(prisma.ticket.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [{ createdById: userId }, { assignedToId: userId }],
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
      }),
    );
  });

  it('should filter tickets by status', async () => {
    prisma.user.findUnique.mockResolvedValue(user);
    prisma.ticket.findMany.mockResolvedValue([]);
    prisma.ticket.count.mockResolvedValue(0);

    await service.getUserTickets(userId, { status: 'OPEN' });

    expect(prisma.ticket.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [{ createdById: userId }, { assignedToId: userId }],
          status: 'OPEN',
        },
      }),
    );
  });

  it('should filter tickets by category', async () => {
    prisma.user.findUnique.mockResolvedValue(user);
    prisma.ticket.findMany.mockResolvedValue([]);
    prisma.ticket.count.mockResolvedValue(0);

    await service.getUserTickets(userId, { category: 'Technical' });

    expect(prisma.ticket.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [{ createdById: userId }, { assignedToId: userId }],
          category: 'Technical',
        },
      }),
    );
  });

  it('should apply multiple filters simultaneously', async () => {
    prisma.user.findUnique.mockResolvedValue(user);
    prisma.ticket.findMany.mockResolvedValue([]);
    prisma.ticket.count.mockResolvedValue(0);

    await service.getUserTickets(userId, {
      status: 'IN_PROGRESS',
      category: 'Academic',
    });

    expect(prisma.ticket.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [{ createdById: userId }, { assignedToId: userId }],
          status: 'IN_PROGRESS',
          category: 'Academic',
        },
      }),
    );
  });

  it('should apply pagination correctly', async () => {
    prisma.user.findUnique.mockResolvedValue(user);
    prisma.ticket.findMany.mockResolvedValue([]);
    prisma.ticket.count.mockResolvedValue(50);

    const result = await service.getUserTickets(userId, {
      page: 3,
      limit: 10,
    });

    expect(result.page).toBe(3);
    expect(result.limit).toBe(10);
    expect(prisma.ticket.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 20,
        take: 10,
      }),
    );
  });

  it('should return empty data when user has no tickets', async () => {
    prisma.user.findUnique.mockResolvedValue(user);
    prisma.ticket.findMany.mockResolvedValue([]);
    prisma.ticket.count.mockResolvedValue(0);

    const result = await service.getUserTickets(userId);

    expect(result).toEqual({ data: [], total: 0, page: 1, limit: 20 });
  });

  it('should include related createdBy, assignedTo, and review data', async () => {
    prisma.user.findUnique.mockResolvedValue(user);
    prisma.ticket.findMany.mockResolvedValue([]);
    prisma.ticket.count.mockResolvedValue(0);

    await service.getUserTickets(userId);

    expect(prisma.ticket.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: {
          createdBy: {
            select: {
              id: true,
              fullName: true,
              email: true,
              avatarUrl: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              fullName: true,
              email: true,
              avatarUrl: true,
            },
          },
          review: true,
        },
      }),
    );
  });
});
