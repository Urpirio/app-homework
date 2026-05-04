import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { ReviewsService } from './reviews.service';

describe('ReviewsService - findOne', () => {
  let service: ReviewsService;
  let prisma: {
    review: { findUnique: jest.Mock };
    ticket: { findUnique: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      review: {
        findUnique: jest.fn(),
      },
      ticket: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
  });

  it('should return a review with ticket info and reviewer data', async () => {
    const mockReview = {
      id: 'review-1',
      rating: 4,
      comment: 'Great support',
      ticketId: 'ticket-1',
      userId: 'user-1',
      createdAt: new Date('2025-01-15'),
      ticket: {
        id: 'ticket-1',
        title: 'Login issue',
        category: 'Technical',
        status: 'RESOLVED',
      },
      user: {
        id: 'user-1',
        fullName: 'Juan Pérez',
        avatarUrl: 'https://example.com/avatar.jpg',
      },
    };

    prisma.review.findUnique.mockResolvedValue(mockReview);

    const result = await service.findOne('review-1');

    expect(result).toEqual(mockReview);
    expect(result.rating).toBe(4);
    expect(result.comment).toBe('Great support');
    expect(result.ticket.title).toBe('Login issue');
    expect(result.ticket.category).toBe('Technical');
    expect(result.ticket.status).toBe('RESOLVED');
    expect(result.user.fullName).toBe('Juan Pérez');
    expect(result.user.avatarUrl).toBe('https://example.com/avatar.jpg');
  });

  it('should call prisma with correct include selections', async () => {
    prisma.review.findUnique.mockResolvedValue({
      id: 'review-1',
      rating: 5,
      comment: null,
      ticketId: 'ticket-1',
      userId: 'user-1',
      createdAt: new Date(),
      ticket: { id: 'ticket-1', title: 'Test', category: 'General', status: 'CLOSED' },
      user: { id: 'user-1', fullName: 'Test User', avatarUrl: null },
    });

    await service.findOne('review-1');

    expect(prisma.review.findUnique).toHaveBeenCalledWith({
      where: { id: 'review-1' },
      include: {
        ticket: {
          select: {
            id: true,
            title: true,
            category: true,
            status: true,
          },
        },
        user: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });
  });

  it('should throw NotFoundException when review does not exist', async () => {
    prisma.review.findUnique.mockResolvedValue(null);

    await expect(service.findOne('nonexistent-id')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should return a review with null comment', async () => {
    const mockReview = {
      id: 'review-2',
      rating: 3,
      comment: null,
      ticketId: 'ticket-2',
      userId: 'user-2',
      createdAt: new Date('2025-02-01'),
      ticket: { id: 'ticket-2', title: 'Account issue', category: 'Account', status: 'CLOSED' },
      user: { id: 'user-2', fullName: 'María López', avatarUrl: null },
    };

    prisma.review.findUnique.mockResolvedValue(mockReview);

    const result = await service.findOne('review-2');

    expect(result.comment).toBeNull();
    expect(result.user.avatarUrl).toBeNull();
  });
});
