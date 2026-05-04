// Feature: homework-app-integration, Property 3: Grading round-trip — grade published by teacher is visible to student
/**
 * Property 3: Grading round-trip — grade published by teacher is visible to student
 *
 * For any submission and valid grade (0-100) with feedback text, grading a submission
 * and then fetching it returns the same grade and feedback values.
 *
 * **Validates: Requirements 1.6, 3.8**
 */

import {
    CreateSubmissionInput,
    GradeSubmissionInput,
    applyGradeToSubmission,
    createSubmissionRecord,
    gradedSubmissionMatchesInput,
} from '@/utils/submissionHelpers';
import * as fc from 'fast-check';

/** Generator for valid UUID-like IDs */
const arbId = fc.uuid();

/** Generator for ISO date strings using integer timestamps for safety */
const arbIsoDate = fc
  .integer({
    min: new Date('2020-01-01T00:00:00Z').getTime(),
    max: new Date('2030-12-31T23:59:59Z').getTime(),
  })
  .map((ts) => new Date(ts).toISOString());

/** Generator for valid grades (0-100, integer) */
const arbGrade = fc.integer({ min: 0, max: 100 });

/** Generator for optional feedback strings */
const arbOptionalFeedback = fc.option(
  fc.string({ minLength: 1, maxLength: 1000 }),
  { nil: undefined }
);

/** Generator for valid submission payloads */
const arbSubmissionInput: fc.Arbitrary<CreateSubmissionInput> = fc.record({
  taskId: arbId,
  studentId: arbId,
  fileUrl: fc.option(fc.webUrl(), { nil: undefined }),
  content: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: undefined }),
});

/** Generator for valid grade payloads */
const arbGradeInput: fc.Arbitrary<GradeSubmissionInput> = fc.record({
  grade: arbGrade,
  feedback: arbOptionalFeedback,
});

describe('Property 3: Grading round-trip — grade published by teacher is visible to student', () => {
  it('grading a submission preserves the exact grade and feedback values', () => {
    fc.assert(
      fc.property(
        arbSubmissionInput,
        arbGradeInput,
        arbId,
        arbIsoDate,
        arbIsoDate,
        (submissionInput, gradeInput, submissionId, createdAt, gradedAt) => {
          // Create a submission
          const submission = createSubmissionRecord(submissionId, submissionInput, createdAt);

          // Apply grading
          const graded = applyGradeToSubmission(submission, gradeInput, gradedAt);

          // Verify round-trip: grade and feedback match exactly
          expect(gradedSubmissionMatchesInput(graded, gradeInput)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('graded submission has GRADED status', () => {
    fc.assert(
      fc.property(
        arbSubmissionInput,
        arbGradeInput,
        arbId,
        arbIsoDate,
        arbIsoDate,
        (submissionInput, gradeInput, submissionId, createdAt, gradedAt) => {
          const submission = createSubmissionRecord(submissionId, submissionInput, createdAt);
          const graded = applyGradeToSubmission(submission, gradeInput, gradedAt);

          expect(graded.status).toBe('GRADED');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('grading preserves original submission fields (taskId, studentId, fileUrl, content)', () => {
    fc.assert(
      fc.property(
        arbSubmissionInput,
        arbGradeInput,
        arbId,
        arbIsoDate,
        arbIsoDate,
        (submissionInput, gradeInput, submissionId, createdAt, gradedAt) => {
          const submission = createSubmissionRecord(submissionId, submissionInput, createdAt);
          const graded = applyGradeToSubmission(submission, gradeInput, gradedAt);

          // Original fields are preserved
          expect(graded.taskId).toBe(submissionInput.taskId);
          expect(graded.studentId).toBe(submissionInput.studentId);
          expect(graded.fileUrl).toBe(submissionInput.fileUrl);
          expect(graded.content).toBe(submissionInput.content);
          expect(graded.id).toBe(submissionId);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('grading updates the updatedAt timestamp', () => {
    fc.assert(
      fc.property(
        arbSubmissionInput,
        arbGradeInput,
        arbId,
        arbIsoDate,
        arbIsoDate,
        (submissionInput, gradeInput, submissionId, createdAt, gradedAt) => {
          const submission = createSubmissionRecord(submissionId, submissionInput, createdAt);
          const graded = applyGradeToSubmission(submission, gradeInput, gradedAt);

          // updatedAt should reflect the grading time
          expect(graded.updatedAt).toBe(gradedAt);
          // createdAt should be preserved
          expect(graded.createdAt).toBe(createdAt);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('grade value is always within 0-100 range after grading', () => {
    fc.assert(
      fc.property(
        arbSubmissionInput,
        arbGradeInput,
        arbId,
        arbIsoDate,
        arbIsoDate,
        (submissionInput, gradeInput, submissionId, createdAt, gradedAt) => {
          const submission = createSubmissionRecord(submissionId, submissionInput, createdAt);
          const graded = applyGradeToSubmission(submission, gradeInput, gradedAt);

          expect(graded.grade).toBeGreaterThanOrEqual(0);
          expect(graded.grade).toBeLessThanOrEqual(100);
        }
      ),
      { numRuns: 100 }
    );
  });
});
