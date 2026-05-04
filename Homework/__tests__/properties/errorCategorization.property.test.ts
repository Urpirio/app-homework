// Feature: homework-app-integration, Property 10: API error categorization is exhaustive and deterministic
/**
 * Property 10: API error categorization is exhaustive and deterministic
 *
 * For any AxiosError (with or without response, with any HTTP status code),
 * the categorizeError function should return a valid CategorizedError with
 * a non-empty userMessage, a valid category from the enum, and a valid action.
 * The same error input should always produce the same categorization.
 *
 * **Validates: Requirements 9.3**
 */

import { CategorizedError, categorizeError } from '@/utils/errorHandler';
import { AxiosError, AxiosHeaders } from 'axios';
import * as fc from 'fast-check';

const validCategories = [
  'network',
  'timeout',
  'auth',
  'permission',
  'server',
  'validation',
  'unknown',
] as const;

const validActions = [
  'retry',
  'login',
  'back',
  'contact_support',
  'fix_input',
] as const;

function makeAxiosError(
  status: number | null,
  code?: string
): AxiosError {
  const error = new AxiosError(
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
  return error;
}

function assertValidCategorizedError(result: CategorizedError): void {
  expect(validCategories).toContain(result.category);
  expect(validActions).toContain(result.action);
  expect(typeof result.userMessage).toBe('string');
  expect(result.userMessage.length).toBeGreaterThan(0);
  expect(typeof result.retryable).toBe('boolean');
}

describe('Property 10: API error categorization is exhaustive and deterministic', () => {
  it('returns a valid CategorizedError for any HTTP status code', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 599 }),
        (status) => {
          const error = makeAxiosError(status);
          const result = categorizeError(error);
          assertValidCategorizedError(result);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('returns a valid CategorizedError for network errors (no response)', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('ERR_NETWORK', 'ERR_BAD_REQUEST', 'ERR_CANCELED', undefined),
        (code) => {
          const error = makeAxiosError(null, code);
          const result = categorizeError(error);
          assertValidCategorizedError(result);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('returns timeout category for ECONNABORTED errors', () => {
    const error = makeAxiosError(null, 'ECONNABORTED');
    const result = categorizeError(error);
    expect(result.category).toBe('timeout');
    expect(result.retryable).toBe(true);
  });

  it('returns network category for errors without response and without ECONNABORTED', () => {
    const error = makeAxiosError(null, 'ERR_NETWORK');
    const result = categorizeError(error);
    expect(result.category).toBe('network');
    expect(result.retryable).toBe(true);
  });

  it('is deterministic — same error always produces same categorization', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 599 }),
        (status) => {
          const error1 = makeAxiosError(status);
          const error2 = makeAxiosError(status);
          const result1 = categorizeError(error1);
          const result2 = categorizeError(error2);
          expect(result1).toEqual(result2);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('categorizes specific status codes correctly', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(401, 403, 400, 422, 500, 502, 503),
        (status) => {
          const error = makeAxiosError(status);
          const result = categorizeError(error);
          assertValidCategorizedError(result);

          if (status === 401) expect(result.category).toBe('auth');
          if (status === 403) expect(result.category).toBe('permission');
          if (status === 400 || status === 422) expect(result.category).toBe('validation');
          if (status >= 500) expect(result.category).toBe('server');
        }
      ),
      { numRuns: 100 }
    );
  });
});
