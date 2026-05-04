/**
 * Tests for InstitutionContext and InstitutionProvider
 *
 * Validates: Requirements 7.6
 */

import { useInstitution } from '@/hooks/useInstitution';
import { act, renderHook } from '@testing-library/react-native';
import React from 'react';
import {
    InstitutionProvider,
} from '../InstitutionContext';

// Mock queryClient
const mockInvalidateQueries = jest.fn().mockResolvedValue(undefined);
jest.mock('@/utils/queryClient', () => ({
  queryClient: {
    invalidateQueries: (...args: unknown[]) => mockInvalidateQueries(...args),
  },
}));

function wrapper({ children }: { children: React.ReactNode }) {
  return <InstitutionProvider>{children}</InstitutionProvider>;
}

describe('InstitutionContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('provides null institutionId by default', () => {
    const { result } = renderHook(() => useInstitution(), { wrapper });

    expect(result.current.institutionId).toBeNull();
    expect(typeof result.current.setInstitutionId).toBe('function');
  });

  it('updates institutionId when setInstitutionId is called', () => {
    const { result } = renderHook(() => useInstitution(), { wrapper });

    act(() => {
      result.current.setInstitutionId('inst-123');
    });

    expect(result.current.institutionId).toBe('inst-123');
  });

  it('invalidates institution-scoped React Query caches on institution change', () => {
    const { result } = renderHook(() => useInstitution(), { wrapper });

    act(() => {
      result.current.setInstitutionId('inst-456');
    });

    // Should invalidate all institution-scoped query keys
    const expectedKeys = [
      'institutions',
      'institution-stats',
      'classrooms',
      'users',
      'teachers',
      'students',
      'subjects',
      'tickets',
      'schedules',
      'dashboard',
      'admin-dashboard',
    ];

    expect(mockInvalidateQueries).toHaveBeenCalledTimes(expectedKeys.length);

    expectedKeys.forEach((key) => {
      expect(mockInvalidateQueries).toHaveBeenCalledWith({
        queryKey: [key],
      });
    });
  });

  it('allows setting institutionId to null', () => {
    const { result } = renderHook(() => useInstitution(), { wrapper });

    act(() => {
      result.current.setInstitutionId('inst-789');
    });

    expect(result.current.institutionId).toBe('inst-789');

    act(() => {
      result.current.setInstitutionId(null);
    });

    expect(result.current.institutionId).toBeNull();
  });

  it('invalidates caches even when setting to null', () => {
    const { result } = renderHook(() => useInstitution(), { wrapper });

    act(() => {
      result.current.setInstitutionId(null);
    });

    // Cache invalidation should still happen
    expect(mockInvalidateQueries).toHaveBeenCalled();
  });

  it('supports multiple sequential institution switches', () => {
    const { result } = renderHook(() => useInstitution(), { wrapper });

    act(() => {
      result.current.setInstitutionId('inst-1');
    });
    expect(result.current.institutionId).toBe('inst-1');

    mockInvalidateQueries.mockClear();

    act(() => {
      result.current.setInstitutionId('inst-2');
    });
    expect(result.current.institutionId).toBe('inst-2');

    // Should invalidate caches again on second switch
    expect(mockInvalidateQueries).toHaveBeenCalled();
  });
});
