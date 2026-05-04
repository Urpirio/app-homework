/**
 * Integration Tests: Task Submission Flow
 *
 * Tests the end-to-end data flow for task detail and submission:
 * API → useTask hook → task data display
 * File upload → useFileUpload → useCreateSubmission → submission created
 *
 * Verifies no mock task data ('t1', 't2') or setTimeout simulation is used.
 *
 * Validates: Requirements 4.5, 1.1, 1.2, 1.3, 1.4, 4.7
 */

import { useCreateSubmission } from '@/hooks/api/useSubmissions';
import { useTask } from '@/hooks/api/useTasks';
import type { FileInput } from '@/hooks/api/useUploads';
import { validateFile } from '@/hooks/api/useUploads';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
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

/** Sample task data from GET /tasks/{id} */
const SAMPLE_TASK = {
  id: 'task-abc-123',
  title: 'Ensayo sobre la Revolución Industrial',
  description: 'Escribe un ensayo de 2000 palabras sobre el impacto de la Revolución Industrial.',
  status: 'TODO' as const,
  type: 'ASSIGNMENT' as const,
  maxGrade: 100,
  dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
  createdAt: '2025-01-10T08:00:00Z',
  project: { name: 'Historia Universal' },
  submissions: [],
  resources: [
    { id: 'res-1', name: 'Guía de estilo.pdf', fileName: 'guia.pdf' },
  ],
};

/** Sample task with existing submission */
const SAMPLE_TASK_WITH_SUBMISSION = {
  ...SAMPLE_TASK,
  id: 'task-def-456',
  submissions: [
    {
      id: 'sub-1',
      taskId: 'task-def-456',
      studentId: 'student-1',
      fileUrl: '/uploads/ensayo-final.pdf',
      content: 'Mi ensayo sobre la revolución industrial',
      status: 'SUBMITTED',
      createdAt: '2025-01-12T14:00:00Z',
      updatedAt: '2025-01-12T14:00:00Z',
    },
  ],
};

/** Sample graded task */
const SAMPLE_TASK_GRADED = {
  ...SAMPLE_TASK,
  id: 'task-ghi-789',
  submissions: [
    {
      id: 'sub-2',
      taskId: 'task-ghi-789',
      studentId: 'student-1',
      fileUrl: '/uploads/ensayo-v2.pdf',
      content: 'Versión final',
      grade: 92,
      feedback: 'Excelente análisis. Muy bien documentado.',
      status: 'GRADED',
      createdAt: '2025-01-11T10:00:00Z',
      updatedAt: '2025-01-13T16:00:00Z',
    },
  ],
};

/** Mock data IDs that must NEVER appear */
const MOCK_TASK_IDS = ['t1', 't2'];

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

describe('Task Submission Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Task detail: Loading → Data rendered flow', () => {
    it('fetches task data from GET /tasks/{id} via useTask hook', async () => {
      (mockedApi.get as jest.Mock).mockResolvedValueOnce({ data: SAMPLE_TASK });

      const { result } = renderHook(() => useTask('task-abc-123'), {
        wrapper: createWrapper(),
      });

      // Initially loading
      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(SAMPLE_TASK);
      expect(result.current.data!.title).toBe('Ensayo sobre la Revolución Industrial');
      expect(mockedApi.get).toHaveBeenCalledWith('/tasks/task-abc-123');
    });

    it('task data does not contain mock task IDs', async () => {
      (mockedApi.get as jest.Mock).mockResolvedValueOnce({ data: SAMPLE_TASK });

      const { result } = renderHook(() => useTask('task-abc-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const task = result.current.data!;
      // Verify the task ID is a real UUID-style ID, not 't1' or 't2'
      for (const mockId of MOCK_TASK_IDS) {
        expect(task.id).not.toBe(mockId);
      }
    });

    it('displays existing submission and grade when task is graded', async () => {
      (mockedApi.get as jest.Mock).mockResolvedValueOnce({ data: SAMPLE_TASK_GRADED });

      const { result } = renderHook(() => useTask('task-ghi-789'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const task = result.current.data as any;
      expect(task.submissions).toHaveLength(1);
      expect(task.submissions[0].grade).toBe(92);
      expect(task.submissions[0].feedback).toBe('Excelente análisis. Muy bien documentado.');
      expect(task.submissions[0].status).toBe('GRADED');
    });
  });

  describe('Task detail: Loading → Error state flow', () => {
    it('transitions to error state when task fetch fails', async () => {
      (mockedApi.get as jest.Mock).mockRejectedValueOnce(new Error('Not Found'));

      const { result } = renderHook(() => useTask('nonexistent-id'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.data).toBeUndefined();
      expect(result.current.error).toBeTruthy();
    });

    it('does not use setTimeout simulation on error', async () => {
      const error = new Error('Server Error');
      (mockedApi.get as jest.Mock).mockRejectedValueOnce(error);

      const { result } = renderHook(() => useTask('task-abc-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // Error should be the actual error, not a simulated one
      expect(result.current.error).toBe(error);
    });
  });

  describe('Task detail: disabled when no ID', () => {
    it('does not fetch when taskId is empty', () => {
      renderHook(() => useTask(''), {
        wrapper: createWrapper(),
      });

      // Should not make any API call when ID is empty
      expect(mockedApi.get).not.toHaveBeenCalled();
    });
  });

  describe('Submission creation flow', () => {
    it('creates submission via POST /submissions', async () => {
      const submissionResponse = {
        id: 'sub-new',
        taskId: 'task-abc-123',
        studentId: 'student-1',
        fileUrl: '/uploads/my-essay.pdf',
        content: 'Mi ensayo',
        status: 'SUBMITTED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      (mockedApi.post as jest.Mock).mockResolvedValueOnce({ data: submissionResponse });

      const { result } = renderHook(() => useCreateSubmission(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        const submission = await result.current.mutateAsync({
          taskId: 'task-abc-123',
          fileUrl: '/uploads/my-essay.pdf',
          content: 'Mi ensayo',
        });

        expect(submission).toEqual(submissionResponse);
      });

      expect(mockedApi.post).toHaveBeenCalledWith('/submissions', {
        taskId: 'task-abc-123',
        fileUrl: '/uploads/my-essay.pdf',
        content: 'Mi ensayo',
      });
    });

    it('handles submission creation failure', async () => {
      const error = new Error('Deadline passed');
      (mockedApi.post as jest.Mock).mockRejectedValueOnce(error);

      const { result } = renderHook(() => useCreateSubmission(), {
        wrapper: createWrapper(),
      });

      await expect(
        act(async () => {
          await result.current.mutateAsync({
            taskId: 'task-abc-123',
            fileUrl: '/uploads/my-essay.pdf',
          });
        })
      ).rejects.toThrow('Deadline passed');
    });
  });

  describe('File validation (client-side)', () => {
    it('accepts valid PDF file', () => {
      const file: FileInput = {
        uri: 'file:///cache/essay.pdf',
        name: 'essay.pdf',
        mimeType: 'application/pdf',
        size: 5 * 1024 * 1024, // 5MB
      };

      expect(validateFile(file)).toBeNull();
    });

    it('rejects file exceeding 50MB limit', () => {
      const file: FileInput = {
        uri: 'file:///cache/huge-video.mp4',
        name: 'huge-video.mp4',
        mimeType: 'video/mp4',
        size: 60 * 1024 * 1024, // 60MB
      };

      const error = validateFile(file);
      expect(error).not.toBeNull();
      expect(error!.code).toBe('FILE_TOO_LARGE');
    });

    it('rejects unsupported file type', () => {
      const file: FileInput = {
        uri: 'file:///cache/script.exe',
        name: 'script.exe',
        mimeType: 'application/x-msdownload',
        size: 1024,
      };

      const error = validateFile(file);
      expect(error).not.toBeNull();
      expect(error!.code).toBe('INVALID_MIME_TYPE');
    });

    it('accepts all supported MIME types', () => {
      const supportedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'video/mp4',
        'video/quicktime',
      ];

      for (const mimeType of supportedTypes) {
        const file: FileInput = {
          uri: `file:///cache/test-file`,
          name: 'test-file',
          mimeType,
          size: 1024,
        };
        expect(validateFile(file)).toBeNull();
      }
    });
  });
});
