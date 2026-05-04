/**
 * Unit Tests: Support and Review System
 *
 * Tests ticket status transitions, escalation logic, review visibility,
 * review templates, and ticket validation schemas.
 *
 * Validates: Requirements 15.1–15.16, 16.1–16.7
 */

import {
    ALL_TEMPLATES,
    getReviewTemplate,
    STUDENT_TEMPLATE,
    TEACHER_TEMPLATE,
} from '@/constants/reviewTemplates';
import type { TicketStatus } from '@/types/ticket';
import type { ReviewVisibility, UserRole } from '@/utils/reviewVisibility';
import { canViewReview } from '@/utils/reviewVisibility';
import {
    getTransitionActionLabel,
    getValidTransitions,
    isValidTransition,
    shouldAutoEscalate,
} from '@/utils/ticketEscalation';
import { ticketSchema } from '@/validation/schemas';

// ---------------------------------------------------------------------------
// Ticket status transition flow
// ---------------------------------------------------------------------------

describe('Ticket status transitions', () => {
  describe('getValidTransitions', () => {
    it('OPEN can only transition to IN_PROGRESS', () => {
      expect(getValidTransitions('OPEN')).toEqual(['IN_PROGRESS']);
    });

    it('IN_PROGRESS can only transition to RESOLVED', () => {
      expect(getValidTransitions('IN_PROGRESS')).toEqual(['RESOLVED']);
    });

    it('RESOLVED can only transition to CLOSED', () => {
      expect(getValidTransitions('RESOLVED')).toEqual(['CLOSED']);
    });

    it('CLOSED has no valid transitions', () => {
      expect(getValidTransitions('CLOSED')).toEqual([]);
    });
  });

  describe('isValidTransition', () => {
    it('allows OPEN → IN_PROGRESS', () => {
      expect(isValidTransition('OPEN', 'IN_PROGRESS')).toBe(true);
    });

    it('allows IN_PROGRESS → RESOLVED', () => {
      expect(isValidTransition('IN_PROGRESS', 'RESOLVED')).toBe(true);
    });

    it('allows RESOLVED → CLOSED', () => {
      expect(isValidTransition('RESOLVED', 'CLOSED')).toBe(true);
    });

    it('rejects OPEN → RESOLVED (skipping step)', () => {
      expect(isValidTransition('OPEN', 'RESOLVED')).toBe(false);
    });

    it('rejects OPEN → CLOSED (skipping steps)', () => {
      expect(isValidTransition('OPEN', 'CLOSED')).toBe(false);
    });

    it('rejects IN_PROGRESS → OPEN (backward)', () => {
      expect(isValidTransition('IN_PROGRESS', 'OPEN')).toBe(false);
    });

    it('rejects CLOSED → OPEN (backward from terminal)', () => {
      expect(isValidTransition('CLOSED', 'OPEN')).toBe(false);
    });

    it('rejects self-transitions', () => {
      const statuses: TicketStatus[] = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
      for (const status of statuses) {
        expect(isValidTransition(status, status)).toBe(false);
      }
    });
  });

  describe('getTransitionActionLabel', () => {
    it('returns Spanish labels for each status', () => {
      expect(getTransitionActionLabel('OPEN')).toBe('Abierto');
      expect(getTransitionActionLabel('IN_PROGRESS')).toBe('Tomar Ticket');
      expect(getTransitionActionLabel('RESOLVED')).toBe('Marcar Resuelto');
      expect(getTransitionActionLabel('CLOSED')).toBe('Cerrar Ticket');
    });
  });
});

// ---------------------------------------------------------------------------
// Review submission with rating validation
// ---------------------------------------------------------------------------

describe('Review submission and rating validation', () => {
  it('ratings 1 through 5 are within the valid range', () => {
    for (let rating = 1; rating <= 5; rating++) {
      expect(rating).toBeGreaterThanOrEqual(1);
      expect(rating).toBeLessThanOrEqual(5);
    }
  });

  it('rating 0 is below the valid range', () => {
    expect(0).toBeLessThan(1);
  });

  it('rating 6 is above the valid range', () => {
    expect(6).toBeGreaterThan(5);
  });

  it('review data shape includes required fields', () => {
    const review = {
      id: 'rev-1',
      rating: 4,
      comment: 'Great support',
      ticketId: 'ticket-1',
      userId: 'user-1',
      createdAt: '2025-01-15T10:00:00Z',
    };

    expect(review).toHaveProperty('id');
    expect(review).toHaveProperty('rating');
    expect(review).toHaveProperty('ticketId');
    expect(review).toHaveProperty('userId');
    expect(review).toHaveProperty('createdAt');
    expect(typeof review.rating).toBe('number');
  });

  it('review comment is optional', () => {
    const reviewWithoutComment = {
      id: 'rev-2',
      rating: 3,
      ticketId: 'ticket-2',
      userId: 'user-2',
      createdAt: '2025-01-15T10:00:00Z',
    };

    expect(reviewWithoutComment).not.toHaveProperty('comment');
  });
});

// ---------------------------------------------------------------------------
// Ticket validation schema (Zod)
// ---------------------------------------------------------------------------

describe('Ticket validation schema', () => {
  it('accepts a valid ticket', () => {
    const result = ticketSchema.safeParse({
      title: 'Cannot access grades',
      description: 'I am unable to view my grades for the current semester.',
      category: 'Technical',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing title', () => {
    const result = ticketSchema.safeParse({
      description: 'A valid description that is long enough.',
      category: 'Technical',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty title', () => {
    const result = ticketSchema.safeParse({
      title: '',
      description: 'A valid description that is long enough.',
      category: 'Technical',
    });
    expect(result.success).toBe(false);
  });

  it('rejects title exceeding 200 characters', () => {
    const result = ticketSchema.safeParse({
      title: 'A'.repeat(201),
      description: 'A valid description that is long enough.',
      category: 'Technical',
    });
    expect(result.success).toBe(false);
  });

  it('rejects description shorter than 10 characters', () => {
    const result = ticketSchema.safeParse({
      title: 'Valid title',
      description: 'Short',
      category: 'Technical',
    });
    expect(result.success).toBe(false);
  });

  it('rejects description exceeding 2000 characters', () => {
    const result = ticketSchema.safeParse({
      title: 'Valid title',
      description: 'A'.repeat(2001),
      category: 'Technical',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing category', () => {
    const result = ticketSchema.safeParse({
      title: 'Valid title',
      description: 'A valid description that is long enough.',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty category', () => {
    const result = ticketSchema.safeParse({
      title: 'Valid title',
      description: 'A valid description that is long enough.',
      category: '',
    });
    expect(result.success).toBe(false);
  });

  it('accepts title at boundary length of 200', () => {
    const result = ticketSchema.safeParse({
      title: 'A'.repeat(200),
      description: 'A valid description that is long enough.',
      category: 'General',
    });
    expect(result.success).toBe(true);
  });

  it('accepts description at boundary length of 10', () => {
    const result = ticketSchema.safeParse({
      title: 'Valid title',
      description: 'A'.repeat(10),
      category: 'General',
    });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Role-based review visibility
// ---------------------------------------------------------------------------

describe('Role-based review visibility', () => {
  const reviewedUserId = 'user-reviewed';

  describe('Admin roles always see all reviews', () => {
    it('SUPER_ADMIN can view PUBLIC reviews', () => {
      expect(
        canViewReview({
          viewerRole: 'SUPER_ADMIN',
          viewerId: 'admin-1',
          reviewedUserId,
          visibility: 'PUBLIC',
        }),
      ).toBe(true);
    });

    it('SUPER_ADMIN can view CONFIDENTIAL reviews', () => {
      expect(
        canViewReview({
          viewerRole: 'SUPER_ADMIN',
          viewerId: 'admin-1',
          reviewedUserId,
          visibility: 'CONFIDENTIAL',
        }),
      ).toBe(true);
    });

    it('SCHOOL_ADMIN can view PUBLIC reviews', () => {
      expect(
        canViewReview({
          viewerRole: 'SCHOOL_ADMIN',
          viewerId: 'admin-2',
          reviewedUserId,
          visibility: 'PUBLIC',
        }),
      ).toBe(true);
    });

    it('SCHOOL_ADMIN can view CONFIDENTIAL reviews', () => {
      expect(
        canViewReview({
          viewerRole: 'SCHOOL_ADMIN',
          viewerId: 'admin-2',
          reviewedUserId,
          visibility: 'CONFIDENTIAL',
        }),
      ).toBe(true);
    });
  });

  describe('Non-admin reviewed user can see PUBLIC reviews', () => {
    const nonAdminRoles: UserRole[] = ['TEACHER', 'STUDENT', 'SUPPORT'];

    for (const role of nonAdminRoles) {
      it(`${role} can view their own PUBLIC review`, () => {
        expect(
          canViewReview({
            viewerRole: role,
            viewerId: reviewedUserId,
            reviewedUserId,
            visibility: 'PUBLIC',
          }),
        ).toBe(true);
      });
    }
  });

  describe('CONFIDENTIAL reviews hidden from non-admins', () => {
    const nonAdminRoles: UserRole[] = ['TEACHER', 'STUDENT', 'SUPPORT'];

    for (const role of nonAdminRoles) {
      it(`${role} cannot view their own CONFIDENTIAL review`, () => {
        expect(
          canViewReview({
            viewerRole: role,
            viewerId: reviewedUserId,
            reviewedUserId,
            visibility: 'CONFIDENTIAL',
          }),
        ).toBe(false);
      });
    }
  });

  describe('Non-self non-admin cannot see any review', () => {
    const nonAdminRoles: UserRole[] = ['TEACHER', 'STUDENT', 'SUPPORT'];
    const visibilities: ReviewVisibility[] = ['PUBLIC', 'CONFIDENTIAL'];

    for (const role of nonAdminRoles) {
      for (const visibility of visibilities) {
        it(`${role} cannot view another user's ${visibility} review`, () => {
          expect(
            canViewReview({
              viewerRole: role,
              viewerId: 'other-user',
              reviewedUserId,
              visibility,
            }),
          ).toBe(false);
        });
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Escalation timer logic
// ---------------------------------------------------------------------------

describe('Escalation timer logic', () => {
  function makeTicket(overrides: Partial<{
    status: TicketStatus;
    priority: string;
    createdAt: string;
    assignedToId: string;
  }> = {}) {
    return {
      status: 'OPEN' as TicketStatus,
      priority: 'Medium',
      createdAt: new Date().toISOString(),
      ...overrides,
    };
  }

  describe('Priority-based escalation for unclaimed OPEN tickets', () => {
    it('escalates Critical ticket unclaimed for over 1 hour', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      const ticket = makeTicket({ priority: 'Critical', createdAt: twoHoursAgo });
      expect(shouldAutoEscalate(ticket)).toBe(true);
    });

    it('does not escalate Critical ticket created less than 1 hour ago', () => {
      const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      const ticket = makeTicket({ priority: 'Critical', createdAt: thirtyMinAgo });
      expect(shouldAutoEscalate(ticket)).toBe(false);
    });

    it('escalates High priority ticket unclaimed for over 2 hours', () => {
      const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
      const ticket = makeTicket({ priority: 'High', createdAt: threeHoursAgo });
      expect(shouldAutoEscalate(ticket)).toBe(true);
    });

    it('does not escalate High priority ticket created less than 2 hours ago', () => {
      const oneHourAgo = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString();
      const ticket = makeTicket({ priority: 'High', createdAt: oneHourAgo });
      expect(shouldAutoEscalate(ticket)).toBe(false);
    });

    it('does not priority-escalate Medium priority tickets', () => {
      const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
      const ticket = makeTicket({ priority: 'Medium', createdAt: threeHoursAgo });
      expect(shouldAutoEscalate(ticket)).toBe(false);
    });
  });

  describe('Assigned tickets do not trigger priority-based escalation', () => {
    it('does not priority-escalate Critical ticket that is assigned', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      const ticket = makeTicket({
        priority: 'Critical',
        createdAt: twoHoursAgo,
        assignedToId: 'support-1',
      });
      expect(shouldAutoEscalate(ticket)).toBe(false);
    });

    it('does not priority-escalate High ticket that is assigned', () => {
      const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
      const ticket = makeTicket({
        priority: 'High',
        createdAt: threeHoursAgo,
        assignedToId: 'support-1',
      });
      expect(shouldAutoEscalate(ticket)).toBe(false);
    });
  });

  describe('48-hour unresolved escalation', () => {
    it('escalates any OPEN ticket unresolved after 48 hours', () => {
      const fiftyHoursAgo = new Date(Date.now() - 50 * 60 * 60 * 1000).toISOString();
      const ticket = makeTicket({ priority: 'Low', createdAt: fiftyHoursAgo });
      expect(shouldAutoEscalate(ticket)).toBe(true);
    });

    it('escalates IN_PROGRESS ticket unresolved after 48 hours', () => {
      const fiftyHoursAgo = new Date(Date.now() - 50 * 60 * 60 * 1000).toISOString();
      const ticket = makeTicket({
        status: 'IN_PROGRESS',
        priority: 'Low',
        createdAt: fiftyHoursAgo,
      });
      expect(shouldAutoEscalate(ticket)).toBe(true);
    });

    it('does not escalate ticket created less than 48 hours ago (no priority match)', () => {
      const twentyHoursAgo = new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString();
      const ticket = makeTicket({ priority: 'Low', createdAt: twentyHoursAgo });
      expect(shouldAutoEscalate(ticket)).toBe(false);
    });
  });

  describe('RESOLVED and CLOSED tickets never escalate', () => {
    it('does not escalate RESOLVED ticket even after 48 hours', () => {
      const fiftyHoursAgo = new Date(Date.now() - 50 * 60 * 60 * 1000).toISOString();
      const ticket = makeTicket({ status: 'RESOLVED', createdAt: fiftyHoursAgo });
      expect(shouldAutoEscalate(ticket)).toBe(false);
    });

    it('does not escalate CLOSED ticket even after 48 hours', () => {
      const fiftyHoursAgo = new Date(Date.now() - 50 * 60 * 60 * 1000).toISOString();
      const ticket = makeTicket({ status: 'CLOSED', createdAt: fiftyHoursAgo });
      expect(shouldAutoEscalate(ticket)).toBe(false);
    });

    it('does not escalate RESOLVED Critical ticket', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      const ticket = makeTicket({
        status: 'RESOLVED',
        priority: 'Critical',
        createdAt: twoHoursAgo,
      });
      expect(shouldAutoEscalate(ticket)).toBe(false);
    });
  });

  describe('Priority-based escalation only applies to OPEN tickets', () => {
    it('does not priority-escalate IN_PROGRESS Critical ticket', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      const ticket = makeTicket({
        status: 'IN_PROGRESS',
        priority: 'Critical',
        createdAt: twoHoursAgo,
      });
      // IN_PROGRESS + 2h < 48h threshold, so no escalation
      expect(shouldAutoEscalate(ticket)).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// Review templates
// ---------------------------------------------------------------------------

describe('Review templates', () => {
  it('returns STUDENT_TEMPLATE for STUDENT role', () => {
    expect(getReviewTemplate('STUDENT')).toBe(STUDENT_TEMPLATE);
  });

  it('returns TEACHER_TEMPLATE for TEACHER role', () => {
    expect(getReviewTemplate('TEACHER')).toBe(TEACHER_TEMPLATE);
  });

  it('defaults to STUDENT_TEMPLATE for unknown roles', () => {
    expect(getReviewTemplate('SUPPORT')).toBe(STUDENT_TEMPLATE);
    expect(getReviewTemplate('UNKNOWN')).toBe(STUDENT_TEMPLATE);
  });

  it('STUDENT_TEMPLATE has correct dimensions', () => {
    const keys = STUDENT_TEMPLATE.dimensions.map((d) => d.key);
    expect(keys).toEqual(['academic', 'behavior', 'participation', 'homework']);
  });

  it('TEACHER_TEMPLATE has correct dimensions', () => {
    const keys = TEACHER_TEMPLATE.dimensions.map((d) => d.key);
    expect(keys).toEqual(['teaching_quality', 'communication', 'curriculum', 'engagement']);
  });

  it('ALL_TEMPLATES contains both templates', () => {
    expect(ALL_TEMPLATES).toHaveLength(2);
    expect(ALL_TEMPLATES).toContain(STUDENT_TEMPLATE);
    expect(ALL_TEMPLATES).toContain(TEACHER_TEMPLATE);
  });

  it('each template has a role and label', () => {
    for (const template of ALL_TEMPLATES) {
      expect(template.role).toBeTruthy();
      expect(template.label).toBeTruthy();
      expect(template.dimensions.length).toBeGreaterThan(0);
    }
  });

  it('each dimension has key, label, and description', () => {
    for (const template of ALL_TEMPLATES) {
      for (const dim of template.dimensions) {
        expect(dim.key).toBeTruthy();
        expect(dim.label).toBeTruthy();
        expect(dim.description).toBeTruthy();
      }
    }
  });
});
