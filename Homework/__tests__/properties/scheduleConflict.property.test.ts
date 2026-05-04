// Feature: homework-app-integration, Property 32: Schedule conflict detection identifies overlapping time slots
/**
 * Property 32: Schedule conflict detection identifies overlapping time slots
 *
 * For any two schedule entries on the same day for the same classroom, if their
 * time ranges overlap (entry1.startTime < entry2.endTime AND entry2.startTime <
 * entry1.endTime), the conflict detection function should flag them as conflicting.
 *
 * **Validates: Requirements 12.8**
 */

import * as fc from 'fast-check';
import type { Schedule } from '../../types/schedule';
import {
    detectScheduleConflict,
    parseTimeToMinutes,
    type NewScheduleInput,
} from '../../utils/scheduleConflict';

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const dayArb = fc.constantFrom(
  'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo',
);

/** Generate a valid time string HH:MM where hours 0-23 and minutes 0-59 */
const timeArb = fc.tuple(
  fc.integer({ min: 0, max: 23 }),
  fc.integer({ min: 0, max: 59 }),
).map(([h, m]) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);

/** Generate a valid time range where startTime < endTime (in minutes) */
const validTimeRangeArb = fc.tuple(
  fc.integer({ min: 0, max: 1378 }), // 0 to 22:58 in minutes
  fc.integer({ min: 1, max: 60 }),    // duration 1-60 minutes
).map(([startMin, duration]) => {
  const endMin = Math.min(startMin + duration, 23 * 60 + 59);
  if (startMin >= endMin) return null;
  const startH = Math.floor(startMin / 60);
  const startM = startMin % 60;
  const endH = Math.floor(endMin / 60);
  const endM = endMin % 60;
  return {
    startTime: `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`,
    endTime: `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`,
    startMin,
    endMin,
  };
}).filter((x): x is NonNullable<typeof x> => x !== null);

const roomArb = fc.string({ minLength: 1, maxLength: 10 });

function makeSchedule(overrides: Partial<Schedule> & { day: string; startTime: string; endTime: string }): Schedule {
  return {
    id: 'existing-1',
    projectId: 'proj-1',
    institutionId: 'inst-1',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Property 32: Schedule conflict detection identifies overlapping time slots', () => {
  it('detects conflict when two entries on the same day have overlapping times', () => {
    fc.assert(
      fc.property(
        dayArb,
        validTimeRangeArb,
        roomArb,
        fc.uuid(),
        (day, range, room, scheduleId) => {
          // Create an existing schedule
          const existing = makeSchedule({
            id: scheduleId,
            day,
            startTime: range.startTime,
            endTime: range.endTime,
            room,
          });

          // Create a new schedule that overlaps: starts in the middle of the existing one
          const midMin = Math.floor((range.startMin + range.endMin) / 2);
          if (midMin === range.startMin || midMin >= range.endMin) return; // skip degenerate
          const overlapEndMin = Math.min(range.endMin + 30, 23 * 60 + 59);
          const midH = Math.floor(midMin / 60);
          const midM = midMin % 60;
          const overlapEndH = Math.floor(overlapEndMin / 60);
          const overlapEndM = overlapEndMin % 60;

          const newSchedule: NewScheduleInput = {
            day,
            startTime: `${String(midH).padStart(2, '0')}:${String(midM).padStart(2, '0')}`,
            endTime: `${String(overlapEndH).padStart(2, '0')}:${String(overlapEndM).padStart(2, '0')}`,
            room,
          };

          // Verify the overlap condition holds
          const newStart = parseTimeToMinutes(newSchedule.startTime);
          const newEnd = parseTimeToMinutes(newSchedule.endTime);
          if (isNaN(newStart) || isNaN(newEnd) || newStart >= newEnd) return;

          const result = detectScheduleConflict(newSchedule, [existing]);
          expect(result.hasConflict).toBe(true);
          expect(result.conflictingSchedules).toContainEqual(existing);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('does not detect conflict when entries are on different days', () => {
    fc.assert(
      fc.property(
        validTimeRangeArb,
        roomArb,
        fc.uuid(),
        (range, room, scheduleId) => {
          const existing = makeSchedule({
            id: scheduleId,
            day: 'Lunes',
            startTime: range.startTime,
            endTime: range.endTime,
            room,
          });

          const newSchedule: NewScheduleInput = {
            day: 'Martes', // Different day
            startTime: range.startTime,
            endTime: range.endTime,
            room,
          };

          const result = detectScheduleConflict(newSchedule, [existing]);
          expect(result.hasConflict).toBe(false);
          expect(result.conflictingSchedules).toHaveLength(0);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('does not detect conflict when time ranges do not overlap (new ends before existing starts)', () => {
    fc.assert(
      fc.property(
        dayArb,
        roomArb,
        fc.uuid(),
        fc.integer({ min: 120, max: 1380 }), // existing start in minutes (at least 2h in)
        fc.integer({ min: 30, max: 120 }),     // existing duration
        fc.integer({ min: 30, max: 90 }),      // new duration
        (day, room, scheduleId, existStartMin, existDuration, newDuration) => {
          const existEndMin = Math.min(existStartMin + existDuration, 23 * 60 + 59);
          if (existStartMin >= existEndMin) return;

          // New schedule ends before existing starts
          const newEndMin = existStartMin; // exactly at boundary = no overlap (half-open intervals)
          const newStartMin = Math.max(newEndMin - newDuration, 0);
          if (newStartMin >= newEndMin) return;

          const fmt = (min: number) => {
            const h = Math.floor(min / 60);
            const m = min % 60;
            return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
          };

          const existing = makeSchedule({
            id: scheduleId,
            day,
            startTime: fmt(existStartMin),
            endTime: fmt(existEndMin),
            room,
          });

          const newSchedule: NewScheduleInput = {
            day,
            startTime: fmt(newStartMin),
            endTime: fmt(newEndMin),
            room,
          };

          const result = detectScheduleConflict(newSchedule, [existing]);
          expect(result.hasConflict).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('detects conflict symmetrically: if A conflicts with B, B conflicts with A', () => {
    fc.assert(
      fc.property(
        dayArb,
        validTimeRangeArb,
        validTimeRangeArb,
        roomArb,
        fc.uuid(),
        fc.uuid(),
        (day, range1, range2, room, id1, id2) => {
          const schedule1 = makeSchedule({
            id: id1,
            day,
            startTime: range1.startTime,
            endTime: range1.endTime,
            room,
          });

          const schedule2 = makeSchedule({
            id: id2,
            day,
            startTime: range2.startTime,
            endTime: range2.endTime,
            room,
          });

          const input1: NewScheduleInput = {
            day,
            startTime: range1.startTime,
            endTime: range1.endTime,
            room,
          };

          const input2: NewScheduleInput = {
            day,
            startTime: range2.startTime,
            endTime: range2.endTime,
            room,
          };

          const result1 = detectScheduleConflict(input1, [schedule2]);
          const result2 = detectScheduleConflict(input2, [schedule1]);

          // Conflict detection should be symmetric
          expect(result1.hasConflict).toBe(result2.hasConflict);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('parseTimeToMinutes correctly converts valid time strings', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 23 }),
        fc.integer({ min: 0, max: 59 }),
        (hours, minutes) => {
          const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
          const result = parseTimeToMinutes(timeStr);
          expect(result).toBe(hours * 60 + minutes);
        },
      ),
      { numRuns: 100 },
    );
  });
});
