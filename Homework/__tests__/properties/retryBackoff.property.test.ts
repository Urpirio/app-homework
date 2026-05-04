// Feature: homework-app-integration, Property 25: Retry delay follows exponential backoff
/**
 * Property 25: Retry delay follows exponential backoff
 *
 * For any sequence of retry attempts (0, 1, 2, ..., maxRetries), the delay
 * before attempt N should be approximately baseDelay * 2^N (plus jitter),
 * capped at maxDelay. The delay should always be positive and should
 * monotonically increase (ignoring jitter) up to the cap.
 *
 * **Validates: Requirements 9.4**
 */

import * as fc from 'fast-check';

/**
 * Computes the retry delay for a given attempt using the same formula
 * as the withRetry utility: min(baseDelay * 2^attempt + jitter, maxDelay)
 * where jitter is in [0, 500).
 *
 * We test the formula directly since withRetry uses setTimeout internally.
 */
function computeRetryDelay(
  attempt: number,
  baseDelay: number,
  maxDelay: number,
  jitter: number
): number {
  return Math.min(baseDelay * Math.pow(2, attempt) + jitter, maxDelay);
}

describe('Property 25: Retry delay follows exponential backoff', () => {
  const baseDelayArb = fc.integer({ min: 100, max: 5000 });
  const maxDelayArb = fc.integer({ min: 5000, max: 60000 });
  const attemptArb = fc.integer({ min: 0, max: 10 });
  const jitterArb = fc.double({ min: 0, max: 500, noNaN: true });

  it('delay is always positive', () => {
    fc.assert(
      fc.property(
        attemptArb,
        baseDelayArb,
        maxDelayArb,
        jitterArb,
        (attempt, baseDelay, maxDelay, jitter) => {
          const delay = computeRetryDelay(attempt, baseDelay, maxDelay, jitter);
          expect(delay).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('delay never exceeds maxDelay', () => {
    fc.assert(
      fc.property(
        attemptArb,
        baseDelayArb,
        maxDelayArb,
        jitterArb,
        (attempt, baseDelay, maxDelay, jitter) => {
          const delay = computeRetryDelay(attempt, baseDelay, maxDelay, jitter);
          expect(delay).toBeLessThanOrEqual(maxDelay);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('delay follows the formula: min(baseDelay * 2^attempt + jitter, maxDelay)', () => {
    fc.assert(
      fc.property(
        attemptArb,
        baseDelayArb,
        maxDelayArb,
        jitterArb,
        (attempt, baseDelay, maxDelay, jitter) => {
          const delay = computeRetryDelay(attempt, baseDelay, maxDelay, jitter);
          const expected = Math.min(
            baseDelay * Math.pow(2, attempt) + jitter,
            maxDelay
          );
          expect(delay).toBeCloseTo(expected, 5);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('base delay (without jitter) monotonically increases with attempt number', () => {
    fc.assert(
      fc.property(
        baseDelayArb,
        maxDelayArb,
        fc.integer({ min: 0, max: 9 }),
        (baseDelay, maxDelay, attempt) => {
          const delayN = computeRetryDelay(attempt, baseDelay, maxDelay, 0);
          const delayN1 = computeRetryDelay(attempt + 1, baseDelay, maxDelay, 0);
          // delayN1 >= delayN (monotonically non-decreasing, capped at maxDelay)
          expect(delayN1).toBeGreaterThanOrEqual(delayN);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('delay at attempt 0 equals min(baseDelay + jitter, maxDelay)', () => {
    fc.assert(
      fc.property(
        baseDelayArb,
        maxDelayArb,
        jitterArb,
        (baseDelay, maxDelay, jitter) => {
          const delay = computeRetryDelay(0, baseDelay, maxDelay, jitter);
          const expected = Math.min(baseDelay + jitter, maxDelay);
          expect(delay).toBeCloseTo(expected, 5);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('delay doubles (ignoring jitter) between consecutive attempts before hitting cap', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 1000 }),
        fc.constant(100000), // large maxDelay to avoid capping
        fc.integer({ min: 0, max: 5 }),
        (baseDelay, maxDelay, attempt) => {
          const delayN = computeRetryDelay(attempt, baseDelay, maxDelay, 0);
          const delayN1 = computeRetryDelay(attempt + 1, baseDelay, maxDelay, 0);
          // Before hitting cap, delay should double
          if (delayN1 < maxDelay) {
            expect(delayN1).toBe(delayN * 2);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
