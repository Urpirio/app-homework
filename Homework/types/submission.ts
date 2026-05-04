/**
 * Submission Type Definitions
 *
 * Matches the backend Prisma Submission model and API response contracts.
 *
 * Validates: Requirements 4.8, 9.1
 */

export type SubmissionStatus = 'SUBMITTED' | 'GRADED' | 'RETURNED';

export interface Submission {
  id: string;
  taskId: string;
  studentId: string;
  fileUrl?: string;
  content?: string;
  grade?: number;
  feedback?: string;
  status: SubmissionStatus;
  createdAt: string;
  updatedAt: string;
  student?: {
    id: string;
    fullName: string;
    avatarUrl?: string;
  };
}
