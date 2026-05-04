/**
 * Unit tests for Calendar Helper Utilities
 *
 * Tests the mergeCalendarEvents function and date helpers
 * that power the unified calendar view.
 *
 * Validates: Requirements 19.1, 19.2, 19.3, 19.9
 */

import type { Schedule } from '../../../types/schedule';
import {
    addMonths,
    addWeeks,
    endOfWeek,
    getMonthGridDates,
    getWeekDates,
    isSameDay,
    mergeCalendarEvents,
    startOfWeek,
    toDateKey,
} from '../../../utils/calendarHelpers';

describe('toDateKey', () => {
  it('formats a date as YYYY-MM-DD', () => {
    const date = new Date(2025, 0, 15); // Jan 15, 2025
    expect(toDateKey(date)).toBe('2025-01-15');
  });

  it('pads single-digit months and days', () => {
    const date = new Date(2025, 2, 5); // Mar 5, 2025
    expect(toDateKey(date)).toBe('2025-03-05');
  });
});

describe('isSameDay', () => {
  it('returns true for same date', () => {
    const a = new Date(2025, 5, 15, 10, 30);
    const b = new Date(2025, 5, 15, 22, 0);
    expect(isSameDay(a, b)).toBe(true);
  });

  it('returns false for different dates', () => {
    const a = new Date(2025, 5, 15);
    const b = new Date(2025, 5, 16);
    expect(isSameDay(a, b)).toBe(false);
  });
});

describe('startOfWeek / endOfWeek', () => {
  it('returns Monday for startOfWeek', () => {
    // Wed Jan 8, 2025
    const wed = new Date(2025, 0, 8);
    const start = startOfWeek(wed);
    expect(start.getDay()).toBe(1); // Monday
    expect(start.getDate()).toBe(6);
  });

  it('returns Sunday for endOfWeek', () => {
    const wed = new Date(2025, 0, 8);
    const end = endOfWeek(wed);
    expect(end.getDay()).toBe(0); // Sunday
    expect(end.getDate()).toBe(12);
  });

  it('handles Sunday input correctly', () => {
    // Sun Jan 12, 2025
    const sun = new Date(2025, 0, 12);
    const start = startOfWeek(sun);
    expect(start.getDate()).toBe(6); // Mon Jan 6
  });
});

describe('getMonthGridDates', () => {
  it('returns dates that are a multiple of 7', () => {
    const jan2025 = new Date(2025, 0, 1);
    const dates = getMonthGridDates(jan2025);
    expect(dates.length % 7).toBe(0);
  });

  it('starts on Monday', () => {
    const jan2025 = new Date(2025, 0, 1);
    const dates = getMonthGridDates(jan2025);
    // First date should be a Monday
    expect(dates[0].getDay()).toBe(1);
  });

  it('includes all days of the month', () => {
    const jan2025 = new Date(2025, 0, 1);
    const dates = getMonthGridDates(jan2025);
    const janDates = dates.filter((d) => d.getMonth() === 0);
    expect(janDates).toHaveLength(31);
  });
});

describe('getWeekDates', () => {
  it('returns exactly 7 dates', () => {
    const dates = getWeekDates(new Date(2025, 0, 8));
    expect(dates).toHaveLength(7);
  });

  it('starts on Monday and ends on Sunday', () => {
    const dates = getWeekDates(new Date(2025, 0, 8));
    expect(dates[0].getDay()).toBe(1); // Monday
    expect(dates[6].getDay()).toBe(0); // Sunday
  });
});

describe('addMonths / addWeeks', () => {
  it('addMonths moves forward by n months', () => {
    const jan = new Date(2025, 0, 15);
    const mar = addMonths(jan, 2);
    expect(mar.getMonth()).toBe(2);
  });

  it('addWeeks moves forward by n weeks', () => {
    const d = new Date(2025, 0, 6);
    const next = addWeeks(d, 1);
    expect(next.getDate()).toBe(13);
  });
});

describe('mergeCalendarEvents', () => {
  const rangeStart = new Date(2025, 0, 6); // Mon Jan 6
  const rangeEnd = new Date(2025, 0, 12); // Sun Jan 12

  const mockSchedules: Schedule[] = [
    {
      id: 'sched-1',
      day: 'Lunes',
      startTime: '08:00',
      endTime: '09:30',
      room: 'Aula 101',
      projectId: 'proj-1',
      institutionId: 'inst-1',
      project: { id: 'proj-1', name: 'Matemáticas', color: '#FF0000' },
    },
    {
      id: 'sched-2',
      day: 'Miércoles',
      startTime: '10:00',
      endTime: '11:30',
      projectId: 'proj-2',
      institutionId: 'inst-1',
      project: { id: 'proj-2', name: 'Ciencias' },
    },
  ];

  const mockTasks = [
    {
      id: 'task-1',
      title: 'Tarea de Álgebra',
      dueDate: '2025-01-08T23:59:00Z',
      status: 'TODO',
      projectName: 'Matemáticas',
      projectColor: '#FF0000',
    },
    {
      id: 'task-2',
      title: 'Informe de Laboratorio',
      dueDate: '2025-01-10T15:00:00Z',
      status: 'IN_PROGRESS',
      projectName: 'Ciencias',
      projectColor: '#00FF00',
    },
  ];

  it('preserves all schedule entries within the date range (Property 9)', () => {
    const events = mergeCalendarEvents(mockSchedules, [], rangeStart, rangeEnd);

    // Lunes (Jan 6) should have Matemáticas
    const mondayEvents = events.filter((e) => e.date === '2025-01-06');
    expect(mondayEvents).toHaveLength(1);
    expect(mondayEvents[0].title).toBe('Matemáticas');
    expect(mondayEvents[0].type).toBe('schedule');
    expect(mondayEvents[0].startTime).toBe('08:00');
    expect(mondayEvents[0].endTime).toBe('09:30');

    // Miércoles (Jan 8) should have Ciencias
    const wedEvents = events.filter((e) => e.date === '2025-01-08' && e.type === 'schedule');
    expect(wedEvents).toHaveLength(1);
    expect(wedEvents[0].title).toBe('Ciencias');
  });

  it('preserves all task deadlines (Property 9)', () => {
    const events = mergeCalendarEvents([], mockTasks, rangeStart, rangeEnd);

    expect(events).toHaveLength(2);
    expect(events[0].title).toBe('Tarea de Álgebra');
    expect(events[0].type).toBe('deadline');
    expect(events[0].entityId).toBe('task-1');
    expect(events[1].title).toBe('Informe de Laboratorio');
    expect(events[1].type).toBe('deadline');
    expect(events[1].entityId).toBe('task-2');
  });

  it('merges both schedules and tasks into a single array (Property 9)', () => {
    const events = mergeCalendarEvents(mockSchedules, mockTasks, rangeStart, rangeEnd);

    const scheduleEvents = events.filter((e) => e.type === 'schedule');
    const deadlineEvents = events.filter((e) => e.type === 'deadline');

    expect(scheduleEvents.length).toBeGreaterThanOrEqual(2);
    expect(deadlineEvents).toHaveLength(2);
    expect(events.length).toBe(scheduleEvents.length + deadlineEvents.length);
  });

  it('uses project color for schedules and task color for deadlines', () => {
    const events = mergeCalendarEvents(mockSchedules, mockTasks, rangeStart, rangeEnd);

    const schedEvent = events.find((e) => e.type === 'schedule' && e.title === 'Matemáticas');
    expect(schedEvent?.color).toBe('#FF0000');

    const taskEvent = events.find((e) => e.entityId === 'task-2');
    expect(taskEvent?.color).toBe('#00FF00');
  });

  it('includes room info as subtitle for schedules', () => {
    const events = mergeCalendarEvents(mockSchedules, [], rangeStart, rangeEnd);

    const withRoom = events.find((e) => e.title === 'Matemáticas');
    expect(withRoom?.subtitle).toBe('Aula: Aula 101');

    const withoutRoom = events.find((e) => e.title === 'Ciencias');
    expect(withoutRoom?.subtitle).toBeUndefined();
  });

  it('marks tasks within 48 hours as urgent (Property 33)', () => {
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in72h = new Date(now.getTime() + 72 * 60 * 60 * 1000);

    const urgentTasks = [
      {
        id: 'urgent-1',
        title: 'Due Soon',
        dueDate: in24h.toISOString(),
        status: 'TODO',
        projectName: 'Test',
        projectColor: '#000',
      },
      {
        id: 'not-urgent-1',
        title: 'Due Later',
        dueDate: in72h.toISOString(),
        status: 'TODO',
        projectName: 'Test',
        projectColor: '#000',
      },
    ];

    const wideRange = new Date(now.getTime() - 86400000);
    const wideEnd = new Date(now.getTime() + 7 * 86400000);
    const events = mergeCalendarEvents([], urgentTasks, wideRange, wideEnd);

    const urgent = events.find((e) => e.entityId === 'urgent-1');
    const notUrgent = events.find((e) => e.entityId === 'not-urgent-1');

    expect(urgent?.isUrgent).toBe(true);
    expect(notUrgent?.isUrgent).toBe(false);
  });

  it('does not mark past deadlines as urgent', () => {
    const pastDate = new Date(Date.now() - 86400000);
    const pastTasks = [
      {
        id: 'past-1',
        title: 'Overdue',
        dueDate: pastDate.toISOString(),
        status: 'TODO',
        projectName: 'Test',
        projectColor: '#000',
      },
    ];

    const wideRange = new Date(Date.now() - 7 * 86400000);
    const wideEnd = new Date(Date.now() + 7 * 86400000);
    const events = mergeCalendarEvents([], pastTasks, wideRange, wideEnd);

    expect(events[0].isUrgent).toBe(false);
  });

  it('handles empty inputs gracefully', () => {
    const events = mergeCalendarEvents([], [], rangeStart, rangeEnd);
    expect(events).toEqual([]);
  });

  it('skips schedules with unrecognized day names', () => {
    const badSchedule: Schedule[] = [
      {
        id: 'bad-1',
        day: 'InvalidDay',
        startTime: '08:00',
        endTime: '09:00',
        projectId: 'proj-1',
        institutionId: 'inst-1',
      },
    ];

    const events = mergeCalendarEvents(badSchedule, [], rangeStart, rangeEnd);
    expect(events).toHaveLength(0);
  });

  it('skips tasks without dueDate', () => {
    const noDateTasks = [
      {
        id: 'no-date',
        title: 'No Date Task',
        dueDate: '',
        status: 'TODO',
        projectName: 'Test',
        projectColor: '#000',
      },
    ];

    const events = mergeCalendarEvents([], noDateTasks, rangeStart, rangeEnd);
    expect(events).toHaveLength(0);
  });

  it('supports multiple day name formats (Spanish full, short, English)', () => {
    const multiFormatSchedules: Schedule[] = [
      {
        id: 's1',
        day: 'Monday',
        startTime: '08:00',
        endTime: '09:00',
        projectId: 'p1',
        institutionId: 'i1',
        project: { id: 'p1', name: 'English Class' },
      },
      {
        id: 's2',
        day: 'Lun',
        startTime: '10:00',
        endTime: '11:00',
        projectId: 'p2',
        institutionId: 'i1',
        project: { id: 'p2', name: 'Clase Corta' },
      },
    ];

    const events = mergeCalendarEvents(multiFormatSchedules, [], rangeStart, rangeEnd);
    const mondayEvents = events.filter((e) => e.date === '2025-01-06');
    expect(mondayEvents).toHaveLength(2);
  });
});
