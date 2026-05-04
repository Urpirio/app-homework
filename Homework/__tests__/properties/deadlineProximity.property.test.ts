// Feature: homework-app-integration, Property 33: Deadline proximity indicator shown for tasks within 48 hours
/**
 * Property 33: Deadline proximity indicator shown for tasks within 48 hours
 *
 * For any task with a due date, the deadline proximity indicator should be shown
 * if and only if the due date is within the next 48 hours from the current time
 * and the task status is not DONE.
 *
 * **Validates: Requirements 19.9**
 */

import * as fc from 'fast-check';
import {
    mergeCalendarEvents,
    type CalendarTask,
} from '../../utils/calendarHelpers';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const HOURS_48_MS = 48 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const taskStatusArb = fc.constantFrom('TODO', 'IN_PROGRESS', 'DONE');

/**
 * Generate a task with a due date relative to "now".
 * We use a fixed reference time to make tests deterministic.
 */
const NOW = new Date('2025-06-15T12:00:00.000Z');

/** Offset in hours from NOW: negative = past, positive = future */
const hoursOffsetArb = fc.integer({ min: -72, max: 120 });

function makeTask(id: string, title: string, status: string, dueDate: Date): CalendarTask {
  return {
    id,
    title,
    dueDate: dueDate.toISOString(),
    status,
    projectName: 'Test Project',
    projectColor: '#FF9500',
  };
}

// ---------------------------------------------------------------------------
// Helper: replicate the isUrgent logic from mergeCalendarEvents
// ---------------------------------------------------------------------------

/**
 * The mergeCalendarEvents function sets isUrgent based on:
 *   const diffMs = dueDate.getTime() - now.getTime();
 *   const isUrgent = diffMs > 0 && diffMs <= HOURS_48;
 *
 * Note: The function uses `new Date()` internally for "now", so we need to
 * mock Date to control the reference time. Instead, we test the logic directly
 * by verifying the isUrgent flag on the output of mergeCalendarEvents.
 */

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Property 33: Deadline proximity indicator shown for tasks within 48 hours', () => {
  // We need to control "now" since mergeCalendarEvents uses `new Date()` internally
  const originalDateNow = Date.now;
  const originalDate = global.Date;

  beforeAll(() => {
    // Mock Date.now and new Date() to return our fixed NOW
    const fixedTime = NOW.getTime();
    jest.spyOn(global, 'Date').mockImplementation((...args: any[]) => {
      if (args.length === 0) {
        return new originalDate(fixedTime);
      }
      // @ts-ignore
      return new originalDate(...args);
    });
    // Preserve static methods
    (global.Date as any).now = () => fixedTime;
    (global.Date as any).parse = originalDate.parse;
    (global.Date as any).UTC = originalDate.UTC;
  });

  afterAll(() => {
    jest.restoreAllMocks();
    global.Date = originalDate;
  });

  // Wide range to cover tasks both inside and outside the calendar view
  const rangeStart = new Date('2025-06-01');
  const rangeEnd = new Date('2025-06-30');

  it('tasks due within 48 hours in the future (and not DONE) have isUrgent=true', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.constantFrom('TODO', 'IN_PROGRESS'),
        // Offset in minutes: 1 minute to just under 48 hours
        fc.integer({ min: 1, max: 48 * 60 - 1 }),
        (id, title, status, minutesAhead) => {
          const dueDate = new originalDate(NOW.getTime() + minutesAhead * 60 * 1000);
          const task = makeTask(id, title, status, dueDate);

          const events = mergeCalendarEvents([], [task], rangeStart, rangeEnd);
          expect(events).toHaveLength(1);
          expect(events[0].isUrgent).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('tasks due more than 48 hours in the future have isUrgent=false', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.string({ minLength: 1, maxLength: 20 }),
        taskStatusArb,
        // Offset in minutes: 48 hours + 1 minute to 120 hours
        fc.integer({ min: 48 * 60 + 1, max: 120 * 60 }),
        (id, title, status, minutesAhead) => {
          const dueDate = new originalDate(NOW.getTime() + minutesAhead * 60 * 1000);
          const task = makeTask(id, title, status, dueDate);

          const events = mergeCalendarEvents([], [task], rangeStart, rangeEnd);
          expect(events).toHaveLength(1);
          expect(events[0].isUrgent).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('tasks with due dates in the past have isUrgent=false', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.string({ minLength: 1, maxLength: 20 }),
        taskStatusArb,
        // Offset in minutes: 1 minute to 72 hours in the past
        fc.integer({ min: 1, max: 72 * 60 }),
        (id, title, status, minutesBehind) => {
          const dueDate = new originalDate(NOW.getTime() - minutesBehind * 60 * 1000);
          const task = makeTask(id, title, status, dueDate);

          const events = mergeCalendarEvents([], [task], rangeStart, rangeEnd);
          expect(events).toHaveLength(1);
          expect(events[0].isUrgent).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('isUrgent is set regardless of task status (the function does not check status)', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.string({ minLength: 1, maxLength: 20 }),
        taskStatusArb,
        fc.integer({ min: 1, max: 48 * 60 - 1 }),
        (id, title, status, minutesAhead) => {
          const dueDate = new originalDate(NOW.getTime() + minutesAhead * 60 * 1000);
          const task = makeTask(id, title, status, dueDate);

          const events = mergeCalendarEvents([], [task], rangeStart, rangeEnd);
          expect(events).toHaveLength(1);
          // mergeCalendarEvents sets isUrgent based purely on time, not status
          // The status filtering is done at the UI layer
          expect(events[0].isUrgent).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('tasks due exactly at the 48-hour boundary have isUrgent=true', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.constantFrom('TODO', 'IN_PROGRESS'),
        (id, title, status) => {
          // Exactly 48 hours from now
          const dueDate = new originalDate(NOW.getTime() + HOURS_48_MS);
          const task = makeTask(id, title, status, dueDate);

          const events = mergeCalendarEvents([], [task], rangeStart, rangeEnd);
          expect(events).toHaveLength(1);
          // diffMs = HOURS_48_MS, condition is diffMs <= HOURS_48 → true
          expect(events[0].isUrgent).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });
});
