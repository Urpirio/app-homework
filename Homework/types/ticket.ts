/**
 * Ticket Type Definitions
 *
 * Matches the backend Prisma Ticket model and API response contracts.
 *
 * Validates: Requirements 4.8, 9.1
 */

import type { Review } from './review';

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export interface Ticket {
  id: string;
  title: string;
  description: string;
  category: string;
  status: TicketStatus;
  assignedToId?: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  review?: Review;
}
