/**
 * Classrooms React Query Hooks
 *
 * Handles classroom management including listing, detail, and subjects.
 *
 * Validates: Requirements 10.1, 4.9
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { Classroom } from '../../types/classroom';
import api from '../../utils/api';

export const classroomKeys = {
  all: ['classrooms'] as const,
  byInstitution: (instId: string) =>
    ['classrooms', 'institution', instId] as const,
  detail: (id: string) => ['classrooms', 'detail', id] as const,
  subjects: (id: string) => ['classrooms', 'subjects', id] as const,
};

interface CreateClassroomPayload {
  name: string;
  description?: string;
  institutionId: string;
}

interface Subject {
  id: string;
  name: string;
  classroomId: string;
  classroomName?: string;
  studentCount?: number;
  taskCount?: number;
  avgGrade?: number;
}

export function useInstitutionClassrooms(instId: string) {
  return useQuery({
    queryKey: classroomKeys.byInstitution(instId),
    queryFn: async (): Promise<Classroom[]> => {
      const { data } = await api.get<Classroom[]>(
        `/classrooms/institution/${instId}`
      );
      return data;
    },
    enabled: !!instId,
  });
}

export function useClassroom(id: string) {
  return useQuery({
    queryKey: classroomKeys.detail(id),
    queryFn: async (): Promise<Classroom> => {
      const { data } = await api.get<Classroom>(`/classrooms/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useClassroomSubjects(id: string) {
  return useQuery({
    queryKey: classroomKeys.subjects(id),
    queryFn: async (): Promise<Subject[]> => {
      const { data } = await api.get<Subject[]>(`/classrooms/${id}/subjects`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateClassroom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateClassroomPayload): Promise<Classroom> => {
      const { data } = await api.post<Classroom>('/classrooms', payload);
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: classroomKeys.byInstitution(variables.institutionId),
      });
    },
  });
}

interface CreateSubjectPayload {
  name: string;
  description?: string;
  gradingCriteria?: string;
  teacherIds?: string[];
}

export function useCreateSubjectInClassroom(classroomId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateSubjectPayload): Promise<Subject> => {
      const { data } = await api.post<Subject>(
        `/subjects/classroom/${classroomId}`,
        payload
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: classroomKeys.subjects(classroomId),
      });
    },
  });
}
export function useAddStudentToClassroom(classroomId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (studentId: string): Promise<void> => {
      await api.post(`/classrooms/${classroomId}/students`, { studentId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: classroomKeys.detail(classroomId),
      });
    },
  });
}

export function useRemoveStudentFromClassroom(classroomId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (studentId: string): Promise<void> => {
      await api.delete(`/classrooms/${classroomId}/students/${studentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: classroomKeys.detail(classroomId),
      });
    },
  });
}
