/**
 * Notifications React Query Hooks
 *
 * Handles notification CRUD, mark-as-read, and preferences management.
 *
 * Validates: Requirements 10.1, 10.2, 4.9
 */

import {
    useInfiniteQuery,
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';

import type { AppNotification, NotificationPreferences } from '../../types/notification';
import api from '../../utils/api';

export const notificationKeys = {
  all: ['notifications'] as const,
  list: ['notifications', 'list'] as const,
  preferences: ['notifications', 'preferences'] as const,
};

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export function useNotifications() {
  return useInfiniteQuery({
    queryKey: notificationKeys.list,
    queryFn: async ({ pageParam = 1 }): Promise<PaginatedResponse<AppNotification>> => {
      const { data } = await api.get<PaginatedResponse<AppNotification>>(
        '/notifications',
        { params: { page: pageParam, limit: 20 } }
      );
      return data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const nextPage = lastPage.page + 1;
      return nextPage * lastPage.limit < lastPage.total ? nextPage : undefined;
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<void> => {
      await api.patch('/notifications/mark-all-read');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.list });
    },
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string): Promise<void> => {
      await api.patch(`/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.list });
    },
  });
}

export function useNotificationPreferences() {
  return useQuery({
    queryKey: notificationKeys.preferences,
    queryFn: async (): Promise<NotificationPreferences> => {
      const { data } = await api.get<NotificationPreferences>(
        '/user/notification-preferences'
      );
      return data;
    },
  });
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      preferences: NotificationPreferences
    ): Promise<NotificationPreferences> => {
      const { data } = await api.put<NotificationPreferences>(
        '/user/notification-preferences',
        preferences
      );
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(notificationKeys.preferences, data);
    },
  });
}
