// Feature: homework-app-integration, Property 2: Submission creates a retrievable record (round-trip)
/**
 * Property 2: Submission creates a retrievable record (round-trip)
 *
 * For any valid submission payload (taskId, studentId, optional fileUrl, optional content),
 * creating a submission and then fetching it returns a submission list containing an entry
 * matching the original payload's taskId and studentId.
 *
 * **Validates: Requirements 1.2, 1.4**
 */

import type { Submission } from '@/types/submission';
import {
    CreateSubmissionInput,
    createSubmissionRecord,
    findSubmissionInList,
    submissionMatchesInput,
} from '@/utils/submissionHelpers';
import * as fc from 'fast-check';

/** Generator for valid UUID-like IDs */
const arbId = fc.uuid();

/** Generator for optional URL strings */
const arbOptionalUrl = fc.option(
  fc.webUrl().map((url) => `${url}/file.pdf`),
  { nil: undefined }
);

/** Generator for optional content strings */
const arbOptionalContent = fc.option(
  fc.string({ minLength: 1, maxLength: 500 }),
  { nil: undefined }
);

/** Generator for valid submission payloads */
const arbSubmissionInput: fc.Arbitrary<CreateSubmissionInput> = fc.record({
  taskId: arbId,
  studentId: arbId,
  fileUrl: arbOptionalUrl,
  content: arbOptionalContent,
});

/** Generator for ISO date strings using integer timestamps for safety */
const arbIsoDate = fc
  .integer({
    min: new Date('2020-01-01T00:00:00Z').getTime(),
    max: new Date('2030-12-31T23:59:59Z').getTime(),
  })
  .map((ts) => new Date(ts).toISOString());

describe('Property 2: Submission creates a retrievable record (round-trip)', () => {
  it('a created submission is retrievable from a list by taskId and studentId', () => {
    fc.assert(
      fc.property(
        arbSubmissionInput,
        arbId,
        arbIsoDate,
        (input, submissionId, now) => {
          // Create the submission record
          const submission = createSubmissionRecord(submissionId, input, now);

          // Simulate a list containing this submission (as returned by GET /submissions/task/{taskId})
          const submissionList: Submission[] = [submission];

          // Retrieve by taskId and studentId
          const found = findSubmissionInList(submissionList, input.taskId, input.studentId);

          // The submission should be found
          expect(found).toBeDefined();
          expect(found!.id).toBe(submissionId);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('a created submission preserves all input fields', () => {
    fc.assert(
      fc.property(
        arbSubmissionInput,
        arbId,
        arbIsoDate,
        (input, submissionId, now) => {
          const submission = createSubmissionRecord(submissionId, input, now);

          // Verify round-trip: all input fields are preserved
          expect(submissionMatchesInput(submission, input)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('a created submission has SUBMITTED status and matching timestamps', () => {
    fc.assert(
      fc.property(
        arbSubmissionInput,
        arbId,
        arbIsoDate,
        (input, submissionId, now) => {
          const submission = createSubmissionRecord(submissionId, input, now);

          expect(submission.status).toBe('SUBMITTED');
          expect(submission.createdAt).toBe(now);
          expect(submission.updatedAt).toBe(now);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('a submission is not found when searching with a different taskId', () => {
    fc.assert(
      fc.property(
        arbSubmissionInput,
        arbId,
        arbId,
        arbIsoDate,
        (input, submissionId, differentTaskId, now) => {
          fc.pre(differentTaskId !== input.taskId);

          const submission = createSubmissionRecord(submissionId, input, now);
          const submissionList: Submission[] = [submission];

          const found = findSubmissionInList(submissionList, differentTaskId, input.studentId);
          expect(found).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('a submission is found among multiple submissions in a list', () => {
    fc.assert(
      fc.property(
        arbSubmissionInput,
        arbId,
        arbIsoDate,
        fc.array(
          fc.record({
            id: arbId,
            taskId: arbId,
            studentId: arbId,
            fileUrl: arbOptionalUrl,
            content: arbOptionalContent,
          }),
          { minLength: 0, maxLength: 10 }
        ),
        (input, submissionId, now, otherInputs) => {
          const submission = createSubmissionRecord(submissionId, input, now);

          // Create other submissions that don't match
          const others: Submission[] = otherInputs
            .filter((o) => o.taskId !== input.taskId || o.studentId !== input.studentId)
            .map((o, i) =>
              createSubmissionRecord(`other-${i}`, {
                taskId: o.taskId,
                studentId: o.studentId,
                fileUrl: o.fileUrl,
                content: o.content,
              }, now)
            );

          const submissionList = [...others, submission];

          const found = findSubmissionInList(submissionList, input.taskId, input.studentId);
          expect(found).toBeDefined();
          expect(found!.id).toBe(submissionId);
        }
      ),
      { numRuns: 100 }
    );
  });
});
