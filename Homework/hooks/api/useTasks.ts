/**
 * Tasks React Query Hooks
 *
 * Handles task CRUD, calendar queries, and unit tasks.
 * Uses useInfiniteQuery for paginated task lists (15 per page).
 *
 * Validates: Requirements 10.1, 10.2, 4.9
 */

import {
    useInfiniteQuery,
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';

import type { Task } from '../../types/project';
import api from '../../utils/api';

export const taskKeys = {
  all: ['tasks'] as const,
  detail: (id: string) => ['tasks', 'detail', id] as const,
  byProject: (projectId: string) => ['tasks', 'project', projectId] as const,
  byUnit: (unitId: string) => ['tasks', 'unit', unitId] as const,
  calendar: (startDate: string, endDate: string) =>
    ['tasks', 'calendar', startDate, endDate] as const,
};

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

interface CalendarTask {
  id: string;
  title: string;
  dueDate: string;
  status: string;
  projectName: string;
  projectColor: string;
}

interface CalendarResponse {
  tasks: CalendarTask[];
}

interface CreateTaskPayload {
  title: string;
  description?: string;
  dueDate?: string;
  maxGrade?: number;
  type?: 'ASSIGNMENT' | 'EXAM' | 'NOTE' | 'QUIZ';
  projectId: string;
  unitId?: string;
}

interface UpdateTaskPayload {
  id: string;
  title?: string;
  description?: string;
  dueDate?: string;
  maxGrade?: number;
  status?: 'TODO' | 'IN_PROGRESS' | 'DONE';
  type?: 'ASSIGNMENT' | 'EXAM' | 'NOTE' | 'QUIZ';
}

export function useTask(taskId: string) {
  return useQuery({
    queryKey: taskKeys.detail(taskId),
    queryFn: async (): Promise<Task> => {
      const { data } = await api.get<Task>(`/tasks/${taskId}`);
      return data;
    },
    enabled: !!taskId,
  });
}

export function useProjectTasks(projectId: string) {
  return useInfiniteQuery({
    queryKey: taskKeys.byProject(projectId),
    queryFn: async ({ pageParam = 1 }): Promise<PaginatedResponse<Task>> => {
      const { data } = await api.get<PaginatedResponse<Task>>(
        `/tasks/project/${projectId}`,
        { params: { page: pageParam, limit: 15 } }
      );
      return data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const nextPage = lastPage.page + 1;
      return nextPage * lastPage.limit < lastPage.total ? nextPage : undefined;
    },
    enabled: !!projectId,
  });
}

export function useUnitTasks(unitId: string) {
  return useInfiniteQuery({
    queryKey: taskKeys.byUnit(unitId),
    queryFn: async ({ pageParam = 1 }): Promise<PaginatedResponse<Task>> => {
      const { data } = await api.get<PaginatedResponse<Task>>(
        `/units/${unitId}/tasks`,
        { params: { page: pageParam, limit: 15 } }
      );
      return data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const nextPage = lastPage.page + 1;
      return nextPage * lastPage.limit < lastPage.total ? nextPage : undefined;
    },
    enabled: !!unitId,
  });
}

export function useCalendarTasks(startDate: string, endDate: string) {
  return useQuery({
    queryKey: taskKeys.calendar(startDate, endDate),
    queryFn: async (): Promise<CalendarResponse> => {
      const { data } = await api.get<CalendarResponse>('/tasks/calendar', {
        params: { startDate, endDate },
      });
      return data;
    },
    enabled: !!startDate && !!endDate,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateTaskPayload): Promise<Task> => {
      const { data } = await api.post<Task>('/tasks', payload);
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.byProject(variables.projectId) });
      if (variables.unitId) {
        queryClient.invalidateQueries({ queryKey: taskKeys.byUnit(variables.unitId) });
      }
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...payload }: UpdateTaskPayload): Promise<Task> => {
      const { data } = await api.patch<Task>(`/tasks/${id}`, payload);
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(taskKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string): Promise<void> => {
      await api.delete(`/tasks/${taskId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}
