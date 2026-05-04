/**
 * Notification Badge Hook
 *
 * Tracks unread notification count with two update channels:
 * 1. Polling fallback — refetches every 60s via React Query
 * 2. WebSocket real-time — increments on `newNotification` socket event
 *
 * Exposes the count for tab bar badge display, plus helpers to
 * decrement on read and reset on mark-all-read.
 *
 * Validates: Requirements 5.2, 5.7
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';

import api from '../utils/api';
import * as socketManager from '../utils/socket';

const BADGE_QUERY_KEY = ['notifications', 'badge'] as const;
const POLL_INTERVAL_MS = 60_000;

interface BadgeResponse {
  total: number;
}

/**
 * Fetches the unread notification count from the backend.
 * Uses the existing notifications endpoint with unreadOnly filter.
 */
async function fetchUnreadCount(): Promise<number> {
  try {
    const { data } = await api.get<BadgeResponse | number>('/notifications', {
      params: { unreadOnly: true, limit: 1 },
    });
    // Handle both { total: N } and direct array responses
    if (typeof data === 'number') return data;
    if (typeof data === 'object' && data !== null && 'total' in data) {
      return (data as BadgeResponse).total;
    }
    // If the response is an array, count items (fallback)
    if (Array.isArray(data)) return data.length;
    return 0;
  } catch {
    return 0;
  }
}

export function useNotificationBadge() {
  const queryClient = useQueryClient();

  const { data: count = 0 } = useQuery({
    queryKey: BADGE_QUERY_KEY,
    queryFn: fetchUnreadCount,
    refetchInterval: POLL_INTERVAL_MS,
    staleTime: 30_000,
  });

  // Real-time increment via WebSocket
  useEffect(() => {
    const handleNewNotification = () => {
      queryClient.setQueryData<number>(BADGE_QUERY_KEY, (old) => (old ?? 0) + 1);
    };

    socketManager.onNewNotification(handleNewNotification);

    // Cleanup: we can't easily remove a specific listener from the socket
    // manager, so we rely on the socket disconnect to clean up.
    // The polling fallback will correct any drift.
  }, [queryClient]);

  /** Decrement badge by 1 when a single notification is marked as read. */
  const decrementBadge = useCallback(() => {
    queryClient.setQueryData<number>(BADGE_QUERY_KEY, (old) =>
      Math.max((old ?? 1) - 1, 0)
    );
  }, [queryClient]);

  /** Reset badge to 0 when all notifications are marked as read. */
  const resetBadge = useCallback(() => {
    queryClient.setQueryData<number>(BADGE_QUERY_KEY, 0);
  }, [queryClient]);

  /** Force refetch the badge count from the server. */
  const refetchBadge = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: BADGE_QUERY_KEY });
  }, [queryClient]);

  return {
    count,
    decrementBadge,
    resetBadge,
    refetchBadge,
  };
}
