/**
 * Institution Type Definitions
 *
 * Matches the backend Prisma Institution model and API response contracts.
 *
 * Validates: Requirements 4.8, 9.1
 */

export interface Institution {
  id: string;
  name: string;
  logoUrl?: string;
  address?: string;
  _count?: {
    users: number;
    projects: number;
    classrooms: number;
  };
}
