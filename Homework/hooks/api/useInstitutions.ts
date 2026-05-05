/**
 * Institutions React Query Hooks
 *
 * Handles institution CRUD, stats, and admin management.
 *
 * Validates: Requirements 10.1, 4.9
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { Institution } from '../../types/institution';
import api from '../../utils/api';

interface InstitutionStats {
  students: number;
  teachers: number;
  classrooms: number;
  avgGrade: number;
}

export interface AnalyticsData {
  enrollmentTrend: { labels: string[]; data: number[] };
  gradeDistribution: { labels: string[]; data: number[] };
  attendanceStats: { labels: string[]; data: number[] };
  taskCompletion: { todo: number; inProgress: number; done: number };
  libraryStats: { totalLoans: number };
  kpis: {
    avgResponseTime: number;
    submissionRate: number;
    engagementScore: number;
  };
}

export const institutionKeys = {
  all: ['institutions'] as const,
  list: (search?: string) => ['institutions', 'list', search] as const,
  detail: (id: string) => ['institutions', 'detail', id] as const,
  stats: (id: string) => ['institutions', 'stats', id] as const,
  analytics: (id: string) => ['institutions', 'analytics', id] as const,
};

interface CreateInstitutionPayload {
  name: string;
  address?: string;
  logoUrl?: string;
}

interface UpdateInstitutionPayload {
  id: string;
  name?: string;
  address?: string;
  logoUrl?: string;
}

interface AssignAdminPayload {
  institutionId: string;
  userId: string;
}

interface RemoveAdminPayload {
  institutionId: string;
  adminId: string;
}

export function useInstitutions(search?: string) {
  return useQuery({
    queryKey: institutionKeys.list(search),
    queryFn: async (): Promise<Institution[]> => {
      const { data } = await api.get<Institution[]>('/institutions', {
        params: search ? { search } : undefined,
      });
      return data;
    },
  });
}

export function useInstitution(id: string) {
  return useQuery({
    queryKey: institutionKeys.detail(id),
    queryFn: async (): Promise<Institution> => {
      const { data } = await api.get<Institution>(`/institutions/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useInstitutionStats(id: string) {
  return useQuery({
    queryKey: institutionKeys.stats(id),
    queryFn: async (): Promise<InstitutionStats> => {
      const { data } = await api.get<InstitutionStats>(
        `/institutions/${id}/stats`
      );
      return data;
    },
    enabled: !!id,
  });
}

export function useInstitutionAnalytics(id: string) {
  return useQuery({
    queryKey: institutionKeys.analytics(id),
    queryFn: async (): Promise<AnalyticsData> => {
      const { data } = await api.get<AnalyticsData>(
        `/institutions/${id}/analytics`
      );
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateInstitution() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateInstitutionPayload): Promise<Institution> => {
      const { data } = await api.post<Institution>('/institutions', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: institutionKeys.all });
    },
  });
}

export function useUpdateInstitution() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...payload }: UpdateInstitutionPayload): Promise<Institution> => {
      const { data } = await api.put<Institution>(`/institutions/${id}`, payload);
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(institutionKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: institutionKeys.all });
    },
  });
}

export function useDeleteInstitution() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await api.delete(`/institutions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: institutionKeys.all });
    },
  });
}

export function useAssignAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ institutionId, userId }: AssignAdminPayload): Promise<void> => {
      await api.post(`/institutions/${institutionId}/admins`, { userId });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: institutionKeys.detail(variables.institutionId),
      });
    },
  });
}

export function useRemoveAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ institutionId, adminId }: RemoveAdminPayload): Promise<void> => {
      await api.delete(`/institutions/${institutionId}/admins/${adminId}`);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: institutionKeys.detail(variables.institutionId),
      });
    },
  });
}
