/**
 * Classroom Type Definitions
 *
 * Matches the backend Prisma Classroom model and API response contracts.
 *
 * Validates: Requirements 4.8, 9.1
 */

export interface Classroom {
  id: string;
  name: string;
  description?: string;
  institutionId: string;
  _count?: {
    students: number;
    projects: number;
  };
}
