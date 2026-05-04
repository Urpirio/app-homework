/**
 * useCalendarBadge Hook
 *
 * Computes the count of upcoming task deadlines within 48 hours
 * for display as a badge on the calendar tab.
 *
 * Validates: Requirements 19.9
 */

import { useCalendarTasks } from '@/hooks/api/useTasks';
import { useMemo } from 'react';

const HOURS_48 = 48 * 60 * 60 * 1000;

export function useCalendarBadge(): number {
  // Fetch tasks for the next 7 days to capture upcoming deadlines
  const now = useMemo(() => new Date(), []);
  const startDate = useMemo(() => now.toISOString().split('T')[0], [now]);
  const endDate = useMemo(() => {
    const d = new Date(now);
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  }, [now]);

  const { data } = useCalendarTasks(startDate, endDate);

  return useMemo(() => {
    if (!data?.tasks) return 0;
    const nowMs = Date.now();
    return data.tasks.filter((task: any) => {
      if (!task.dueDate || task.status === 'DONE') return false;
      const dueMs = new Date(task.dueDate).getTime();
      const diff = dueMs - nowMs;
      return diff > 0 && diff <= HOURS_48;
    }).length;
  }, [data]);
}
