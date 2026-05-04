import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
  EXCUSED = 'EXCUSED',
}

export interface AttendanceRecord {
  studentId: string;
  status: AttendanceStatus;
  note?: string;
}

export interface BulkAttendancePayload {
  projectId: string;
  date: string;
  records: AttendanceRecord[];
}

export const attendanceKeys = {
  all: ['attendance'] as const,
  byProject: (projectId: string) => ['attendance', 'project', projectId] as const,
  byStudent: (studentId: string) => ['attendance', 'student', studentId] as const,
};

export function useRecordAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: BulkAttendancePayload) => {
      const { data } = await api.post('/attendance', payload);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: attendanceKeys.byProject(variables.projectId),
      });
    },
  });
}

export function useProjectAttendanceHistory(projectId: string, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: [...attendanceKeys.byProject(projectId), { startDate, endDate }],
    queryFn: async () => {
      const { data } = await api.get(`/attendance/project/${projectId}`, {
        params: { startDate, endDate },
      });
      return data;
    },
    enabled: !!projectId,
  });
}

export function useStudentAttendanceSummary(studentId: string, projectId?: string) {
  return useQuery({
    queryKey: [...attendanceKeys.byStudent(studentId), { projectId }],
    queryFn: async () => {
      const { data } = await api.get(`/attendance/student/${studentId}`, {
        params: { projectId },
      });
      return data;
    },
    enabled: !!studentId,
  });
}
