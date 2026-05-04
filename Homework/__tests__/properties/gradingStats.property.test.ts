// Feature: homework-app-integration, Property 8: Grading statistics are mathematically correct
/**
 * Property 8: Grading statistics are mathematically correct
 *
 * For any set of submissions for a task, the computed grading statistics should satisfy:
 * - `averageGrade` equals the arithmetic mean of all graded submission grades
 * - `completionRate` equals (graded + returned) / total submissions * 100
 * - `pendingCount` equals the count of submissions with status SUBMITTED
 *
 * **Validates: Requirements 3.10, 14.1, 14.7, 15.11**
 */

import * as fc from 'fast-check';
import type { Submission, SubmissionStatus } from '../../types/submission';
import { computeGradingStats } from '../../utils/gradingStats';

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const statusArb: fc.Arbitrary<SubmissionStatus> = fc.constantFrom(
  'SUBMITTED',
  'GRADED',
  'RETURNED',
);

/** Safe date arbitrary that always produces valid ISO strings */
const safeDateArb = fc
  .integer({ min: new Date('2020-01-01').getTime(), max: new Date('2030-12-31').getTime() })
  .map((ts) => new Date(ts).toISOString());

/**
 * Generate a submission with a guaranteed grade when status is GRADED or RETURNED.
 * This matches real-world behavior where graded submissions always have a grade.
 */
const realisticSubmissionArb: fc.Arbitrary<Submission> = statusArb.chain(
  (status) => {
    const gradeArb =
      status === 'GRADED' || status === 'RETURNED'
        ? fc.integer({ min: 0, max: 100 })
        : fc.constant(undefined as number | undefined);

    return fc.record({
      id: fc.uuid(),
      taskId: fc.uuid(),
      studentId: fc.uuid(),
      fileUrl: fc.option(fc.webUrl(), { nil: undefined }),
      content: fc.option(fc.string({ minLength: 0, maxLength: 50 }), { nil: undefined }),
      grade: gradeArb,
      feedback: fc.option(fc.string({ minLength: 0, maxLength: 100 }), { nil: undefined }),
      status: fc.constant(status),
      createdAt: safeDateArb,
      updatedAt: safeDateArb,
    });
  },
);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Property 8: Grading statistics are mathematically correct', () => {
  it('averageGrade equals arithmetic mean of graded submission grades', () => {
    fc.assert(
      fc.property(
        fc.array(realisticSubmissionArb, { minLength: 1, maxLength: 50 }),
        (submissions) => {
          const stats = computeGradingStats(submissions);
          const graded = submissions.filter(
            (s) => s.status === 'GRADED' || s.status === 'RETURNED',
          );

          if (graded.length === 0) {
            expect(stats.averageGrade).toBe(0);
          } else {
            const expectedAvg =
              graded.reduce((sum, s) => sum + (s.grade ?? 0), 0) / graded.length;
            expect(stats.averageGrade).toBeCloseTo(expectedAvg, 10);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('completionRate equals (graded + returned) / total * 100', () => {
    fc.assert(
      fc.property(
        fc.array(realisticSubmissionArb, { minLength: 1, maxLength: 50 }),
        (submissions) => {
          const stats = computeGradingStats(submissions);
          const total = submissions.length;
          const completed = submissions.filter(
            (s) => s.status === 'GRADED' || s.status === 'RETURNED',
          ).length;

          const expectedRate = (completed / total) * 100;
          expect(stats.completionRate).toBeCloseTo(expectedRate, 10);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('pendingCount equals count of SUBMITTED status submissions', () => {
    fc.assert(
      fc.property(
        fc.array(realisticSubmissionArb, { minLength: 0, maxLength: 50 }),
        (submissions) => {
          const stats = computeGradingStats(submissions);
          const expectedPending = submissions.filter(
            (s) => s.status === 'SUBMITTED',
          ).length;
          expect(stats.pendingCount).toBe(expectedPending);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('totalSubmissions equals the input array length', () => {
    fc.assert(
      fc.property(
        fc.array(realisticSubmissionArb, { minLength: 0, maxLength: 50 }),
        (submissions) => {
          const stats = computeGradingStats(submissions);
          expect(stats.totalSubmissions).toBe(submissions.length);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('empty submissions produce zero stats', () => {
    const stats = computeGradingStats([]);
    expect(stats.averageGrade).toBe(0);
    expect(stats.completionRate).toBe(0);
    expect(stats.pendingCount).toBe(0);
    expect(stats.totalSubmissions).toBe(0);
  });

  it('completionRate is between 0 and 100', () => {
    fc.assert(
      fc.property(
        fc.array(realisticSubmissionArb, { minLength: 1, maxLength: 50 }),
        (submissions) => {
          const stats = computeGradingStats(submissions);
          expect(stats.completionRate).toBeGreaterThanOrEqual(0);
          expect(stats.completionRate).toBeLessThanOrEqual(100);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('averageGrade is between 0 and 100 when graded submissions exist', () => {
    fc.assert(
      fc.property(
        fc.array(realisticSubmissionArb, { minLength: 1, maxLength: 50 }),
        (submissions) => {
          const stats = computeGradingStats(submissions);
          const hasGraded = submissions.some(
            (s) => s.status === 'GRADED' || s.status === 'RETURNED',
          );
          if (hasGraded) {
            expect(stats.averageGrade).toBeGreaterThanOrEqual(0);
            expect(stats.averageGrade).toBeLessThanOrEqual(100);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
