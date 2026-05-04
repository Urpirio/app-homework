/**
 * Grading Statistics Utilities
 *
 * Pure functions for computing grading statistics from submission data.
 * Extracted for testability and reuse across teacher dashboard and subject detail screens.
 *
 * Validates: Requirements 3.10, 14.1, 14.7, 15.11
 */

import type { Submission } from '../types/submission';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GradingStats {
  /** Arithmetic mean of all graded submission grades */
  averageGrade: number;
  /** (graded + returned) / total submissions as a 0–100 percentage */
  completionRate: number;
  /** Count of submissions with status === 'SUBMITTED' */
  pendingCount: number;
  /** Total number of submissions */
  totalSubmissions: number;
}

// ---------------------------------------------------------------------------
// Computation
// ---------------------------------------------------------------------------

/**
 * Compute grading statistics from a list of submissions.
 *
 * Property 8: Grading statistics are mathematically correct.
 */
export function computeGradingStats(submissions: Submission[]): GradingStats {
  const total = submissions.length;

  if (total === 0) {
    return {
      averageGrade: 0,
      completionRate: 0,
      pendingCount: 0,
      totalSubmissions: 0,
    };
  }

  const graded = submissions.filter(
    (s) => s.status === 'GRADED' || s.status === 'RETURNED',
  );

  const pending = submissions.filter((s) => s.status === 'SUBMITTED');

  const gradesSum = graded.reduce((sum, s) => sum + (s.grade ?? 0), 0);
  const averageGrade = graded.length > 0 ? gradesSum / graded.length : 0;

  const completionRate = (graded.length / total) * 100;

  return {
    averageGrade,
    completionRate,
    pendingCount: pending.length,
    totalSubmissions: total,
  };
}

/**
 * Deduplicate a student list by ID.
 *
 * Property 7: Teacher student roster contains no duplicates.
 */
export function deduplicateStudents<T extends { id: string }>(
  students: T[],
): T[] {
  const seen = new Set<string>();
  const result: T[] = [];

  for (const student of students) {
    if (!seen.has(student.id)) {
      seen.add(student.id);
      result.push(student);
    }
  }

  return result;
}
