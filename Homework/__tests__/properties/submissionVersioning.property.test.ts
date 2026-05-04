// Feature: homework-app-integration, Property 23: Submission versioning preserves history
/**
 * Property 23: Submission versioning preserves history
 *
 * For any task and student, if a submission is updated (resubmitted) N times,
 * the submission history should contain N version entries, each with a distinct
 * updatedAt timestamp, and the latest version should be the one returned by default.
 *
 * **Validates: Requirements 8.7**
 */

import type { Submission } from '@/types/submission';
import {
    CreateSubmissionInput,
    applyResubmission,
    createSubmissionRecord,
    getLatestVersion,
    validateVersionHistory,
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
  fc.string({ minLength: 1, maxLength: 200 }),
  { nil: undefined }
);

/** Generator for valid submission payloads */
const arbSubmissionInput: fc.Arbitrary<CreateSubmissionInput> = fc.record({
  taskId: arbId,
  studentId: arbId,
  fileUrl: arbOptionalUrl,
  content: arbOptionalContent,
});

/** Generator for resubmission updates */
const arbResubmission = fc.record({
  fileUrl: arbOptionalUrl,
  content: arbOptionalContent,
});

/**
 * Generates a sequence of distinct ISO timestamps in ascending order.
 * Each timestamp is at least 1 second apart.
 */
function arbDistinctTimestamps(count: number): fc.Arbitrary<string[]> {
  return fc
    .date({ min: new Date('2020-01-01'), max: new Date('2029-01-01') })
    .chain((baseDate) =>
      fc.tuple(
        ...Array.from({ length: count }, (_, i) =>
          fc.constant(new Date(baseDate.getTime() + (i + 1) * 1000).toISOString())
        )
      )
    );
}

describe('Property 23: Submission versioning preserves history', () => {
  it('resubmitting N times produces N+1 version snapshots with distinct updatedAt', () => {
    fc.assert(
      fc.property(
        arbSubmissionInput,
        arbId,
        fc.integer({ min: 1, max: 5 }),
        (input, submissionId, resubmitCount) => {
          // Generate distinct timestamps: 1 for creation + N for resubmissions
          const totalVersions = resubmitCount + 1;
          const baseTime = new Date('2024-01-01T00:00:00Z');
          const timestamps = Array.from({ length: totalVersions }, (_, i) =>
            new Date(baseTime.getTime() + i * 60000).toISOString()
          );

          // Create initial submission
          let current = createSubmissionRecord(submissionId, input, timestamps[0]);
          const versionHistory: Submission[] = [{ ...current }];

          // Apply N resubmissions, each with a new timestamp
          for (let i = 1; i <= resubmitCount; i++) {
            current = applyResubmission(
              current,
              { fileUrl: `https://example.com/v${i}.pdf`, content: `Version ${i}` },
              timestamps[i]
            );
            versionHistory.push({ ...current });
          }

          // Verify: version history has N+1 entries
          expect(versionHistory).toHaveLength(totalVersions);

          // Verify: all updatedAt timestamps are distinct
          const updatedAts = versionHistory.map((v) => v.updatedAt);
          const uniqueUpdatedAts = new Set(updatedAts);
          expect(uniqueUpdatedAts.size).toBe(totalVersions);

          // Verify: validateVersionHistory passes
          const validation = validateVersionHistory(versionHistory);
          expect(validation.valid).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('the latest version is the one with the most recent updatedAt', () => {
    fc.assert(
      fc.property(
        arbSubmissionInput,
        arbId,
        fc.integer({ min: 1, max: 5 }),
        (input, submissionId, resubmitCount) => {
          const baseTime = new Date('2024-01-01T00:00:00Z');
          const timestamps = Array.from({ length: resubmitCount + 1 }, (_, i) =>
            new Date(baseTime.getTime() + i * 60000).toISOString()
          );

          let current = createSubmissionRecord(submissionId, input, timestamps[0]);
          const versionHistory: Submission[] = [{ ...current }];

          for (let i = 1; i <= resubmitCount; i++) {
            current = applyResubmission(
              current,
              { fileUrl: `https://example.com/v${i}.pdf` },
              timestamps[i]
            );
            versionHistory.push({ ...current });
          }

          const latest = getLatestVersion(versionHistory);
          expect(latest).toBeDefined();
          expect(latest!.updatedAt).toBe(timestamps[timestamps.length - 1]);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('resubmission preserves the original createdAt timestamp', () => {
    fc.assert(
      fc.property(
        arbSubmissionInput,
        arbId,
        fc.integer({ min: 1, max: 5 }),
        (input, submissionId, resubmitCount) => {
          const baseTime = new Date('2024-01-01T00:00:00Z');
          const createdAt = baseTime.toISOString();

          let current = createSubmissionRecord(submissionId, input, createdAt);

          for (let i = 1; i <= resubmitCount; i++) {
            const newTimestamp = new Date(
              baseTime.getTime() + i * 60000
            ).toISOString();
            current = applyResubmission(
              current,
              { content: `Resubmission ${i}` },
              newTimestamp
            );

            // createdAt should always be the original
            expect(current.createdAt).toBe(createdAt);
            // updatedAt should be the new timestamp
            expect(current.updatedAt).toBe(newTimestamp);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('resubmission preserves taskId and studentId across all versions', () => {
    fc.assert(
      fc.property(
        arbSubmissionInput,
        arbId,
        fc.integer({ min: 1, max: 5 }),
        (input, submissionId, resubmitCount) => {
          const baseTime = new Date('2024-01-01T00:00:00Z');

          let current = createSubmissionRecord(
            submissionId,
            input,
            baseTime.toISOString()
          );
          const versionHistory: Submission[] = [{ ...current }];

          for (let i = 1; i <= resubmitCount; i++) {
            current = applyResubmission(
              current,
              { fileUrl: `https://example.com/v${i}.pdf` },
              new Date(baseTime.getTime() + i * 60000).toISOString()
            );
            versionHistory.push({ ...current });
          }

          // All versions must share the same taskId and studentId
          for (const version of versionHistory) {
            expect(version.taskId).toBe(input.taskId);
            expect(version.studentId).toBe(input.studentId);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('version history validation detects mismatched taskId/studentId', () => {
    fc.assert(
      fc.property(
        arbSubmissionInput,
        arbId,
        arbId,
        (input, submissionId1, submissionId2) => {
          const now1 = '2024-01-01T00:00:00.000Z';
          const now2 = '2024-01-01T01:00:00.000Z';

          const sub1 = createSubmissionRecord(submissionId1, input, now1);
          const sub2 = createSubmissionRecord(submissionId2, {
            ...input,
            taskId: 'different-task-id',
          }, now2);

          const validation = validateVersionHistory([sub1, sub2]);
          expect(validation.valid).toBe(false);
          expect(validation.reason).toContain('Mismatched');
        }
      ),
      { numRuns: 100 }
    );
  });
});
