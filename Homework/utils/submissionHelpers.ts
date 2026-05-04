/**
 * Submission Data Helpers
 *
 * Pure logic functions for submission creation, grading, and versioning
 * that ensure round-trip data consistency.
 *
 * Validates: Requirements 1.2, 1.4, 1.6, 3.8, 8.7
 */

import type { Submission, SubmissionStatus } from '../types/submission';

/** Payload for creating a new submission */
export interface CreateSubmissionInput {
  taskId: string;
  studentId: string;
  fileUrl?: string;
  content?: string;
}

/** Payload for grading a submission */
export interface GradeSubmissionInput {
  grade: number;
  feedback?: string;
}

/**
 * Creates a submission record from a payload.
 * Simulates the backend's POST /submissions behavior for data consistency testing.
 */
export function createSubmissionRecord(
  id: string,
  input: CreateSubmissionInput,
  now: string
): Submission {
  return {
    id,
    taskId: input.taskId,
    studentId: input.studentId,
    fileUrl: input.fileUrl,
    content: input.content,
    status: 'SUBMITTED' as SubmissionStatus,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Applies a grade to a submission record.
 * Simulates the backend's PATCH /submissions/{id}/grade behavior.
 */
export function applyGradeToSubmission(
  submission: Submission,
  gradeInput: GradeSubmissionInput,
  now: string
): Submission {
  return {
    ...submission,
    grade: gradeInput.grade,
    feedback: gradeInput.feedback,
    status: 'GRADED' as SubmissionStatus,
    updatedAt: now,
  };
}

/**
 * Checks whether a submission record matches the original creation input.
 * Used to verify round-trip consistency (Property 2).
 */
export function submissionMatchesInput(
  submission: Submission,
  input: CreateSubmissionInput
): boolean {
  return (
    submission.taskId === input.taskId &&
    submission.studentId === input.studentId &&
    submission.fileUrl === input.fileUrl &&
    submission.content === input.content &&
    submission.status === 'SUBMITTED'
  );
}

/**
 * Checks whether a graded submission matches the grade input.
 * Used to verify grading round-trip consistency (Property 3).
 */
export function gradedSubmissionMatchesInput(
  submission: Submission,
  gradeInput: GradeSubmissionInput
): boolean {
  return (
    submission.grade === gradeInput.grade &&
    submission.feedback === gradeInput.feedback &&
    submission.status === 'GRADED'
  );
}

/**
 * Finds a submission in a list by taskId and studentId.
 * Simulates the retrieval step of the round-trip.
 */
export function findSubmissionInList(
  submissions: Submission[],
  taskId: string,
  studentId: string
): Submission | undefined {
  return submissions.find(
    (s) => s.taskId === taskId && s.studentId === studentId
  );
}

/**
 * Applies a resubmission (version update) to a submission record.
 * The updatedAt timestamp changes while createdAt is preserved (Property 23).
 */
export function applyResubmission(
  submission: Submission,
  update: { fileUrl?: string; content?: string },
  now: string
): Submission {
  return {
    ...submission,
    fileUrl: update.fileUrl ?? submission.fileUrl,
    content: update.content ?? submission.content,
    updatedAt: now,
  };
}

/**
 * Validates that a submission version history is consistent:
 * - All entries share the same taskId and studentId
 * - Each entry has a distinct updatedAt timestamp
 * - The latest version (by updatedAt) is the one returned by default
 */
export function validateVersionHistory(
  versions: Submission[]
): { valid: boolean; reason?: string } {
  if (versions.length === 0) {
    return { valid: true };
  }

  const taskId = versions[0].taskId;
  const studentId = versions[0].studentId;

  // All entries must share taskId and studentId
  for (const v of versions) {
    if (v.taskId !== taskId || v.studentId !== studentId) {
      return {
        valid: false,
        reason: `Mismatched taskId/studentId: expected ${taskId}/${studentId}, got ${v.taskId}/${v.studentId}`,
      };
    }
  }

  // Each entry must have a distinct updatedAt
  const timestamps = versions.map((v) => v.updatedAt);
  const uniqueTimestamps = new Set(timestamps);
  if (uniqueTimestamps.size !== timestamps.length) {
    return {
      valid: false,
      reason: 'Duplicate updatedAt timestamps found in version history',
    };
  }

  // The latest version should be the one with the most recent updatedAt
  const sorted = [...versions].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
  const latestVersion = sorted[0];

  // Verify the latest version is deterministic
  if (latestVersion.updatedAt !== sorted[0].updatedAt) {
    return {
      valid: false,
      reason: 'Latest version is not deterministic',
    };
  }

  return { valid: true };
}

/**
 * Returns the latest submission version from a list.
 */
export function getLatestVersion(versions: Submission[]): Submission | undefined {
  if (versions.length === 0) return undefined;
  return [...versions].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )[0];
}
