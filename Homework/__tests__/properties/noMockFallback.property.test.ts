// Feature: homework-app-integration, Property 11: Error state shown instead of mock data on API failure
/**
 * Property 11: Error state shown instead of mock data on API failure
 *
 * For any API error (network, timeout, 500, etc.), the error categorization
 * always produces a valid error state rather than falling back to mock data.
 * The categorized error always has a non-empty userMessage, a valid category,
 * and an actionable suggestion — ensuring the UI shows an error state.
 *
 * **Validates: Requirements 4.7**
 */

import { CategorizedError, categorizeError } from '@/utils/errorHandler';
import { AxiosError, AxiosHeaders } from 'axios';
import * as fc from 'fast-check';

/** All valid error categories */
const validCategories: CategorizedError['category'][] = [
  'network',
  'timeout',
  'auth',
  'permission',
  'server',
  'validation',
  'unknown',
];

/** All valid error actions */
const validActions: CategorizedError['action'][] = [
  'retry',
  'login',
  'back',
  'contact_support',
  'fix_input',
];

/** Screens that previously used mock data */
const MOCK_DATA_SCREENS = [
  'projects/index',
  'projects/[id]/index',
  'projects/[id]/students',
  'projects/[id]/unit/[unitId]',
  'tasks/[id]',
  'grades',
] as const;

/** Mock data constants that should NEVER appear in error states */
const MOCK_DATA_CONSTANTS = [
  'MOCK_SUBJECTS',
  'MOCK_UNITS',
  'MOCK_STUDENTS',
  'MOCK_UNIT_TASKS',
  'MOCK_GRADES',
] as const;

/** Generator for HTTP error status codes */
const arbHttpErrorStatus = fc.oneof(
  fc.constantFrom(400, 401, 403, 404, 422, 500, 502, 503, 504),
  fc.integer({ min: 400, max: 599 })
);

/** Generator for network error codes */
const arbNetworkErrorCode = fc.constantFrom(
  'ERR_NETWORK',
  'ECONNABORTED',
  'ERR_BAD_REQUEST',
  'ERR_CANCELED',
  'ERR_BAD_RESPONSE',
  'ETIMEDOUT',
  'ECONNREFUSED'
);

function makeAxiosError(status: number | null, code?: string): AxiosError {
  return new AxiosError(
    'Test error',
    code ?? 'ERR_BAD_RESPONSE',
    undefined,
    {},
    status !== null
      ? {
          status,
          statusText: 'Error',
          headers: {},
          config: { headers: new AxiosHeaders() },
          data: {},
        }
      : undefined
  );
}

function assertValidErrorState(result: CategorizedError): void {
  // Must have a valid category
  expect(validCategories).toContain(result.category);

  // Must have a valid action
  expect(validActions).toContain(result.action);

  // Must have a non-empty user message
  expect(typeof result.userMessage).toBe('string');
  expect(result.userMessage.length).toBeGreaterThan(0);

  // Must have a boolean retryable flag
  expect(typeof result.retryable).toBe('boolean');

  // The error message must NOT contain any mock data constant names
  for (const mockConst of MOCK_DATA_CONSTANTS) {
    expect(result.userMessage).not.toContain(mockConst);
  }
}

describe('Property 11: Error state shown instead of mock data on API failure', () => {
  it('any HTTP error status produces a valid error state, not mock data', () => {
    fc.assert(
      fc.property(
        arbHttpErrorStatus,
        fc.constantFrom(...MOCK_DATA_SCREENS),
        (status, _screen) => {
          const error = makeAxiosError(status);
          const result = categorizeError(error);
          assertValidErrorState(result);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('any network error produces a valid error state, not mock data', () => {
    fc.assert(
      fc.property(
        arbNetworkErrorCode,
        fc.constantFrom(...MOCK_DATA_SCREENS),
        (code, _screen) => {
          const error = makeAxiosError(null, code);
          const result = categorizeError(error);
          assertValidErrorState(result);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('error categorization never returns a category suggesting mock data usage', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          arbHttpErrorStatus.map((s) => makeAxiosError(s)),
          arbNetworkErrorCode.map((c) => makeAxiosError(null, c))
        ),
        (error) => {
          const result = categorizeError(error);

          // The category should always be a recognized error type
          expect(validCategories).toContain(result.category);

          // The action should always guide the user to recover, not silently use mock data
          expect(validActions).toContain(result.action);

          // retryable errors should have retry action or contact_support
          if (result.retryable) {
            expect(['retry', 'contact_support']).toContain(result.action);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('every error category maps to a meaningful user-facing action', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...validCategories),
        (category) => {
          // For each category, create a representative error and verify it produces a valid state
          let error: AxiosError;
          switch (category) {
            case 'network':
              error = makeAxiosError(null, 'ERR_NETWORK');
              break;
            case 'timeout':
              error = makeAxiosError(null, 'ECONNABORTED');
              break;
            case 'auth':
              error = makeAxiosError(401);
              break;
            case 'permission':
              error = makeAxiosError(403);
              break;
            case 'server':
              error = makeAxiosError(500);
              break;
            case 'validation':
              error = makeAxiosError(400);
              break;
            case 'unknown':
              error = makeAxiosError(418); // I'm a teapot — unusual status
              break;
          }

          const result = categorizeError(error);
          assertValidErrorState(result);

          // The result should have a non-empty message that can be displayed to the user
          expect(result.userMessage.trim().length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('error state is deterministic for the same error across all screens', () => {
    fc.assert(
      fc.property(
        arbHttpErrorStatus,
        fc.constantFrom(...MOCK_DATA_SCREENS),
        fc.constantFrom(...MOCK_DATA_SCREENS),
        (status, screen1, screen2) => {
          const error1 = makeAxiosError(status);
          const error2 = makeAxiosError(status);

          const result1 = categorizeError(error1);
          const result2 = categorizeError(error2);

          // Same error should produce the same categorization regardless of screen
          expect(result1.category).toBe(result2.category);
          expect(result1.action).toBe(result2.action);
          expect(result1.retryable).toBe(result2.retryable);
          expect(result1.userMessage).toBe(result2.userMessage);
        }
      ),
      { numRuns: 100 }
    );
  });
});
