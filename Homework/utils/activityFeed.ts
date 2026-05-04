/**
 * Activity Feed Utilities
 *
 * Sorting and processing functions for the admin dashboard activity feed.
 * Events are always displayed in descending order of their createdAt timestamps.
 *
 * Feature: homework-app-integration, Property 40: Activity feed is sorted by timestamp descending
 * Validates: Requirements 14.5
 */

export interface ActivityEvent {
  id: string;
  description: string;
  createdAt: string;
  userId?: string;
  userName?: string;
  icon?: string;
  type?: string;
}

/**
 * Sort activity events by createdAt timestamp in descending order
 * (most recent first). Returns a new array without mutating the input.
 *
 * @param events - Array of activity events to sort
 * @returns New array sorted by createdAt descending
 */
export function sortActivitiesByTimestamp(events: ActivityEvent[]): ActivityEvent[] {
  return [...events].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return dateB - dateA;
  });
}

/**
 * Check whether an array of activity events is sorted by createdAt descending.
 *
 * @param events - Array of activity events to check
 * @returns true if the array is in descending timestamp order
 */
export function isSortedDescending(events: ActivityEvent[]): boolean {
  for (let i = 1; i < events.length; i++) {
    const prev = new Date(events[i - 1].createdAt).getTime();
    const curr = new Date(events[i].createdAt).getTime();
    if (curr > prev) return false;
  }
  return true;
}
