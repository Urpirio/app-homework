/**
 * Review Type Definitions
 *
 * Matches the backend Prisma Review model and API response contracts.
 *
 * Validates: Requirements 4.8, 9.1
 */

export interface Review {
  id: string;
  rating: number;
  comment?: string;
  ticketId: string;
  userId: string;
  createdAt: string;
}
