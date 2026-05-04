/**
 * Calendar Helper Utilities
 *
 * Pure functions for calendar date manipulation and event merging.
 * Extracted from the calendar screen for testability and reuse.
 *
 * Validates: Requirements 19.1, 19.2, 19.3, 19.9
 */

import type { Schedule } from '../types/schedule';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CalendarEventType = 'schedule' | 'deadline' | 'event';

export interface CalendarEvent {
  id: string;
  title: string;
  subtitle?: string;
  type: CalendarEventType;
  /** Date key in YYYY-MM-DD format */
  date: string;
  startTime?: string;
  endTime?: string;
  color: string;
  /** Original entity id for navigation */
  entityId?: string;
  /** Whether this deadline is within 48 hours */
  isUrgent?: boolean;
}

export interface CalendarTask {
  id: string;
  title: string;
  dueDate: string;
  status: string;
  projectName: string;
  projectColor: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const EVENT_COLORS: Record<CalendarEventType, string> = {
  schedule: '#007AFF',
  deadline: '#FF9500',
  event: '#AF52DE',
};

export const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export const DAY_NAMES_FULL = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

/** Backend schedule day names mapped to JS Date.getDay() index */
export const SCHEDULE_DAY_MAP: Record<string, number> = {
  Domingo: 0, Lunes: 1, Martes: 2, Miércoles: 3, Jueves: 4, Viernes: 5, Sábado: 6,
  Dom: 0, Lun: 1, Mar: 2, Mié: 3, Jue: 4, Vie: 5, Sáb: 6,
  DOMINGO: 0, LUNES: 1, MARTES: 2, MIERCOLES: 3, JUEVES: 4, VIERNES: 5, SABADO: 6,
  Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6,
};

const HOURS_48 = 48 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// Date Helpers
// ---------------------------------------------------------------------------

export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

export function startOfWeek(d: Date): Date {
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  const result = new Date(d);
  result.setDate(result.getDate() + diff);
  return result;
}

export function endOfWeek(d: Date): Date {
  const start = startOfWeek(d);
  const result = new Date(start);
  result.setDate(result.getDate() + 6);
  return result;
}

export function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

export function addWeeks(d: Date, n: number): Date {
  const result = new Date(d);
  result.setDate(result.getDate() + n * 7);
  return result;
}

/** Get all dates for the calendar grid of a given month (includes padding from prev/next months) */
export function getMonthGridDates(d: Date): Date[] {
  const first = startOfMonth(d);
  const last = endOfMonth(d);
  const dates: Date[] = [];

  // Pad from previous month so grid starts on Monday
  const firstDayOfWeek = first.getDay(); // 0=Sun
  const padBefore = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
  for (let i = padBefore; i > 0; i--) {
    const pd = new Date(first);
    pd.setDate(pd.getDate() - i);
    dates.push(pd);
  }

  // Current month days
  for (let day = 1; day <= last.getDate(); day++) {
    dates.push(new Date(d.getFullYear(), d.getMonth(), day));
  }

  // Pad after to complete last week row
  const remaining = 7 - (dates.length % 7);
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      const nd = new Date(last);
      nd.setDate(nd.getDate() + i);
      dates.push(nd);
    }
  }

  return dates;
}

/** Get the 7 dates of the week containing `d` (Mon–Sun) */
export function getWeekDates(d: Date): Date[] {
  const start = startOfWeek(d);
  return Array.from({ length: 7 }, (_, i) => {
    const wd = new Date(start);
    wd.setDate(wd.getDate() + i);
    return wd;
  });
}

/**
 * Merge schedules and task deadlines into a unified CalendarEvent[] array.
 * Property 9: Calendar event merge preserves all sources.
 */
export function mergeCalendarEvents(
  schedules: Schedule[],
  tasks: CalendarTask[],
  rangeStart: Date,
  rangeEnd: Date,
): CalendarEvent[] {
  const now = new Date();
  const events: CalendarEvent[] = [];

  // Convert schedules to events — schedules repeat weekly, so expand them across the date range
  for (const schedule of schedules) {
    const dayIndex = SCHEDULE_DAY_MAP[schedule.day];
    if (dayIndex === undefined) continue;

    const cursor = new Date(rangeStart);
    while (cursor <= rangeEnd) {
      if (cursor.getDay() === dayIndex) {
        events.push({
          id: `schedule-${schedule.id}-${toDateKey(cursor)}`,
          title: schedule.project?.name || 'Clase',
          subtitle: schedule.room ? `Aula: ${schedule.room}` : undefined,
          type: 'schedule',
          date: toDateKey(cursor),
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          color: schedule.project?.color || EVENT_COLORS.schedule,
          entityId: schedule.projectId,
        });
      }
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  // Convert task deadlines to events
  for (const task of tasks) {
    if (!task.dueDate) continue;
    const dueDate = new Date(task.dueDate);
    const diffMs = dueDate.getTime() - now.getTime();
    const isUrgent = diffMs > 0 && diffMs <= HOURS_48;

    events.push({
      id: `task-${task.id}`,
      title: task.title,
      subtitle: task.projectName,
      type: 'deadline',
      date: toDateKey(dueDate),
      startTime: dueDate.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }),
      color: task.projectColor || EVENT_COLORS.deadline,
      entityId: task.id,
      isUrgent,
    });
  }

  return events;
}
