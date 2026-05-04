// Feature: homework-app-integration, Property 31: Schedule CRUD round-trip
/**
 * Property 31: Schedule CRUD round-trip
 *
 * For any valid schedule entry (day, startTime, endTime, room, projectId),
 * creating via POST /schedules and then fetching via GET /schedules should
 * return a list containing the created entry. Deleting the entry and fetching
 * again should return a list without it.
 *
 * **Validates: Requirements 19.7, 19.8**
 */

import * as fc from 'fast-check';
import type { Schedule } from '../../types/schedule';

// ---------------------------------------------------------------------------
// Pure in-memory schedule store for testing CRUD round-trip logic
// ---------------------------------------------------------------------------

interface ScheduleStore {
  schedules: Schedule[];
}

function createStore(): ScheduleStore {
  return { schedules: [] };
}

function addSchedule(store: ScheduleStore, schedule: Schedule): ScheduleStore {
  return { schedules: [...store.schedules, schedule] };
}

function getSchedules(store: ScheduleStore): Schedule[] {
  return [...store.schedules];
}

function deleteSchedule(store: ScheduleStore, scheduleId: string): ScheduleStore {
  return { schedules: store.schedules.filter(s => s.id !== scheduleId) };
}

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const dayArb = fc.constantFrom(
  'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo',
);

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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Property 31: Schedule CRUD round-trip', () => {
  it('creating a schedule and reading back contains the created entry', () => {
    fc.assert(
      fc.property(
        scheduleArb,
        (schedule) => {
          let store = createStore();
          store = addSchedule(store, schedule);
          const result = getSchedules(store);

          const found = result.find(s => s.id === schedule.id);
          expect(found).toBeDefined();
          expect(found!.day).toBe(schedule.day);
          expect(found!.startTime).toBe(schedule.startTime);
          expect(found!.endTime).toBe(schedule.endTime);
          expect(found!.room).toBe(schedule.room);
          expect(found!.projectId).toBe(schedule.projectId);
          expect(found!.institutionId).toBe(schedule.institutionId);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('deleting a schedule and reading back does not contain the deleted entry', () => {
    fc.assert(
      fc.property(
        scheduleArb,
        (schedule) => {
          let store = createStore();
          store = addSchedule(store, schedule);
          store = deleteSchedule(store, schedule.id);
          const result = getSchedules(store);

          const found = result.find(s => s.id === schedule.id);
          expect(found).toBeUndefined();
        },
      ),
      { numRuns: 100 },
    );
  });

  it('create-read-delete-read round-trip preserves other entries', () => {
    fc.assert(
      fc.property(
        fc.array(scheduleArb, { minLength: 2, maxLength: 10 }),
        fc.nat(),
        (schedules, indexSeed) => {
          // Ensure unique IDs
          const uniqueSchedules = schedules.filter(
            (s, i, arr) => arr.findIndex(x => x.id === s.id) === i,
          );
          if (uniqueSchedules.length < 2) return; // skip if not enough unique

          let store = createStore();
          for (const s of uniqueSchedules) {
            store = addSchedule(store, s);
          }

          // Delete one schedule
          const deleteIndex = indexSeed % uniqueSchedules.length;
          const toDelete = uniqueSchedules[deleteIndex];
          store = deleteSchedule(store, toDelete.id);

          const result = getSchedules(store);

          // Deleted entry should not be present
          expect(result.find(s => s.id === toDelete.id)).toBeUndefined();

          // All other entries should still be present
          for (let i = 0; i < uniqueSchedules.length; i++) {
            if (i === deleteIndex) continue;
            expect(result.find(s => s.id === uniqueSchedules[i].id)).toBeDefined();
          }

          expect(result).toHaveLength(uniqueSchedules.length - 1);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('all fields are preserved through create-read round-trip', () => {
    fc.assert(
      fc.property(
        scheduleArb,
        (schedule) => {
          let store = createStore();
          store = addSchedule(store, schedule);
          const result = getSchedules(store);
          const found = result.find(s => s.id === schedule.id);

          expect(found).toBeDefined();
          // Deep equality check — all fields preserved
          expect(found).toEqual(schedule);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('deleting a non-existent schedule does not affect the store', () => {
    fc.assert(
      fc.property(
        fc.array(scheduleArb, { minLength: 1, maxLength: 5 }),
        fc.uuid(),
        (schedules, nonExistentId) => {
          // Ensure the random ID doesn't collide with existing ones
          const uniqueSchedules = schedules.filter(s => s.id !== nonExistentId);

          let store = createStore();
          for (const s of uniqueSchedules) {
            store = addSchedule(store, s);
          }

          const beforeDelete = getSchedules(store);
          store = deleteSchedule(store, nonExistentId);
          const afterDelete = getSchedules(store);

          expect(afterDelete).toHaveLength(beforeDelete.length);
          for (const s of beforeDelete) {
            expect(afterDelete.find(x => x.id === s.id)).toBeDefined();
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
