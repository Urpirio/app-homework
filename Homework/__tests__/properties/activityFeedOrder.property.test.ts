// Feature: homework-app-integration, Property 40: Activity feed is sorted by timestamp descending
/**
 * Property 40: Activity feed is sorted by timestamp descending
 *
 * For any set of activity events, the activity feed should display them
 * in strictly descending order of their createdAt timestamps. No event
 * should appear before a more recent event.
 *
 * **Validates: Requirements 14.5**
 */

import {
    isSortedDescending,
    sortActivitiesByTimestamp,
    type ActivityEvent,
} from '@/utils/activityFeed';
import * as fc from 'fast-check';

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/** Generate a timestamp ISO string within a reasonable range */
const timestampArb = fc
  .integer({
    min: new Date('2024-01-01').getTime(),
    max: new Date('2025-12-31').getTime(),
  })
  .map((ts) => new Date(ts).toISOString());

/** Generate a single activity event */
const activityEventArb: fc.Arbitrary<ActivityEvent> = fc.record({
  id: fc.uuid(),
  description: fc.string({ minLength: 5, maxLength: 40 }),
  createdAt: timestampArb,
  userId: fc.option(fc.uuid(), { nil: undefined }),
  userName: fc.option(fc.string({ minLength: 2, maxLength: 15 }), { nil: undefined }),
  icon: fc.option(fc.constantFrom('edit', 'chart', 'user', 'bell', 'check'), { nil: undefined }),
  type: fc.option(
    fc.constantFrom('user_created', 'task_completed', 'grade_published', 'ticket_opened'),
    { nil: undefined },
  ),
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Property 40: Activity feed is sorted by timestamp descending', () => {
  it('sorted events are in descending order of createdAt', () => {
    fc.assert(
      fc.property(
        fc.array(activityEventArb, { minLength: 0, maxLength: 30 }),
        (events) => {
          const sorted = sortActivitiesByTimestamp(events);
          expect(isSortedDescending(sorted)).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('sorting preserves all events (no events lost or duplicated)', () => {
    fc.assert(
      fc.property(
        fc.array(activityEventArb, { minLength: 0, maxLength: 30 }),
        (events) => {
          const sorted = sortActivitiesByTimestamp(events);
          expect(sorted).toHaveLength(events.length);

          // Every original event should be present in the sorted result
          const sortedIds = new Set(sorted.map((e) => e.id));
          for (const event of events) {
            expect(sortedIds.has(event.id)).toBe(true);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('sorting does not mutate the original array', () => {
    fc.assert(
      fc.property(
        fc.array(activityEventArb, { minLength: 1, maxLength: 20 }),
        (events) => {
          const originalOrder = events.map((e) => e.id);
          sortActivitiesByTimestamp(events);
          const afterOrder = events.map((e) => e.id);
          expect(afterOrder).toEqual(originalOrder);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('sorting an already-sorted array is idempotent', () => {
    fc.assert(
      fc.property(
        fc.array(activityEventArb, { minLength: 0, maxLength: 20 }),
        (events) => {
          const sorted1 = sortActivitiesByTimestamp(events);
          const sorted2 = sortActivitiesByTimestamp(sorted1);
          expect(sorted2.map((e) => e.id)).toEqual(sorted1.map((e) => e.id));
        },
      ),
      { numRuns: 100 },
    );
  });

  it('single event is trivially sorted', () => {
    fc.assert(
      fc.property(activityEventArb, (event) => {
        const sorted = sortActivitiesByTimestamp([event]);
        expect(sorted).toHaveLength(1);
        expect(sorted[0]).toEqual(event);
        expect(isSortedDescending(sorted)).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  it('empty array is trivially sorted', () => {
    const sorted = sortActivitiesByTimestamp([]);
    expect(sorted).toHaveLength(0);
    expect(isSortedDescending(sorted)).toBe(true);
  });

  it('the first element has the most recent timestamp', () => {
    fc.assert(
      fc.property(
        fc.array(activityEventArb, { minLength: 2, maxLength: 20 }),
        (events) => {
          const sorted = sortActivitiesByTimestamp(events);
          const firstTime = new Date(sorted[0].createdAt).getTime();

          for (let i = 1; i < sorted.length; i++) {
            const currentTime = new Date(sorted[i].createdAt).getTime();
            expect(firstTime).toBeGreaterThanOrEqual(currentTime);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
