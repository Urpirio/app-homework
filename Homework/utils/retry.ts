import { AxiosError } from 'axios';
import { categorizeError } from './errorHandler';

export interface RetryOptions {
  /** Maximum number of attempts (including the first). Default: 3 */
  maxAttempts?: number;
  /** Base delay in ms before the first retry. Default: 1000 */
  baseDelay?: number;
  /** Maximum delay in ms between retries. Default: 10000 */
  maxDelay?: number;
  /** Custom predicate to decide if an error is retryable. Falls back to categorizeError().retryable */
  shouldRetry?: (error: unknown) => boolean;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  shouldRetry: (error: unknown) => {
    try {
      return categorizeError(error as AxiosError).retryable;
    } catch {
      return false;
    }
  },
};

/**
 * Retries an async function with exponential backoff and jitter.
 *
 * Delay formula: min(baseDelay * 2^attempt + jitter, maxDelay)
 * where jitter is a random value in [0, 500) ms.
 *
 * @param fn - The async function to execute
 * @param options - Retry configuration
 * @returns The resolved value of fn
 * @throws The last error if all attempts fail or the error is not retryable
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: RetryOptions
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const maxRetries = opts.maxAttempts - 1; // maxAttempts includes the initial attempt

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const isLastAttempt = attempt === maxRetries;
      const isRetryable = opts.shouldRetry(error);

      if (isLastAttempt || !isRetryable) {
        throw error;
      }

      const delay = Math.min(
        opts.baseDelay * Math.pow(2, attempt) + Math.random() * 500,
        opts.maxDelay
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // Unreachable — the loop always returns or throws
  throw new Error('Unreachable');
}
