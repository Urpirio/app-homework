/**
 * Integration Tests: Projects List Screen
 *
 * Tests the data flow from API → useProjects hook → screen states.
 * Verifies that no mock data constants appear and that error/empty states
 * are handled correctly via the real React Query integration.
 *
 * Validates: Requirements 4.1, 4.7, 4.9
 */

import { useProjects } from '@/hooks/api/useProjects';
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

/** Sample project data matching the Project type */
const SAMPLE_PROJECTS = [
  {
    id: 'proj-1',
    name: 'Matemáticas Avanzadas',
    description: 'Curso de cálculo integral',
    progress: 75,
    tasksCount: 12,
    completedTasks: 9,
    lastAccessed: '2025-01-15T10:00:00Z',
    color: '#4A90D9',
  },
  {
    id: 'proj-2',
    name: 'Física Cuántica',
    description: 'Introducción a la mecánica cuántica',
    progress: 40,
    tasksCount: 8,
    completedTasks: 3,
    lastAccessed: '2025-01-14T14:30:00Z',
    color: '#E74C3C',
  },
];

/** Mock data constants that must NEVER appear in rendered output */
const MOCK_DATA_CONSTANTS = [
  'MOCK_SUBJECTS',
  'MOCK_UNITS',
  'MOCK_STUDENTS',
  'MOCK_UNIT_TASKS',
  'MOCK_GRADES',
];

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

describe('Projects List Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading → Data rendered flow', () => {
    it('starts in loading state then resolves with API data', async () => {
      (mockedApi.get as jest.Mock).mockResolvedValueOnce({ data: SAMPLE_PROJECTS });

      const { result } = renderHook(() => useProjects(), {
        wrapper: createWrapper(),
      });

      // Initially loading
      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();

      // Wait for data to resolve
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isError).toBe(false);
      expect(result.current.data).toEqual(SAMPLE_PROJECTS);
      expect(result.current.data).toHaveLength(2);

      // Verify API was called with correct endpoint
      expect(mockedApi.get).toHaveBeenCalledWith('/projects');
    });

    it('renders project data from API, not mock constants', async () => {
      (mockedApi.get as jest.Mock).mockResolvedValueOnce({ data: SAMPLE_PROJECTS });

      const { result } = renderHook(() => useProjects(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const projects = result.current.data!;

      // Verify data comes from API response
      expect(projects[0].name).toBe('Matemáticas Avanzadas');
      expect(projects[1].name).toBe('Física Cuántica');

      // Verify no mock data constants appear in the data
      const serialized = JSON.stringify(projects);
      for (const mockConst of MOCK_DATA_CONSTANTS) {
        expect(serialized).not.toContain(mockConst);
      }
    });
  });

  describe('Loading → Error state flow', () => {
    it('transitions to error state when API fails', async () => {
      const networkError = new Error('Network Error');
      (mockedApi.get as jest.Mock).mockRejectedValueOnce(networkError);

      const { result } = renderHook(() => useProjects(), {
        wrapper: createWrapper(),
      });

      // Initially loading
      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should be in error state, not showing mock data
      expect(result.current.isError).toBe(true);
      expect(result.current.error).toBeTruthy();
      expect(result.current.data).toBeUndefined();
    });

    it('does not fall back to mock data on server error', async () => {
      const serverError = {
        response: { status: 500, data: { message: 'Internal Server Error' } },
        isAxiosError: true,
      };
      (mockedApi.get as jest.Mock).mockRejectedValueOnce(serverError);

      const { result } = renderHook(() => useProjects(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // Data should be undefined, not mock data
      expect(result.current.data).toBeUndefined();
    });
  });

  describe('Loading → Empty state flow', () => {
    it('returns empty array when API returns no projects', async () => {
      (mockedApi.get as jest.Mock).mockResolvedValueOnce({ data: [] });

      const { result } = renderHook(() => useProjects(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isError).toBe(false);
      expect(result.current.data).toEqual([]);
      expect(result.current.data).toHaveLength(0);
    });
  });

  describe('Refetch behavior', () => {
    it('can refetch data after initial load', async () => {
      (mockedApi.get as jest.Mock)
        .mockResolvedValueOnce({ data: SAMPLE_PROJECTS })
        .mockResolvedValueOnce({ data: [...SAMPLE_PROJECTS, {
          id: 'proj-3',
          name: 'Historia Universal',
          description: 'Historia moderna',
          progress: 10,
          tasksCount: 5,
          completedTasks: 0,
          lastAccessed: '2025-01-16T08:00:00Z',
          color: '#27AE60',
        }] });

      const { result } = renderHook(() => useProjects(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.data).toHaveLength(2);
      });

      // Trigger refetch
      result.current.refetch();

      await waitFor(() => {
        expect(result.current.data).toHaveLength(3);
      });

      expect(result.current.data![2].name).toBe('Historia Universal');
    });
  });
});
