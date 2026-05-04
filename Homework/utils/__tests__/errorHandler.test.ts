import { AxiosError, AxiosHeaders } from 'axios';
import { CategorizedError, categorizeError } from '../errorHandler';

/** Helper to create an AxiosError with a given status code */
function makeAxiosError(status: number): AxiosError {
  const error = new AxiosError(
    `Request failed with status code ${status}`,
    AxiosError.ERR_BAD_RESPONSE,
    undefined,
    {},
    {
      status,
      statusText: '',
      headers: {},
      config: { headers: new AxiosHeaders() },
      data: {},
    }
  );
  return error;
}

/** Helper to create a network error (no response) */
function makeNetworkError(): AxiosError {
  const error = new AxiosError(
    'Network Error',
    AxiosError.ERR_NETWORK,
    undefined,
    {}
  );
  // Ensure no response is set
  error.response = undefined;
  return error;
}

/** Helper to create a timeout error */
function makeTimeoutError(): AxiosError {
  const error = new AxiosError(
    'timeout of 5000ms exceeded',
    'ECONNABORTED',
    undefined,
    {}
  );
  error.response = undefined;
  return error;
}

const VALID_CATEGORIES: CategorizedError['category'][] = [
  'network',
  'timeout',
  'auth',
  'permission',
  'server',
  'validation',
  'unknown',
];

const VALID_ACTIONS: CategorizedError['action'][] = [
  'retry',
  'login',
  'back',
  'contact_support',
  'fix_input',
];

describe('categorizeError', () => {
  describe('network errors (no response)', () => {
    it('should categorize a network error as "network"', () => {
      const result = categorizeError(makeNetworkError());
      expect(result.category).toBe('network');
      expect(result.retryable).toBe(true);
      expect(result.action).toBe('retry');
      expect(result.userMessage).toBeTruthy();
    });
  });

  describe('timeout errors', () => {
    it('should categorize ECONNABORTED as "timeout"', () => {
      const result = categorizeError(makeTimeoutError());
      expect(result.category).toBe('timeout');
      expect(result.retryable).toBe(true);
      expect(result.action).toBe('retry');
      expect(result.userMessage).toBeTruthy();
    });
  });

  describe('auth errors (401)', () => {
    it('should categorize 401 as "auth"', () => {
      const result = categorizeError(makeAxiosError(401));
      expect(result.category).toBe('auth');
      expect(result.retryable).toBe(false);
      expect(result.action).toBe('login');
    });
  });

  describe('permission errors (403)', () => {
    it('should categorize 403 as "permission"', () => {
      const result = categorizeError(makeAxiosError(403));
      expect(result.category).toBe('permission');
      expect(result.retryable).toBe(false);
      expect(result.action).toBe('back');
    });
  });

  describe('validation errors (400, 422)', () => {
    it('should categorize 400 as "validation"', () => {
      const result = categorizeError(makeAxiosError(400));
      expect(result.category).toBe('validation');
      expect(result.retryable).toBe(false);
      expect(result.action).toBe('fix_input');
    });

    it('should categorize 422 as "validation"', () => {
      const result = categorizeError(makeAxiosError(422));
      expect(result.category).toBe('validation');
      expect(result.retryable).toBe(false);
      expect(result.action).toBe('fix_input');
    });
  });

  describe('server errors (500+)', () => {
    it('should categorize 500 as "server"', () => {
      const result = categorizeError(makeAxiosError(500));
      expect(result.category).toBe('server');
      expect(result.retryable).toBe(true);
      expect(result.action).toBe('contact_support');
    });

    it('should categorize 502 as "server"', () => {
      const result = categorizeError(makeAxiosError(502));
      expect(result.category).toBe('server');
      expect(result.retryable).toBe(true);
    });

    it('should categorize 503 as "server"', () => {
      const result = categorizeError(makeAxiosError(503));
      expect(result.category).toBe('server');
      expect(result.retryable).toBe(true);
    });
  });

  describe('unknown errors', () => {
    it('should categorize 404 as "unknown"', () => {
      const result = categorizeError(makeAxiosError(404));
      expect(result.category).toBe('unknown');
      expect(result.retryable).toBe(false);
      expect(result.action).toBe('contact_support');
    });

    it('should categorize 429 as "unknown"', () => {
      const result = categorizeError(makeAxiosError(429));
      expect(result.category).toBe('unknown');
      expect(result.retryable).toBe(false);
    });
  });

  describe('output structure', () => {
    const testCases = [
      makeNetworkError(),
      makeTimeoutError(),
      makeAxiosError(400),
      makeAxiosError(401),
      makeAxiosError(403),
      makeAxiosError(422),
      makeAxiosError(500),
      makeAxiosError(502),
      makeAxiosError(404),
    ];

    it.each(testCases)(
      'should always return a valid CategorizedError structure',
      (error) => {
        const result = categorizeError(error);
        expect(VALID_CATEGORIES).toContain(result.category);
        expect(VALID_ACTIONS).toContain(result.action);
        expect(typeof result.retryable).toBe('boolean');
        expect(typeof result.userMessage).toBe('string');
        expect(result.userMessage.length).toBeGreaterThan(0);
      }
    );
  });

  describe('determinism', () => {
    it('should return the same result for the same error', () => {
      const error = makeAxiosError(500);
      const result1 = categorizeError(error);
      const result2 = categorizeError(error);
      expect(result1).toEqual(result2);
    });
  });
});
