/**
 * useDraftAutoSave Hook
 *
 * Auto-saves form state to AsyncStorage on a debounced interval.
 * Provides load and clear functions for draft management.
 * Key format: `draft:{formType}:{entityId}` or `draft:{formType}:new`
 *
 * Validates: Requirements 9.7
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef } from 'react';

export interface UseDraftAutoSaveOptions<T extends Record<string, unknown>> {
  /** Form type identifier (e.g., 'ticket', 'task') */
  formType: string;
  /** Entity ID for existing entities, omit or undefined for new entities */
  entityId?: string;
  /** Current form values to auto-save */
  values: T;
  /** Whether auto-save is enabled (default: true) */
  enabled?: boolean;
  /** Debounce interval in milliseconds (default: 5000) */
  debounceMs?: number;
}

export interface UseDraftAutoSaveReturn<T extends Record<string, unknown>> {
  /** Load a previously saved draft. Returns null if none exists. */
  loadDraft: () => Promise<T | null>;
  /** Clear the saved draft from storage. */
  clearDraft: () => Promise<void>;
  /** The storage key used for this draft. */
  draftKey: string;
}

/**
 * Build the AsyncStorage key for a draft.
 */
export function buildDraftKey(formType: string, entityId?: string): string {
  return `draft:${formType}:${entityId ?? 'new'}`;
}

/**
 * useDraftAutoSave
 *
 * @param options - Configuration for draft auto-save behavior
 * @returns Functions to load and clear drafts, plus the storage key
 */
export function useDraftAutoSave<T extends Record<string, unknown>>(
  options: UseDraftAutoSaveOptions<T>
): UseDraftAutoSaveReturn<T> {
  const {
    formType,
    entityId,
    values,
    enabled = true,
    debounceMs = 5000,
  } = options;

  const draftKey = buildDraftKey(formType, entityId);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestValuesRef = useRef<T>(values);

  // Keep the ref in sync with the latest values
  latestValuesRef.current = values;

  /**
   * Save current values to AsyncStorage.
   */
  const saveDraft = useCallback(async () => {
    try {
      const serialized = JSON.stringify(latestValuesRef.current);
      await AsyncStorage.setItem(draftKey, serialized);
    } catch {
      // Silently ignore storage errors — draft save is best-effort
    }
  }, [draftKey]);

  /**
   * Debounced auto-save: whenever values change, reset the timer
   * and save after the debounce interval.
   */
  useEffect(() => {
    if (!enabled) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      saveDraft();
    }, debounceMs);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [values, enabled, debounceMs, saveDraft]);

  /**
   * Load a previously saved draft from AsyncStorage.
   */
  const loadDraft = useCallback(async (): Promise<T | null> => {
    try {
      const raw = await AsyncStorage.getItem(draftKey);
      if (raw === null) return null;
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }, [draftKey]);

  /**
   * Clear the saved draft from AsyncStorage.
   */
  const clearDraft = useCallback(async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(draftKey);
    } catch {
      // Silently ignore
    }
  }, [draftKey]);

  return { loadDraft, clearDraft, draftKey };
}
