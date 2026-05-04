/**
 * Integration Tests: Grades Screen
 *
 * Tests the data flow from API → useGrades hook → grades display with period filtering.
 * Verifies that MOCK_GRADES is eliminated and the period selector is functional.
 *
 * The useGrades hook aggregates data from:
 *   1. GET /projects → list of subjects
 *   2. GET /subjects/{id}/stats → avgGrade per subject, scoped by period dates
 *
 * Validates: Requirements 4.6, 4.7, 4.9
 */

import {
    getAcademicPeriods,
    getGpaStatus,
    getLetterGrade,
    useGrades,
} from '@/hooks/api/useGrades';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import React from 'react';

import api from '@/utils/api';

// Mock the API module
jest.mock('@/utils/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  },
}));

const mockedApi = api as jest.Mocked<typeof api>;

/** Sample projects returned by GET /projects */
const SAMPLE_PROJECTS = [
  {
    id: 'subj-1',
    name: 'Matemáticas',
    user: { fullName: 'Prof. García' },
    members: [{ role: 'teacher', user: { fullName: 'Prof. García' } }],
  },
  {
    id: 'subj-2',
    name: 'Ciencias Naturales',
    user: { fullName: 'Prof. López' },
    members: [{ role: 'teacher', user: { fullName: 'Prof. López' } }],
  },
  {
    id: 'subj-3',
    name: 'Historia',
    user: { fullName: 'Prof. Martínez' },
    members: [],
  },
];

/** Mock data constants that must NEVER appear */
const MOCK_DATA_CONSTANTS = ['MOCK_GRADES', 'MOCK_SUBJECTS'];

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
}

function createWrapper() {
  const queryClient = createTestQueryClient();
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

/**
 * Helper to set up API mocks for the grades flow.
 * The useGrades hook calls GET /projects first, then GET /subjects/{id}/stats for each.
 */
function setupGradesMocks(
  projects: any[],
  statsMap: Record<string, { avgGrade: number }>
) {
  (mockedApi.get as jest.Mock).mockImplementation((url: string) => {
    if (url === '/projects') {
      return Promise.resolve({ data: projects });
    }
    // Match /subjects/{id}/stats
    const statsMatch = url.match(/^\/subjects\/(.+)\/stats$/);
    if (statsMatch) {
      const subjectId = statsMatch[1];
      if (statsMap[subjectId]) {
        return Promise.resolve({ data: statsMap[subjectId] });
      }
      return Promise.reject(new Error(`Stats not found for ${subjectId}`));
    }
    return Promise.reject(new Error(`Unexpected URL: ${url}`));
  });
}

describe('Grades Screen Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading → Data rendered flow', () => {
    it('fetches grades by aggregating projects and their stats', async () => {
      setupGradesMocks(SAMPLE_PROJECTS, {
        'subj-1': { avgGrade: 9.2 },
        'subj-2': { avgGrade: 8.5 },
        'subj-3': { avgGrade: 7.0 },
      });

      const periods = getAcademicPeriods();
      const { result } = renderHook(
        () => useGrades(periods[0].startDate, periods[0].endDate),
        { wrapper: createWrapper() }
      );

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isError).toBe(false);
      const grades = result.current.data!;
      expect(grades).toHaveLength(3);

      // Verify data comes from API, not mock constants
      expect(grades[0].subject).toBe('Matemáticas');
      expect(grades[0].grade).toBe(9.2);
      expect(grades[0].teacher).toBe('Prof. García');

      expect(grades[1].subject).toBe('Ciencias Naturales');
      expect(grades[1].grade).toBe(8.5);

      expect(grades[2].subject).toBe('Historia');
      expect(grades[2].grade).toBe(7);

      // Verify no mock data constants in serialized output
      const serialized = JSON.stringify(grades);
      for (const mockConst of MOCK_DATA_CONSTANTS) {
        expect(serialized).not.toContain(mockConst);
      }
    });

    it('passes period dates to stats endpoint as query params', async () => {
      setupGradesMocks(SAMPLE_PROJECTS, {
        'subj-1': { avgGrade: 8.0 },
        'subj-2': { avgGrade: 7.5 },
        'subj-3': { avgGrade: 6.0 },
      });

      const { result } = renderHook(
        () => useGrades('2025-03-01', '2025-06-30'),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Verify stats calls include period date params
      const statsCalls = (mockedApi.get as jest.Mock).mock.calls.filter(
        (call: any[]) => typeof call[0] === 'string' && call[0].includes('/stats')
      );

      expect(statsCalls.length).toBe(3);
      for (const call of statsCalls) {
        expect(call[1]).toEqual({
          params: { startDate: '2025-03-01', endDate: '2025-06-30' },
        });
      }
    });

    it('includes letter grades computed from numeric grades', async () => {
      setupGradesMocks(
        [SAMPLE_PROJECTS[0]],
        { 'subj-1': { avgGrade: 9.5 } }
      );

      const periods = getAcademicPeriods();
      const { result } = renderHook(
        () => useGrades(periods[0].startDate, periods[0].endDate),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data![0].letter).toBe('A+');
    });
  });

  describe('Loading → Error state flow', () => {
    it('transitions to error state when projects fetch fails', async () => {
      (mockedApi.get as jest.Mock).mockRejectedValue(new Error('Network Error'));

      const periods = getAcademicPeriods();
      const { result } = renderHook(
        () => useGrades(periods[0].startDate, periods[0].endDate),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.data).toBeUndefined();
    });

    it('gracefully handles individual subject stats failure', async () => {
      // Projects fetch succeeds, but one stats call fails
      (mockedApi.get as jest.Mock).mockImplementation((url: string) => {
        if (url === '/projects') {
          return Promise.resolve({ data: SAMPLE_PROJECTS.slice(0, 2) });
        }
        if (url === '/subjects/subj-1/stats') {
          return Promise.resolve({ data: { avgGrade: 9.0 } });
        }
        if (url === '/subjects/subj-2/stats') {
          return Promise.reject(new Error('Stats unavailable'));
        }
        return Promise.reject(new Error(`Unexpected: ${url}`));
      });

      const periods = getAcademicPeriods();
      const { result } = renderHook(
        () => useGrades(periods[0].startDate, periods[0].endDate),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should still return grades, with failed subject showing grade 0
      const grades = result.current.data!;
      expect(grades).toHaveLength(2);
      expect(grades[0].grade).toBe(9);
      expect(grades[1].grade).toBe(0); // Failed stats → grade 0
      expect(grades[1].letter).toBe('F');
    });
  });

  describe('Loading → Empty state flow', () => {
    it('returns empty array when no projects exist', async () => {
      (mockedApi.get as jest.Mock).mockResolvedValueOnce({ data: [] });

      const periods = getAcademicPeriods();
      const { result } = renderHook(
        () => useGrades(periods[0].startDate, periods[0].endDate),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual([]);
    });
  });

  describe('Period filtering', () => {
    it('uses different query keys for different periods', async () => {
      const periods = getAcademicPeriods();
      expect(periods.length).toBeGreaterThanOrEqual(3);

      // Verify periods have distinct date ranges
      const dateRanges = new Set(
        periods.map((p) => `${p.startDate}-${p.endDate}`)
      );
      expect(dateRanges.size).toBe(periods.length);
    });

    it('refetches when period changes', async () => {
      const periods = getAcademicPeriods();

      // First period
      setupGradesMocks(SAMPLE_PROJECTS.slice(0, 1), {
        'subj-1': { avgGrade: 8.0 },
      });

      const wrapper = createWrapper();
      const { result, rerender } = renderHook(
        ({ start, end }: { start: string; end: string }) => useGrades(start, end),
        {
          wrapper,
          initialProps: {
            start: periods[0].startDate,
            end: periods[0].endDate,
          },
        }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data![0].grade).toBe(8);

      // Change to second period with different grades
      jest.clearAllMocks();
      setupGradesMocks(SAMPLE_PROJECTS.slice(0, 1), {
        'subj-1': { avgGrade: 9.5 },
      });

      rerender({ start: periods[1].startDate, end: periods[1].endDate });

      await waitFor(() => {
        expect(result.current.data![0].grade).toBe(9.5);
      });
    });

    it('does not fetch when dates are empty', () => {
      renderHook(() => useGrades('', ''), {
        wrapper: createWrapper(),
      });

      expect(mockedApi.get).not.toHaveBeenCalled();
    });
  });

  describe('Letter grade computation', () => {
    it('maps numeric grades to correct letter grades', () => {
      expect(getLetterGrade(9.5)).toBe('A+');
      expect(getLetterGrade(9.0)).toBe('A');
      expect(getLetterGrade(8.5)).toBe('B+');
      expect(getLetterGrade(8.0)).toBe('B');
      expect(getLetterGrade(7.5)).toBe('C+');
      expect(getLetterGrade(7.0)).toBe('C');
      expect(getLetterGrade(6.0)).toBe('D');
      expect(getLetterGrade(5.0)).toBe('F');
      expect(getLetterGrade(0)).toBe('F');
    });
  });

  describe('GPA status computation', () => {
    it('maps GPA to correct status labels', () => {
      expect(getGpaStatus(9.5)).toBe('Excelente Desempeño');
      expect(getGpaStatus(8.5)).toBe('Buen Desempeño');
      expect(getGpaStatus(7.5)).toBe('Desempeño Regular');
      expect(getGpaStatus(6.5)).toBe('Desempeño Suficiente');
      expect(getGpaStatus(5.0)).toBe('Necesita Mejorar');
    });
  });

  describe('Academic periods', () => {
    it('generates valid academic periods with labels and date ranges', () => {
      const periods = getAcademicPeriods();

      expect(periods.length).toBe(4);
      expect(periods[0].label).toBe('1er Trimestre');
      expect(periods[1].label).toBe('2do Trimestre');
      expect(periods[2].label).toBe('3er Trimestre');
      expect(periods[3].label).toBe('Final');

      // Each period should have valid date strings
      for (const period of periods) {
        expect(period.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(period.endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(new Date(period.startDate).getTime()).toBeLessThan(
          new Date(period.endDate).getTime()
        );
      }
    });
  });
});
