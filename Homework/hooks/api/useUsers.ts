/**
 * Users React Query Hooks
 *
 * Handles user management and teacher-specific endpoints with useInfiniteQuery (20 per page).
 *
 * Validates: Requirements 10.1, 10.2, 4.9
 */

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { User, UserRole } from '../../types/auth';
import api from '../../utils/api';

export const userKeys = {
  all: ['users'] as const,
  list: (params?: UserListParams) => ['users', 'list', params] as const,
  detail: (id: string) => ['users', 'detail', id] as const,
  tickets: (userId: string) => ['users', 'tickets', userId] as const,
  teacherStudents: (teacherId: string) =>
    ['users', 'teacher', teacherId, 'students'] as const,
  teacherSubjects: (teacherId: string) =>
    ['users', 'teacher', teacherId, 'subjects'] as const,
};

interface UserListParams {
  role?: UserRole;
  institutionId?: string;
  search?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

interface TeacherStudent {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  classroomId: string;
  classroomName: string;
}

interface TeacherSubject {
  id: string;
  name: string;
  classroomId: string;
  classroomName: string;
  studentCount: number;
  taskCount: number;
  avgGrade: number;
}

export function useUsers(params?: UserListParams) {
  return useInfiniteQuery({
    queryKey: userKeys.list(params),
    queryFn: async ({ pageParam = 1 }): Promise<PaginatedResponse<User>> => {
      const { data } = await api.get<PaginatedResponse<User>>('/users', {
        params: { page: pageParam, limit: 20, ...params },
      });
      return data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const nextPage = lastPage.page + 1;
      return nextPage * lastPage.limit < lastPage.total ? nextPage : undefined;
    },
  });
}

export function useUserDetail(userId: string) {
  return useQuery({
    queryKey: userKeys.detail(userId),
    queryFn: async (): Promise<User> => {
      const { data } = await api.get<User>(`/users/${userId}`);
      return data;
    },
    enabled: !!userId,
  });
}

export function useTeacherStudents(teacherId: string) {
  return useInfiniteQuery({
    queryKey: userKeys.teacherStudents(teacherId),
    queryFn: async ({ pageParam = 1 }): Promise<PaginatedResponse<TeacherStudent>> => {
      const { data } = await api.get<PaginatedResponse<TeacherStudent>>(
        `/teachers/${teacherId}/students`,
        { params: { page: pageParam, limit: 20 } }
      );
      return data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const nextPage = lastPage.page + 1;
      return nextPage * lastPage.limit < lastPage.total ? nextPage : undefined;
    },
    enabled: !!teacherId,
  });
}

export function useTeacherSubjects(teacherId: string) {
  return useInfiniteQuery({
    queryKey: userKeys.teacherSubjects(teacherId),
    queryFn: async ({ pageParam = 1 }): Promise<PaginatedResponse<TeacherSubject>> => {
      const { data } = await api.get<PaginatedResponse<TeacherSubject>>(
        `/teachers/${teacherId}/subjects`,
        { params: { page: pageParam, limit: 20 } }
      );
      return data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const nextPage = lastPage.page + 1;
      return nextPage * lastPage.limit < lastPage.total ? nextPage : undefined;
    },
    enabled: !!teacherId,
  });
}

// --- Mutations for user management ---

interface RegisterUserPayload {
  email: string;
  fullName: string;
  password?: string;
  role?: string;
}

interface InstitutionalUserPayload {
  email: string;
  fullName: string;
  role: string;
  institutionId?: string;
}

interface EnrollStudentPayload {
  institutionId: string;
  email: string;
  fullName: string;
  classroomId?: string;
}

export function useRegisterUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: RegisterUserPayload): Promise<User> => {
      const { data } = await api.post<User>('/auth/register', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}

export function useCreateInstitutionalUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: InstitutionalUserPayload): Promise<User> => {
      const { data } = await api.post<User>('/auth/institutional-user', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}

export function useEnrollStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ institutionId, ...payload }: EnrollStudentPayload): Promise<User> => {
      const { data } = await api.post<User>(
        `/admin/institution/${institutionId}/enroll-student`,
        payload
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}
