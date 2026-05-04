/**
 * Submissions React Query Hooks
 *
 * Handles submission creation, grading, and fetching by task.
 *
 * Validates: Requirements 10.1, 10.2, 4.9
 */

import {
    useInfiniteQuery,
    useMutation,
    useQueryClient,
} from '@tanstack/react-query';

import type { Submission } from '../../types/submission';
import api from '../../utils/api';

export const submissionKeys = {
  all: ['submissions'] as const,
  byTask: (taskId: string) => ['submissions', 'task', taskId] as const,
};

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

interface CreateSubmissionPayload {
  taskId: string;
  fileUrl?: string;
  content?: string;
}

interface GradeSubmissionPayload {
  submissionId: string;
  grade: number;
  feedback?: string;
}

export function useTaskSubmissions(taskId: string) {
  return useInfiniteQuery({
    queryKey: submissionKeys.byTask(taskId),
    queryFn: async ({ pageParam = 1 }): Promise<PaginatedResponse<Submission>> => {
      const { data } = await api.get<PaginatedResponse<Submission>>(
        `/submissions/task/${taskId}`,
        { params: { page: pageParam, limit: 15 } }
      );
      return data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const nextPage = lastPage.page + 1;
      return nextPage * lastPage.limit < lastPage.total ? nextPage : undefined;
    },
    enabled: !!taskId,
  });
}

export function useCreateSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateSubmissionPayload): Promise<Submission> => {
      const { data } = await api.post<Submission>('/submissions', payload);
      return data;
    },
    onSuccess: (_data, variables) => {
      // Invalidate the task detail so submission status updates immediately
      queryClient.invalidateQueries({
        queryKey: ['tasks', 'detail', variables.taskId],
      });
      // Invalidate submissions list for this task
      queryClient.invalidateQueries({
        queryKey: submissionKeys.byTask(variables.taskId),
      });
      // Invalidate ALL unit task lists so the status badge updates in the list
      queryClient.invalidateQueries({ queryKey: ['tasks', 'unit'] });
      // Invalidate all projects/units so progress percentages recalculate
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useGradeSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      submissionId,
      grade,
      feedback,
    }: GradeSubmissionPayload): Promise<Submission> => {
      const { data } = await api.patch<Submission>(
        `/submissions/${submissionId}/grade`,
        { grade, feedback }
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: submissionKeys.all });
    },
  });
}
