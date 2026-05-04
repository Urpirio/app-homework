/**
 * Schedule Type Definitions
 *
 * Matches the backend Prisma Schedule model and API response contracts.
 *
 * Validates: Requirements 4.8, 9.1
 */

export interface Schedule {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  room?: string;
  projectId: string;
  institutionId: string;
  project?: {
    id: string;
    name: string;
    color?: string;
  };
}
