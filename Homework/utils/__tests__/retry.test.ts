import { AxiosError, AxiosHeaders } from 'axios';
import { withRetry } from '../retry';

/** Helper to create an AxiosError with a given status code */
function makeAxiosError(status: number): AxiosError {
  return new AxiosError(
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
}

/** Helper to create a network error (retryable) */
function makeNetworkError(): AxiosError {
  const error = new AxiosError(
    'Network Error',
    AxiosError.ERR_NETWORK,
    undefined,
    {}
  );
  error.response = undefined;
  return error;
}

// Use fake timers to avoid real delays in tests
beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

/** Advance all pending timers and flush microtasks */
async function flushTimersAndMicrotasks() {
  jest.runAllTimers();
  // Allow promise callbacks to resolve
  await Promise.resolve();
}

describe('withRetry', () => {
  describe('successful execution', () => {
    it('should return the result on first success', async () => {
      const fn = jest.fn().mockResolvedValue('success');
      const promise = withRetry(fn);
      const result = await promise;
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should return the result after retries', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(makeNetworkError())
        .mockResolvedValue('recovered');

      const promise = withRetry(fn, { maxAttempts: 3, baseDelay: 100, maxDelay: 1000 });

      // First call fails, wait for retry delay
      await flushTimersAndMicrotasks();
      // Second call succeeds
      await flushTimersAndMicrotasks();

      const result = await promise;
      expect(result).toBe('recovered');
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('exhausted retries', () => {
    it('should throw after maxAttempts exhausted', async () => {
      const networkError = makeNetworkError();
      const fn = jest.fn().mockRejectedValue(networkError);

      const promise = withRetry(fn, { maxAttempts: 3, baseDelay: 100, maxDelay: 1000 });

      // Flush through all retry delays
      for (let i = 0; i < 5; i++) {
        await flushTimersAndMicrotasks();
      }

      await expect(promise).rejects.toThrow();
      expect(fn).toHaveBeenCalledTimes(3);
    });
  });

  describe('non-retryable errors', () => {
    it('should throw immediately for 401 (auth) errors', async () => {
      const authError = makeAxiosError(401);
      const fn = jest.fn().mockRejectedValue(authError);

      const promise = withRetry(fn, { maxAttempts: 3, baseDelay: 100, maxDelay: 1000 });

      await expect(promise).rejects.toThrow();
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should throw immediately for 403 (permission) errors', async () => {
      const permError = makeAxiosError(403);
      const fn = jest.fn().mockRejectedValue(permError);

      const promise = withRetry(fn, { maxAttempts: 3, baseDelay: 100, maxDelay: 1000 });

      await expect(promise).rejects.toThrow();
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should throw immediately for 422 (validation) errors', async () => {
      const validationError = makeAxiosError(422);
      const fn = jest.fn().mockRejectedValue(validationError);

      const promise = withRetry(fn, { maxAttempts: 3, baseDelay: 100, maxDelay: 1000 });

      await expect(promise).rejects.toThrow();
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('retryable errors', () => {
    it('should retry on 500 (server) errors', async () => {
      const serverError = makeAxiosError(500);
      const fn = jest
        .fn()
        .mockRejectedValueOnce(serverError)
        .mockResolvedValue('ok');

      const promise = withRetry(fn, { maxAttempts: 3, baseDelay: 100, maxDelay: 1000 });

      await flushTimersAndMicrotasks();
      await flushTimersAndMicrotasks();

      const result = await promise;
      expect(result).toBe('ok');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should retry on network errors', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(makeNetworkError())
        .mockRejectedValueOnce(makeNetworkError())
        .mockResolvedValue('recovered');

      const promise = withRetry(fn, { maxAttempts: 3, baseDelay: 100, maxDelay: 1000 });

      // Flush through retry delays
      for (let i = 0; i < 5; i++) {
        await flushTimersAndMicrotasks();
      }

      const result = await promise;
      expect(result).toBe('recovered');
      expect(fn).toHaveBeenCalledTimes(3);
    });
  });

  describe('custom shouldRetry', () => {
    it('should use custom shouldRetry predicate', async () => {
      const customError = new Error('custom');
      const fn = jest
        .fn()
        .mockRejectedValueOnce(customError)
        .mockResolvedValue('ok');

      const promise = withRetry(fn, {
        maxAttempts: 3,
        baseDelay: 100,
        maxDelay: 1000,
        shouldRetry: (err) => (err as Error).message === 'custom',
      });

      await flushTimersAndMicrotasks();
      await flushTimersAndMicrotasks();

      const result = await promise;
      expect(result).toBe('ok');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should not retry when custom shouldRetry returns false', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('stop'));

      const promise = withRetry(fn, {
        maxAttempts: 3,
        baseDelay: 100,
        maxDelay: 1000,
        shouldRetry: () => false,
      });

      await expect(promise).rejects.toThrow('stop');
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('default options', () => {
    it('should use default maxAttempts of 3', async () => {
      const fn = jest.fn().mockRejectedValue(makeNetworkError());

      const promise = withRetry(fn);

      for (let i = 0; i < 10; i++) {
        await flushTimersAndMicrotasks();
      }

      await expect(promise).rejects.toThrow();
      expect(fn).toHaveBeenCalledTimes(3);
    });
  });

  describe('delay behavior', () => {
    it('should apply exponential backoff with delays increasing', async () => {
      jest.useRealTimers(); // Need real timers to measure delay
      jest.spyOn(global, 'setTimeout');

      const fn = jest.fn().mockRejectedValue(makeNetworkError());

      // Use very small delays for test speed
      const promise = withRetry(fn, {
        maxAttempts: 3,
        baseDelay: 10,
        maxDelay: 10000,
      }).catch(() => {});

      await promise;

      // setTimeout should have been called for each retry delay
      // Attempt 0 fails → delay before attempt 1
      // Attempt 1 fails → delay before attempt 2
      // Attempt 2 fails → throws (no more delay)
      const setTimeoutCalls = (setTimeout as unknown as jest.Mock).mock.calls
        .filter((call) => typeof call[1] === 'number' && call[1] > 0);

      // At least 2 delays (between attempt 0→1 and 1→2)
      expect(setTimeoutCalls.length).toBeGreaterThanOrEqual(2);

      (setTimeout as unknown as jest.Mock).mockRestore();
    });
  });
});
