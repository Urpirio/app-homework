// Feature: homework-app-integration, Property 9: Calendar event merge preserves all sources
/**
 * Property 9: Calendar event merge preserves all sources
 *
 * For any set of schedule entries and task deadlines for a user, the merged
 * calendar event list should contain exactly one event for each schedule entry
 * (expanded per matching day in the range) and one event for each task with a
 * due date, with no events lost or duplicated.
 *
 * **Validates: Requirements 3.13, 19.2**
 */

import * as fc from 'fast-check';
import type { Schedule } from '../../types/schedule';
import {
    mergeCalendarEvents,
    SCHEDULE_DAY_MAP,
    toDateKey,
    type CalendarTask,
} from '../../utils/calendarHelpers';

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const dayNames = Object.keys(SCHEDULE_DAY_MAP);

const dayArb = fc.constantFrom(...dayNames);

const timeArb = fc.tuple(
  fc.integer({ min: 0, max: 23 }),
  fc.integer({ min: 0, max: 59 }),
).map(([h, m]) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);

const scheduleArb: fc.Arbitrary<Schedule> = fc.record({
  id: fc.uuid(),
  day: dayArb,
  startTime: timeArb,
  endTime: timeArb,
  room: fc.option(fc.string({ minLength: 1, maxLength: 10 }), { nil: undefined }),
  projectId: fc.uuid(),
  institutionId: fc.uuid(),
  project: fc.option(
    fc.record({
      id: fc.uuid(),
      name: fc.string({ minLength: 1, maxLength: 20 }),
      color: fc.option(fc.stringMatching(/^#[0-9a-f]{6}$/), { nil: undefined }),
    }),
    { nil: undefined },
  ),
});

const calendarTaskArb: fc.Arbitrary<CalendarTask> = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 30 }),
  dueDate: fc.integer({
    min: new Date('2025-01-01').getTime(),
    max: new Date('2025-12-31').getTime(),
  }).map(ts => new Date(ts).toISOString()),
  status: fc.constantFrom('TODO', 'IN_PROGRESS', 'DONE'),
  projectName: fc.string({ minLength: 1, maxLength: 20 }),
  projectColor: fc.stringMatching(/^#[0-9a-f]{6}$/),
});

// Use a fixed 7-day range for predictable schedule expansion
const rangeStart = new Date('2025-06-02'); // Monday
const rangeEnd = new Date('2025-06-08');   // Sunday

/** Count how many times a given day name appears in the date range */
function countDayOccurrences(dayName: string, start: Date, end: Date): number {
  const dayIndex = SCHEDULE_DAY_MAP[dayName];
  if (dayIndex === undefined) return 0;
  let count = 0;
  const cursor = new Date(start);
  while (cursor <= end) {
    if (cursor.getDay() === dayIndex) count++;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Property 9: Calendar event merge preserves all sources', () => {
  it('merged events contain one event per task with a due date', () => {
    fc.assert(
      fc.property(
        fc.array(calendarTaskArb, { minLength: 0, maxLength: 15 }),
        (tasks) => {
          const events = mergeCalendarEvents([], tasks, rangeStart, rangeEnd);
          const taskEvents = events.filter(e => e.type === 'deadline');
          // Each task with a dueDate produces exactly one event
          const tasksWithDueDate = tasks.filter(t => !!t.dueDate);
          expect(taskEvents).toHaveLength(tasksWithDueDate.length);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('merged events contain correct number of schedule expansions per day in range', () => {
    fc.assert(
      fc.property(
        fc.array(scheduleArb, { minLength: 0, maxLength: 10 }),
        (schedules) => {
          const events = mergeCalendarEvents(schedules, [], rangeStart, rangeEnd);
          const scheduleEvents = events.filter(e => e.type === 'schedule');

          // Expected count: for each schedule, count how many times its day appears in range
          let expectedCount = 0;
          for (const s of schedules) {
            expectedCount += countDayOccurrences(s.day, rangeStart, rangeEnd);
          }

          expect(scheduleEvents).toHaveLength(expectedCount);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('no events are lost when merging both schedules and tasks', () => {
    fc.assert(
      fc.property(
        fc.array(scheduleArb, { minLength: 1, maxLength: 5 }),
        fc.array(calendarTaskArb, { minLength: 1, maxLength: 5 }),
        (schedules, tasks) => {
          const events = mergeCalendarEvents(schedules, tasks, rangeStart, rangeEnd);
          const scheduleEvents = events.filter(e => e.type === 'schedule');
          const taskEvents = events.filter(e => e.type === 'deadline');

          let expectedScheduleCount = 0;
          for (const s of schedules) {
            expectedScheduleCount += countDayOccurrences(s.day, rangeStart, rangeEnd);
          }

          expect(scheduleEvents).toHaveLength(expectedScheduleCount);
          expect(taskEvents).toHaveLength(tasks.filter(t => !!t.dueDate).length);
          expect(events).toHaveLength(expectedScheduleCount + tasks.filter(t => !!t.dueDate).length);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('all merged event IDs are unique (no duplicates)', () => {
    fc.assert(
      fc.property(
        fc.array(scheduleArb, { minLength: 0, maxLength: 8 }),
        fc.array(calendarTaskArb, { minLength: 0, maxLength: 8 }),
        (schedules, tasks) => {
          const events = mergeCalendarEvents(schedules, tasks, rangeStart, rangeEnd);
          const ids = events.map(e => e.id);
          const uniqueIds = new Set(ids);
          expect(uniqueIds.size).toBe(ids.length);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('schedule events preserve the original schedule data', () => {
    fc.assert(
      fc.property(
        scheduleArb,
        (schedule) => {
          const events = mergeCalendarEvents([schedule], [], rangeStart, rangeEnd);
          for (const event of events) {
            expect(event.type).toBe('schedule');
            expect(event.startTime).toBe(schedule.startTime);
            expect(event.endTime).toBe(schedule.endTime);
            expect(event.entityId).toBe(schedule.projectId);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('task events preserve the original task data', () => {
    fc.assert(
      fc.property(
        calendarTaskArb,
        (task) => {
          const events = mergeCalendarEvents([], [task], rangeStart, rangeEnd);
          expect(events).toHaveLength(1);
          const event = events[0];
          expect(event.type).toBe('deadline');
          expect(event.title).toBe(task.title);
          expect(event.subtitle).toBe(task.projectName);
          expect(event.entityId).toBe(task.id);
          // Date key should match the task's due date
          const dueDate = new Date(task.dueDate);
          expect(event.date).toBe(toDateKey(dueDate));
        },
      ),
      { numRuns: 100 },
    );
  });
});
