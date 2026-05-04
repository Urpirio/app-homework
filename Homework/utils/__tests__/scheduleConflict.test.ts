/**
 * Unit tests for Schedule Conflict Detection Utility
 *
 * Tests the detectScheduleConflict function and parseTimeToMinutes helper.
 *
 * Validates: Requirements 12.8, 19.7
 */

import type { Schedule } from '../../types/schedule';
import {
    detectScheduleConflict,
    NewScheduleInput,
    parseTimeToMinutes
} from '../scheduleConflict';

// ---------------------------------------------------------------------------
// parseTimeToMinutes
// ---------------------------------------------------------------------------

describe('parseTimeToMinutes', () => {
  it('parses HH:MM format correctly', () => {
    expect(parseTimeToMinutes('08:00')).toBe(480);
    expect(parseTimeToMinutes('09:30')).toBe(570);
    expect(parseTimeToMinutes('0:00')).toBe(0);
    expect(parseTimeToMinutes('23:59')).toBe(1439);
  });

  it('parses HH:MM:SS format (ignores seconds)', () => {
    expect(parseTimeToMinutes('08:00:00')).toBe(480);
    expect(parseTimeToMinutes('14:30:45')).toBe(870);
  });

  it('returns NaN for invalid input', () => {
    expect(parseTimeToMinutes('')).toBeNaN();
    expect(parseTimeToMinutes('abc')).toBeNaN();
    expect(parseTimeToMinutes('25:00')).toBeNaN();
    expect(parseTimeToMinutes('08:60')).toBeNaN();
    expect(parseTimeToMinutes('-1:00')).toBeNaN();
  });

  it('returns NaN for null/undefined-like input', () => {
    expect(parseTimeToMinutes(null as any)).toBeNaN();
    expect(parseTimeToMinutes(undefined as any)).toBeNaN();
  });
});

// ---------------------------------------------------------------------------
// detectScheduleConflict
// ---------------------------------------------------------------------------

const makeSchedule = (overrides: Partial<Schedule> = {}): Schedule => ({
  id: 'sched-1',
  day: 'Lunes',
  startTime: '08:00',
  endTime: '09:30',
  room: 'Aula 101',
  projectId: 'proj-1',
  institutionId: 'inst-1',
  project: { id: 'proj-1', name: 'Matemáticas' },
  ...overrides,
});

describe('detectScheduleConflict', () => {
  it('detects overlapping time slots on the same day and room', () => {
    const existing = [makeSchedule({ startTime: '08:00', endTime: '09:30' })];
    const newEntry: NewScheduleInput = {
      day: 'Lunes',
      startTime: '09:00',
      endTime: '10:00',
      room: 'Aula 101',
    };

    const result = detectScheduleConflict(newEntry, existing);
    expect(result.hasConflict).toBe(true);
    expect(result.conflictingSchedules).toHaveLength(1);
    expect(result.conflictingSchedules[0].id).toBe('sched-1');
  });

  it('does not flag non-overlapping time slots on the same day', () => {
    const existing = [makeSchedule({ startTime: '08:00', endTime: '09:00' })];
    const newEntry: NewScheduleInput = {
      day: 'Lunes',
      startTime: '09:00',
      endTime: '10:00',
      room: 'Aula 101',
    };

    const result = detectScheduleConflict(newEntry, existing);
    expect(result.hasConflict).toBe(false);
    expect(result.conflictingSchedules).toHaveLength(0);
  });

  it('does not flag schedules on different days', () => {
    const existing = [makeSchedule({ day: 'Martes', startTime: '08:00', endTime: '09:30' })];
    const newEntry: NewScheduleInput = {
      day: 'Lunes',
      startTime: '08:00',
      endTime: '09:30',
      room: 'Aula 101',
    };

    const result = detectScheduleConflict(newEntry, existing);
    expect(result.hasConflict).toBe(false);
  });

  it('does not flag schedules in different rooms', () => {
    const existing = [makeSchedule({ room: 'Aula 102', startTime: '08:00', endTime: '09:30' })];
    const newEntry: NewScheduleInput = {
      day: 'Lunes',
      startTime: '08:00',
      endTime: '09:30',
      room: 'Aula 101',
    };

    const result = detectScheduleConflict(newEntry, existing);
    expect(result.hasConflict).toBe(false);
  });

  it('detects conflict when new schedule is fully contained within existing', () => {
    const existing = [makeSchedule({ startTime: '08:00', endTime: '10:00' })];
    const newEntry: NewScheduleInput = {
      day: 'Lunes',
      startTime: '08:30',
      endTime: '09:30',
      room: 'Aula 101',
    };

    const result = detectScheduleConflict(newEntry, existing);
    expect(result.hasConflict).toBe(true);
  });

  it('detects conflict when existing schedule is fully contained within new', () => {
    const existing = [makeSchedule({ startTime: '08:30', endTime: '09:00' })];
    const newEntry: NewScheduleInput = {
      day: 'Lunes',
      startTime: '08:00',
      endTime: '10:00',
      room: 'Aula 101',
    };

    const result = detectScheduleConflict(newEntry, existing);
    expect(result.hasConflict).toBe(true);
  });

  it('detects conflict when no room is specified on either side (same day overlap)', () => {
    const existing = [makeSchedule({ room: undefined, startTime: '08:00', endTime: '09:30' })];
    const newEntry: NewScheduleInput = {
      day: 'Lunes',
      startTime: '09:00',
      endTime: '10:00',
    };

    const result = detectScheduleConflict(newEntry, existing);
    expect(result.hasConflict).toBe(true);
  });

  it('returns multiple conflicting schedules when applicable', () => {
    const existing = [
      makeSchedule({ id: 's1', startTime: '08:00', endTime: '09:00' }),
      makeSchedule({ id: 's2', startTime: '08:30', endTime: '09:30' }),
      makeSchedule({ id: 's3', startTime: '10:00', endTime: '11:00', day: 'Martes' }),
    ];
    const newEntry: NewScheduleInput = {
      day: 'Lunes',
      startTime: '08:15',
      endTime: '09:15',
      room: 'Aula 101',
    };

    const result = detectScheduleConflict(newEntry, existing);
    expect(result.hasConflict).toBe(true);
    expect(result.conflictingSchedules).toHaveLength(2);
  });

  it('handles case-insensitive day comparison', () => {
    const existing = [makeSchedule({ day: 'LUNES', startTime: '08:00', endTime: '09:30' })];
    const newEntry: NewScheduleInput = {
      day: 'lunes',
      startTime: '08:00',
      endTime: '09:30',
      room: 'Aula 101',
    };

    const result = detectScheduleConflict(newEntry, existing);
    expect(result.hasConflict).toBe(true);
  });

  it('handles case-insensitive room comparison', () => {
    const existing = [makeSchedule({ room: 'AULA 101', startTime: '08:00', endTime: '09:30' })];
    const newEntry: NewScheduleInput = {
      day: 'Lunes',
      startTime: '08:00',
      endTime: '09:30',
      room: 'aula 101',
    };

    const result = detectScheduleConflict(newEntry, existing);
    expect(result.hasConflict).toBe(true);
  });

  it('returns no conflict for empty existing schedules', () => {
    const result = detectScheduleConflict(
      { day: 'Lunes', startTime: '08:00', endTime: '09:00' },
      [],
    );
    expect(result.hasConflict).toBe(false);
    expect(result.conflictingSchedules).toEqual([]);
  });

  it('returns no conflict when new schedule has invalid times', () => {
    const existing = [makeSchedule()];
    const result = detectScheduleConflict(
      { day: 'Lunes', startTime: 'invalid', endTime: '09:00' },
      existing,
    );
    expect(result.hasConflict).toBe(false);
  });

  it('returns no conflict when start >= end (invalid range)', () => {
    const existing = [makeSchedule()];
    const result = detectScheduleConflict(
      { day: 'Lunes', startTime: '10:00', endTime: '09:00' },
      existing,
    );
    expect(result.hasConflict).toBe(false);
  });

  it('skips existing schedules with invalid times', () => {
    const existing = [makeSchedule({ startTime: 'bad', endTime: 'data' })];
    const result = detectScheduleConflict(
      { day: 'Lunes', startTime: '08:00', endTime: '09:00', room: 'Aula 101' },
      existing,
    );
    expect(result.hasConflict).toBe(false);
  });

  it('adjacent time slots (end === start) do not conflict', () => {
    const existing = [makeSchedule({ startTime: '08:00', endTime: '09:00' })];
    const newEntry: NewScheduleInput = {
      day: 'Lunes',
      startTime: '09:00',
      endTime: '10:00',
      room: 'Aula 101',
    };

    const result = detectScheduleConflict(newEntry, existing);
    expect(result.hasConflict).toBe(false);
  });
});
