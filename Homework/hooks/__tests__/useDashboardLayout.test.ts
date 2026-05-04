/**
 * Tests for useDashboardLayout hook
 *
 * Validates: Requirements 14.10
 */

import {
    DEFAULT_LAYOUTS,
    DashboardWidget,
    WIDGET_IDS,
    WIDGET_TITLES,
} from '@/constants/dashboardWidgets';
import { UserRole } from '@/types/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useDashboardLayout } from '../useDashboardLayout';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

const mockedAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

beforeEach(() => {
  jest.clearAllMocks();
});

const defaultOpts = { userId: 'user-1', role: UserRole.SUPER_ADMIN };

describe('useDashboardLayout', () => {
  describe('initial load', () => {
    it('should start with the default layout for the given role', () => {
      const { result } = renderHook(() => useDashboardLayout(defaultOpts));
      expect(result.current.widgets).toEqual(
        DEFAULT_LAYOUTS[UserRole.SUPER_ADMIN]
      );
    });

    it('should set loading to false after AsyncStorage resolves', async () => {
      const { result } = renderHook(() => useDashboardLayout(defaultOpts));
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should load saved layout from AsyncStorage', async () => {
      const savedLayout: DashboardWidget[] = [
        {
          id: WIDGET_IDS.ACTIVITY_FEED,
          title: WIDGET_TITLES[WIDGET_IDS.ACTIVITY_FEED],
          visible: true,
        },
        {
          id: WIDGET_IDS.STATS_GRID,
          title: WIDGET_TITLES[WIDGET_IDS.STATS_GRID],
          visible: false,
        },
      ];
      mockedAsyncStorage.getItem.mockResolvedValueOnce(
        JSON.stringify(savedLayout)
      );

      const { result } = renderHook(() => useDashboardLayout(defaultOpts));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.widgets).toEqual(savedLayout);
      expect(mockedAsyncStorage.getItem).toHaveBeenCalledWith(
        'dashboard_layout:user-1'
      );
    });

    it('should fall back to defaults when stored data is invalid', async () => {
      mockedAsyncStorage.getItem.mockResolvedValueOnce(
        JSON.stringify([{ id: 'BadWidget', title: 'Bad', visible: true }])
      );

      const { result } = renderHook(() => useDashboardLayout(defaultOpts));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.widgets).toEqual(
        DEFAULT_LAYOUTS[UserRole.SUPER_ADMIN]
      );
    });

    it('should fall back to defaults when AsyncStorage throws', async () => {
      mockedAsyncStorage.getItem.mockRejectedValueOnce(
        new Error('Storage error')
      );

      const { result } = renderHook(() => useDashboardLayout(defaultOpts));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.widgets).toEqual(
        DEFAULT_LAYOUTS[UserRole.SUPER_ADMIN]
      );
    });
  });

  describe('reorder', () => {
    it('should update widget order and persist to AsyncStorage', async () => {
      const { result } = renderHook(() => useDashboardLayout(defaultOpts));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const reversed = [...result.current.widgets].reverse();

      act(() => {
        result.current.reorder(reversed);
      });

      expect(result.current.widgets).toEqual(reversed);
      expect(mockedAsyncStorage.setItem).toHaveBeenCalledWith(
        'dashboard_layout:user-1',
        JSON.stringify(reversed)
      );
    });
  });

  describe('toggleWidget', () => {
    it('should toggle visibility of a widget and persist', async () => {
      const { result } = renderHook(() => useDashboardLayout(defaultOpts));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const firstWidget = result.current.widgets[0];
      const originalVisibility = firstWidget.visible;

      act(() => {
        result.current.toggleWidget(firstWidget.id);
      });

      const toggled = result.current.widgets.find(
        (w) => w.id === firstWidget.id
      );
      expect(toggled?.visible).toBe(!originalVisibility);
      expect(mockedAsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should not affect other widgets when toggling one', async () => {
      const { result } = renderHook(() => useDashboardLayout(defaultOpts));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const before = result.current.widgets.map((w) => ({
        id: w.id,
        visible: w.visible,
      }));

      act(() => {
        result.current.toggleWidget(WIDGET_IDS.STATS_GRID);
      });

      for (const w of result.current.widgets) {
        if (w.id !== WIDGET_IDS.STATS_GRID) {
          const original = before.find((b) => b.id === w.id);
          expect(w.visible).toBe(original?.visible);
        }
      }
    });
  });

  describe('visibleWidgets', () => {
    it('should only include widgets where visible is true', async () => {
      const { result } = renderHook(() =>
        useDashboardLayout({ userId: 'user-1', role: UserRole.SCHOOL_ADMIN })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // SCHOOL_ADMIN has TicketQueue hidden by default
      expect(
        result.current.visibleWidgets.find(
          (w) => w.id === WIDGET_IDS.TICKET_QUEUE
        )
      ).toBeUndefined();
      expect(result.current.visibleWidgets.length).toBeLessThan(
        result.current.widgets.length
      );
    });
  });

  describe('resetToDefault', () => {
    it('should restore the role-based default layout', async () => {
      const { result } = renderHook(() => useDashboardLayout(defaultOpts));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Reorder first
      const reversed = [...result.current.widgets].reverse();
      act(() => {
        result.current.reorder(reversed);
      });
      expect(result.current.widgets).toEqual(reversed);

      // Reset
      act(() => {
        result.current.resetToDefault();
      });

      expect(result.current.widgets).toEqual(
        DEFAULT_LAYOUTS[UserRole.SUPER_ADMIN]
      );
      expect(mockedAsyncStorage.removeItem).toHaveBeenCalledWith(
        'dashboard_layout:user-1'
      );
    });

    it('should use the correct role defaults after reset', async () => {
      const { result } = renderHook(() =>
        useDashboardLayout({ userId: 'user-2', role: UserRole.TEACHER })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.resetToDefault();
      });

      expect(result.current.widgets).toEqual(
        DEFAULT_LAYOUTS[UserRole.TEACHER]
      );
    });
  });

  describe('storage key', () => {
    it('should use the correct key format per user', async () => {
      renderHook(() =>
        useDashboardLayout({ userId: 'abc-123', role: UserRole.STUDENT })
      );

      await waitFor(() => {
        expect(mockedAsyncStorage.getItem).toHaveBeenCalledWith(
          'dashboard_layout:abc-123'
        );
      });
    });
  });
});
