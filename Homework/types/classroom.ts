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
  students?: Array<{
    id: string;
    fullName: string;
    email: string;
    avatarUrl?: string;
  }>;
  projects?: Array<{
    id: string;
    name: string;
    user?: {
      fullName: string;
    };
    _count?: {
      tasks: number;
    };
  }>;
  _count?: {
    students: number;
    projects: number;
  };
}
