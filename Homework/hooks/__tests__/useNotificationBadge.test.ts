/**
 * Tests for useNotificationBadge hook.
 *
 * Validates: Requirements 5.2, 5.7
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import React from 'react';

import { useNotificationBadge } from '../useNotificationBadge';

// Mock the api module
jest.mock('../../utils/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}));

// Mock the socket manager
jest.mock('../../utils/socket', () => ({
  onNewNotification: jest.fn(),
}));

import api from '../../utils/api';
import * as socketManager from '../../utils/socket';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });

  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('useNotificationBadge', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 0 when API returns no unread notifications', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: { total: 0 } });

    const { result } = renderHook(() => useNotificationBadge(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.count).toBe(0);
    });
  });

  it('returns the unread count from API', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: { total: 5 } });

    const { result } = renderHook(() => useNotificationBadge(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.count).toBe(5);
    });
  });

  it('decrementBadge reduces count by 1', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: { total: 3 } });

    const { result } = renderHook(() => useNotificationBadge(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.count).toBe(3);
    });

    act(() => {
      result.current.decrementBadge();
    });

    await waitFor(() => {
      expect(result.current.count).toBe(2);
    });
  });

  it('decrementBadge does not go below 0', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: { total: 0 } });

    const { result } = renderHook(() => useNotificationBadge(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.count).toBe(0);
    });

    act(() => {
      result.current.decrementBadge();
    });

    expect(result.current.count).toBe(0);
  });

  it('resetBadge sets count to 0', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: { total: 10 } });

    const { result } = renderHook(() => useNotificationBadge(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.count).toBe(10);
    });

    act(() => {
      result.current.resetBadge();
    });

    await waitFor(() => {
      expect(result.current.count).toBe(0);
    });
  });

  it('registers a WebSocket listener for new notifications', () => {
    (api.get as jest.Mock).mockResolvedValue({ data: { total: 0 } });

    renderHook(() => useNotificationBadge(), {
      wrapper: createWrapper(),
    });

    expect(socketManager.onNewNotification).toHaveBeenCalledWith(
      expect.any(Function)
    );
  });

  it('returns 0 when API call fails', async () => {
    (api.get as jest.Mock).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useNotificationBadge(), {
      wrapper: createWrapper(),
    });

    // Should default to 0 on error
    await waitFor(() => {
      expect(result.current.count).toBe(0);
    });
  });
});
