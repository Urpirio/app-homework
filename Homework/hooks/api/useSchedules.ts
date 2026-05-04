/**
 * Schedules React Query Hooks
 *
 * Handles schedule CRUD operations.
 *
 * Validates: Requirements 10.1, 4.9
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { Schedule } from '../../types/schedule';
import api from '../../utils/api';

export const scheduleKeys = {
  all: ['schedules'] as const,
};

interface CreateSchedulePayload {
  day: string;
  startTime: string;
  endTime: string;
  room?: string;
  projectId: string;
  institutionId: string;
}

export function useSchedules() {
  return useQuery({
    queryKey: scheduleKeys.all,
    queryFn: async (): Promise<Schedule[]> => {
      const { data } = await api.get<Schedule[]>('/schedules');
      return data;
    },
  });
}

export function useCreateSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateSchedulePayload): Promise<Schedule> => {
      const { data } = await api.post<Schedule>('/schedules', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.all });
    },
  });
}

export function useDeleteSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (scheduleId: string): Promise<void> => {
      await api.delete(`/schedules/${scheduleId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.all });
    },
  });
}
