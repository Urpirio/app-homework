/**
 * Projects React Query Hooks
 *
 * Handles project/subject listing and detail fetching.
 *
 * Validates: Requirements 10.1, 4.2, 4.9
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { Project } from '../../types/project';
import api from '../../utils/api';

export const projectKeys = {
  all: ['projects'] as const,
  detail: (id: string) => ['projects', 'detail', id] as const,
  units: (id: string) => ['projects', 'units', id] as const,
  members: (id: string) => ['projects', 'members', id] as const,
  stats: (id: string) => ['projects', 'stats', id] as const,
  tasks: (id: string) => ['projects', 'tasks', id] as const,
};

export function useProjects() {
  return useQuery({
    queryKey: projectKeys.all,
    queryFn: async (): Promise<Project[]> => {
      const { data } = await api.get<Project[]>('/projects');
      return data;
    },
  });
}

/** Fetch a single subject/project detail from GET /subjects/{id} */
export function useSubject(id: string) {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: async () => {
      const { data } = await api.get(`/subjects/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

/** Fetch units for a project from GET /projects/{id}/units */
export function useSubjectUnits(projectId: string) {
  return useQuery({
    queryKey: projectKeys.units(projectId),
    queryFn: async () => {
      const { data } = await api.get(`/projects/${projectId}/units`);
      return data;
    },
    enabled: !!projectId,
  });
}

/** Fetch subject stats from GET /subjects/{id}/stats */
export function useSubjectStats(id: string) {
  return useQuery({
    queryKey: projectKeys.stats(id),
    queryFn: async () => {
      const { data } = await api.get(`/subjects/${id}/stats`);
      return data;
    },
    enabled: !!id,
  });
}

/** Fetch subject tasks from GET /subjects/{id}/tasks */
export function useSubjectTasks(id: string) {
  return useQuery({
    queryKey: projectKeys.tasks(id),
    queryFn: async () => {
      const { data } = await api.get(`/subjects/${id}/tasks`);
      return data;
    },
    enabled: !!id,
  });
}

/** Update a subject via PUT /subjects/{id} */
export function useUpdateSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: string; name?: string; teacherIds?: string[] }) => {
      const { data } = await api.put(`/subjects/${id}`, payload);
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: projectKeys.stats(variables.id) });
      queryClient.invalidateQueries({ queryKey: projectKeys.tasks(variables.id) });
      // Also invalidate classroom subjects list
      queryClient.invalidateQueries({ queryKey: ['classrooms'] });
    },
  });
}

/** Delete a subject via DELETE /subjects/{id} */
export function useDeleteSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/subjects/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      queryClient.invalidateQueries({ queryKey: ['classrooms'] });
    },
  });
}


export interface ProjectMember {
  id: string;
  role: string;
  userId: string;
  projectId: string;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    avatarUrl?: string;
    email: string;
  };
}

/** Fetch members for a project from GET /projects/{id}/members */
export function useProjectMembers(projectId: string) {
  return useQuery({
    queryKey: projectKeys.members(projectId),
    queryFn: async (): Promise<ProjectMember[]> => {
      const { data } = await api.get<ProjectMember[]>(`/projects/${projectId}/members`);
      return data;
    },
    enabled: !!projectId,
  });
}
