// Feature: homework-app-integration, Property 28: Offline queue processes actions in FIFO order on reconnection
/**
 * Property 28: Offline queue processes actions in FIFO order on reconnection
 *
 * For any sequence of N actions queued while offline, when connectivity
 * is restored, the actions should be processed in the exact order they
 * were queued (FIFO). Each successfully processed action should be removed
 * from the queue. Failed actions should remain with incremented retry count.
 *
 * We test the enqueue and processQueue functions from utils/offlineQueue.ts.
 *
 * **Validates: Requirements 10.3, 10.7**
 */

import * as fc from 'fast-check';

// Mock AsyncStorage
let mockStorage: Record<string, string> = {};
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn((key: string) => Promise.resolve(mockStorage[key] ?? null)),
  setItem: jest.fn((key: string, value: string) => {
    mockStorage[key] = value;
    return Promise.resolve();
  }),
  removeItem: jest.fn((key: string) => {
    delete mockStorage[key];
    return Promise.resolve();
  }),
}));

// Mock the api module to control success/failure
const mockApiRequest = jest.fn();
jest.mock('@/utils/api', () => ({
  __esModule: true,
  default: {
    request: (...args: unknown[]) => mockApiRequest(...args),
  },
}));

// Mock withRetry to just call the function directly (no actual retries)
jest.mock('@/utils/retry', () => ({
  withRetry: (fn: () => Promise<unknown>) => fn(),
}));

import { enqueue, getQueue, processQueue } from '@/utils/offlineQueue';

beforeEach(async () => {
  // Clear mock storage completely
  mockStorage = {};
  mockApiRequest.mockReset();
});

describe('Property 28: Offline queue processes actions in FIFO order on reconnection', () => {
  it('enqueued actions maintain their insertion order', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            type: fc.constantFrom('POST' as const, 'PATCH' as const, 'PUT' as const),
            url: fc.integer({ min: 1, max: 9999 }).map((n) => `/api/endpoint-${n}`),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (actions) => {
          // Clear queue for this iteration
          mockStorage = {};

          // Enqueue all actions
          const enqueued = [];
          for (const action of actions) {
            const result = await enqueue(action);
            enqueued.push(result);
          }

          // Read back the queue
          const queue = await getQueue();

          // Queue should have the same number of items
          expect(queue).toHaveLength(actions.length);

          // Items should be in insertion order (FIFO)
          for (let i = 0; i < actions.length; i++) {
            expect(queue[i].url).toBe(actions[i].url);
            expect(queue[i].type).toBe(actions[i].type);
            expect(queue[i].retryCount).toBe(0);
          }

          // Each item should have a unique ID
          const ids = queue.map((q) => q.id);
          expect(new Set(ids).size).toBe(ids.length);

          // Each item should have a valid createdAt timestamp
          queue.forEach((item) => {
            expect(new Date(item.createdAt).getTime()).not.toBeNaN();
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('processQueue processes actions in FIFO order when all succeed', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            type: fc.constantFrom('POST' as const, 'PATCH' as const, 'PUT' as const),
            url: fc.integer({ min: 1, max: 9999 }).map((n) => `/api/action-${n}`),
          }),
          { minLength: 1, maxLength: 8 }
        ),
        async (actions) => {
          // Clear queue for this iteration
          mockStorage = {};
          mockApiRequest.mockReset();

          // Enqueue all actions
          for (const action of actions) {
            await enqueue(action);
          }

          // Mock API to succeed and track call order
          const callOrder: string[] = [];
          mockApiRequest.mockImplementation((config: { url: string }) => {
            callOrder.push(config.url);
            return Promise.resolve({ data: {} });
          });

          // Process queue
          const processed = await processQueue();

          // All actions should be processed
          expect(processed).toBe(actions.length);

          // Call order should match insertion order (FIFO)
          expect(callOrder).toHaveLength(actions.length);
          for (let i = 0; i < actions.length; i++) {
            expect(callOrder[i]).toBe(actions[i].url);
          }

          // Queue should be empty after successful processing
          const remaining = await getQueue();
          expect(remaining).toHaveLength(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('failed actions remain in queue with incremented retry count', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 2, max: 8 }),
        async (totalActions) => {
          // Always fail at index 1 (second action) so we can verify
          // the first succeeds and the rest remain
          const failAtIndex = 1;

          // Clear queue for this iteration
          mockStorage = {};
          mockApiRequest.mockReset();

          // Enqueue actions
          for (let i = 0; i < totalActions; i++) {
            await enqueue({
              type: 'POST',
              url: `/api/action-${i}`,
              data: { index: i },
            });
          }

          // Mock API: succeed for first action, fail at failAtIndex
          let callCount = 0;
          mockApiRequest.mockImplementation(() => {
            const currentCall = callCount++;
            if (currentCall === failAtIndex) {
              return Promise.reject(new Error('Network error'));
            }
            return Promise.resolve({ data: {} });
          });

          // Process queue
          const processed = await processQueue();

          // Should have processed up to (but not including) the failed action
          expect(processed).toBe(failAtIndex);

          // Remaining queue should contain the failed action and all after it
          const remaining = await getQueue();
          expect(remaining).toHaveLength(totalActions - failAtIndex);

          // The first remaining action should have retryCount incremented
          expect(remaining[0].retryCount).toBe(1);
          expect(remaining[0].url).toBe(`/api/action-${failAtIndex}`);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('empty queue processing returns 0 and is a no-op', async () => {
    await fc.assert(
      fc.asyncProperty(fc.constant(null), async () => {
        mockStorage = {};
        mockApiRequest.mockReset();

        const processed = await processQueue();
        expect(processed).toBe(0);

        const queue = await getQueue();
        expect(queue).toHaveLength(0);

        // API should not have been called
        expect(mockApiRequest).not.toHaveBeenCalled();
      }),
      { numRuns: 100 }
    );
  });

  it('each enqueued action gets a unique ID and valid timestamp', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 2, max: 15 }),
        async (count) => {
          mockStorage = {};

          for (let i = 0; i < count; i++) {
            await enqueue({
              type: 'POST',
              url: `/api/item-${i}`,
            });
          }

          const queue = await getQueue();
          const ids = queue.map((q) => q.id);
          const timestamps = queue.map((q) => new Date(q.createdAt).getTime());

          // All IDs unique
          expect(new Set(ids).size).toBe(count);

          // All timestamps valid and non-decreasing (insertion order)
          timestamps.forEach((ts) => expect(ts).not.toBeNaN());
          for (let i = 1; i < timestamps.length; i++) {
            expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i - 1]);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
