/**
 * useDashboardLayout Hook
 *
 * Manages the customizable dashboard widget layout with AsyncStorage persistence.
 * Loads the user's saved layout on mount, falls back to role-based defaults,
 * and persists changes on reorder or visibility toggle.
 *
 * Validates: Requirements 14.10
 */

import {
    buildLayoutKey,
    DashboardWidget,
    getDefaultLayout,
    isValidLayout,
} from '@/constants/dashboardWidgets';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

export interface UseDashboardLayoutOptions {
  /** The current user's ID, used for the AsyncStorage key */
  userId: string;
  /** The current user's role, used for default layout selection */
  role: string;
}

export interface UseDashboardLayoutResult {
  /** The current ordered list of widgets (includes hidden ones) */
  widgets: DashboardWidget[];
  /** Only the visible widgets, in order */
  visibleWidgets: DashboardWidget[];
  /** Whether the layout is still loading from storage */
  loading: boolean;
  /** Replace the entire widget list (e.g., after drag-and-drop reorder) */
  reorder: (reordered: DashboardWidget[]) => void;
  /** Toggle visibility of a single widget by ID */
  toggleWidget: (widgetId: string) => void;
  /** Reset layout to the role-based default */
  resetToDefault: () => void;
}

export function useDashboardLayout({
  userId,
  role,
}: UseDashboardLayoutOptions): UseDashboardLayoutResult {
  const [widgets, setWidgets] = useState<DashboardWidget[]>(() =>
    getDefaultLayout(role)
  );
  const [loading, setLoading] = useState(true);

  const storageKey = buildLayoutKey(userId);

  // Load saved layout from AsyncStorage on mount
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const stored = await AsyncStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (isValidLayout(parsed) && !cancelled) {
            setWidgets(parsed);
          }
        }
      } catch {
        // Corrupted data — fall back to default (already set via initial state)
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [storageKey]);

  // Persist layout to AsyncStorage whenever it changes (after initial load)
  const persist = useCallback(
    (layout: DashboardWidget[]) => {
      AsyncStorage.setItem(storageKey, JSON.stringify(layout)).catch(() => {
        // Silently ignore write failures — layout is still in memory
      });
    },
    [storageKey]
  );

  const reorder = useCallback(
    (reordered: DashboardWidget[]) => {
      setWidgets(reordered);
      persist(reordered);
    },
    [persist]
  );

  const toggleWidget = useCallback(
    (widgetId: string) => {
      setWidgets((prev) => {
        const updated = prev.map((w) =>
          w.id === widgetId ? { ...w, visible: !w.visible } : w
        );
        persist(updated);
        return updated;
      });
    },
    [persist]
  );

  const resetToDefault = useCallback(() => {
    const defaultLayout = getDefaultLayout(role);
    setWidgets(defaultLayout);
    AsyncStorage.removeItem(storageKey).catch(() => {
      // Silently ignore — next load will use defaults anyway
    });
  }, [role, storageKey]);

  const visibleWidgets = widgets.filter((w) => w.visible);

  return {
    widgets,
    visibleWidgets,
    loading,
    reorder,
    toggleWidget,
    resetToDefault,
  };
}
