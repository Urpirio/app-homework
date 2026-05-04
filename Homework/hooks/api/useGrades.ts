/**
 * Grades React Query Hooks
 *
 * Aggregates grade data from subjects and their stats endpoints.
 * Since there is no dedicated grades endpoint, this hook fetches
 * each subject's average grade from GET /subjects/{id}/stats and
 * combines it with subject metadata from GET /projects.
 *
 * Supports academic period filtering via date ranges.
 *
 * Validates: Requirements 4.6, 4.7
 */

import { useQuery } from '@tanstack/react-query';

import api from '../../utils/api';

export interface SubjectGrade {
  id: string;
  subject: string;
  grade: number;
  letter: string;
  teacher: string;
}

export interface AcademicPeriod {
  label: string;
  startDate: string;
  endDate: string;
}

interface SubjectStatsResponse {
  avgGrade: number;
}

interface ProjectResponse {
  id: string;
  name: string;
  user?: {
    fullName?: string;
  };
  members?: Array<{
    role: string;
    user: {
      fullName: string;
    };
  }>;
}

/**
 * Returns the letter grade for a numeric grade (0-10 scale).
 */
export function getLetterGrade(grade: number): string {
  if (grade >= 9.5) return 'A+';
  if (grade >= 9.0) return 'A';
  if (grade >= 8.5) return 'B+';
  if (grade >= 8.0) return 'B';
  if (grade >= 7.5) return 'C+';
  if (grade >= 7.0) return 'C';
  if (grade >= 6.0) return 'D';
  return 'F';
}

/**
 * Returns the GPA status label based on the average grade.
 */
export function getGpaStatus(gpa: number): string {
  if (gpa >= 9.0) return 'Excelente Desempeño';
  if (gpa >= 8.0) return 'Buen Desempeño';
  if (gpa >= 7.0) return 'Desempeño Regular';
  if (gpa >= 6.0) return 'Desempeño Suficiente';
  return 'Necesita Mejorar';
}

/**
 * Builds academic periods for the current school year.
 * Trimesters are based on a typical academic calendar.
 */
export function getAcademicPeriods(): AcademicPeriod[] {
  const currentYear = new Date().getFullYear();
  // Determine school year: if we're before August, the school year started last year
  const month = new Date().getMonth(); // 0-indexed
  const schoolYearStart = month < 7 ? currentYear - 1 : currentYear;
  const schoolYearEnd = schoolYearStart + 1;

  return [
    {
      label: '1er Trimestre',
      startDate: `${schoolYearStart}-08-01`,
      endDate: `${schoolYearStart}-11-30`,
    },
    {
      label: '2do Trimestre',
      startDate: `${schoolYearStart}-12-01`,
      endDate: `${schoolYearEnd}-02-28`,
    },
    {
      label: '3er Trimestre',
      startDate: `${schoolYearEnd}-03-01`,
      endDate: `${schoolYearEnd}-06-30`,
    },
    {
      label: 'Final',
      startDate: `${schoolYearStart}-08-01`,
      endDate: `${schoolYearEnd}-07-31`,
    },
  ];
}

export const gradeKeys = {
  all: ['grades'] as const,
  byPeriod: (startDate: string, endDate: string) =>
    ['grades', 'period', startDate, endDate] as const,
};

/**
 * Fetches grades for all subjects the student is enrolled in.
 * Aggregates data from GET /projects and GET /subjects/{id}/stats.
 *
 * The period's startDate/endDate are passed to the stats endpoint
 * as query params so the backend can scope the grade aggregation.
 * If the backend ignores them, we still get the overall average.
 */
export function useGrades(startDate: string, endDate: string) {
  return useQuery({
    queryKey: gradeKeys.byPeriod(startDate, endDate),
    queryFn: async (): Promise<SubjectGrade[]> => {
      // Step 1: Fetch all projects/subjects
      const { data: projects } = await api.get<ProjectResponse[]>('/projects');

      if (!projects || projects.length === 0) {
        return [];
      }

      // Step 2: For each subject, fetch stats (avgGrade)
      const gradePromises = projects.map(async (project) => {
        try {
          const { data: stats } = await api.get<SubjectStatsResponse>(
            `/subjects/${project.id}/stats`,
            { params: { startDate, endDate } },
          );

          // Find the teacher name from members or owner
          const teacherMember = project.members?.find((m) => m.role === 'teacher');
          const teacherName =
            teacherMember?.user?.fullName || project.user?.fullName || '';

          const grade = stats.avgGrade || 0;

          return {
            id: project.id,
            subject: project.name,
            grade: Math.round(grade * 10) / 10,
            letter: getLetterGrade(grade),
            teacher: teacherName,
          };
        } catch {
          // If stats fetch fails for a subject, return it with grade 0
          return {
            id: project.id,
            subject: project.name,
            grade: 0,
            letter: getLetterGrade(0),
            teacher: project.user?.fullName || '',
          };
        }
      });

      return Promise.all(gradePromises);
    },
    enabled: !!startDate && !!endDate,
  });
}
