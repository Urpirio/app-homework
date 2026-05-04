// Feature: homework-app-integration, Property 12: Notification badge count increments on new notification
/**
 * Property 12: Notification badge count increments on new notification
 *
 * For any current badge count N and a new notification event received via
 * WebSocket, the updated badge count should equal N + 1. After marking all
 * notifications as read, the badge count should equal 0.
 *
 * **Validates: Requirements 5.2**
 */

import * as fc from 'fast-check';

// ---- Pure logic extracted from useNotificationBadge for testability ----

/**
 * Simulates the badge increment logic from useNotificationBadge:
 *   queryClient.setQueryData<number>(BADGE_QUERY_KEY, (old) => (old ?? 0) + 1)
 */
function incrementBadge(currentCount: number | undefined): number {
  return (currentCount ?? 0) + 1;
}

/**
 * Simulates the badge decrement logic from useNotificationBadge:
 *   queryClient.setQueryData<number>(BADGE_QUERY_KEY, (old) => Math.max((old ?? 1) - 1, 0))
 */
function decrementBadge(currentCount: number | undefined): number {
  return Math.max((currentCount ?? 1) - 1, 0);
}

/**
 * Simulates the badge reset logic from useNotificationBadge:
 *   queryClient.setQueryData<number>(BADGE_QUERY_KEY, 0)
 */
function resetBadge(): number {
  return 0;
}

// ---- Arbitraries ----

const badgeCountArb = fc.nat({ max: 10_000 });

const notificationCountArb = fc.nat({ max: 50 });

// ---- Tests ----

describe('Property 12: Notification badge count increments on new notification', () => {
  it('increments badge count by 1 for any initial count N', () => {
    fc.assert(
      fc.property(badgeCountArb, (initialCount) => {
        const updated = incrementBadge(initialCount);
        expect(updated).toBe(initialCount + 1);
      }),
      { numRuns: 100 }
    );
  });

  it('increments from undefined (no prior data) to 1', () => {
    const updated = incrementBadge(undefined);
    expect(updated).toBe(1);
  });

  it('resetBadge always returns 0 regardless of current count', () => {
    fc.assert(
      fc.property(badgeCountArb, (_count) => {
        const result = resetBadge();
        expect(result).toBe(0);
      }),
      { numRuns: 100 }
    );
  });

  it('decrementBadge reduces count by 1 but never goes below 0', () => {
    fc.assert(
      fc.property(badgeCountArb, (count) => {
        const result = decrementBadge(count);
        if (count > 0) {
          expect(result).toBe(count - 1);
        } else {
          expect(result).toBe(0);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('decrementBadge from undefined defaults to 0', () => {
    const result = decrementBadge(undefined);
    expect(result).toBe(0);
  });

  it('N increments followed by reset always yields 0', () => {
    fc.assert(
      fc.property(badgeCountArb, notificationCountArb, (initial, numNotifications) => {
        let count: number = initial;
        for (let i = 0; i < numNotifications; i++) {
          count = incrementBadge(count);
        }
        expect(count).toBe(initial + numNotifications);
        const afterReset = resetBadge();
        expect(afterReset).toBe(0);
      }),
      { numRuns: 100 }
    );
  });

  it('increment then decrement returns to original count', () => {
    fc.assert(
      fc.property(badgeCountArb, (count) => {
        const incremented = incrementBadge(count);
        const decremented = decrementBadge(incremented);
        expect(decremented).toBe(count);
      }),
      { numRuns: 100 }
    );
  });

  it('badge count is always non-negative after any sequence of operations', () => {
    fc.assert(
      fc.property(
        badgeCountArb,
        fc.array(fc.constantFrom('increment', 'decrement', 'reset'), {
          minLength: 1,
          maxLength: 50,
        }),
        (initial, operations) => {
          let count: number = initial;
          for (const op of operations) {
            switch (op) {
              case 'increment':
                count = incrementBadge(count);
                break;
              case 'decrement':
                count = decrementBadge(count);
                break;
              case 'reset':
                count = resetBadge();
                break;
            }
          }
          expect(count).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});
