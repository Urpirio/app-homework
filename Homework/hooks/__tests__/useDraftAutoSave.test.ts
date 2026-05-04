/**
 * Tests for useDraftAutoSave hook
 *
 * Validates: Requirements 9.7
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook } from '@testing-library/react-native';
import { buildDraftKey, useDraftAutoSave } from '../useDraftAutoSave';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
}));

const mockedAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('buildDraftKey', () => {
  it('should build key with entityId', () => {
    expect(buildDraftKey('ticket', 'abc-123')).toBe('draft:ticket:abc-123');
  });

  it('should build key with "new" when entityId is undefined', () => {
    expect(buildDraftKey('task')).toBe('draft:task:new');
  });

  it('should build key with "new" when entityId is explicitly undefined', () => {
    expect(buildDraftKey('task', undefined)).toBe('draft:task:new');
  });
});

describe('useDraftAutoSave', () => {
  const defaultValues = { title: '', description: '' };

  it('should return the correct draft key', () => {
    const { result } = renderHook(() =>
      useDraftAutoSave({
        formType: 'ticket',
        entityId: '123',
        values: defaultValues,
      })
    );

    expect(result.current.draftKey).toBe('draft:ticket:123');
  });

  it('should use "new" in key when no entityId is provided', () => {
    const { result } = renderHook(() =>
      useDraftAutoSave({
        formType: 'task',
        values: defaultValues,
      })
    );

    expect(result.current.draftKey).toBe('draft:task:new');
  });

  describe('auto-save', () => {
    it('should save to AsyncStorage after debounce interval', async () => {
      const values = { title: 'My ticket', description: 'Details' };

      renderHook(() =>
        useDraftAutoSave({
          formType: 'ticket',
          values,
          debounceMs: 3000,
        })
      );

      // Should not have saved yet
      expect(mockedAsyncStorage.setItem).not.toHaveBeenCalled();

      // Advance past debounce
      await act(async () => {
        jest.advanceTimersByTime(3000);
      });

      expect(mockedAsyncStorage.setItem).toHaveBeenCalledWith(
        'draft:ticket:new',
        JSON.stringify(values)
      );
    });

    it('should debounce saves when values change rapidly', async () => {
      let currentValues = { title: 'A', description: '' };

      const { rerender } = renderHook(
        ({ values }) =>
          useDraftAutoSave({
            formType: 'ticket',
            values,
            debounceMs: 5000,
          }),
        { initialProps: { values: currentValues } }
      );

      // Change values before debounce fires
      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      currentValues = { title: 'AB', description: '' };
      rerender({ values: currentValues });

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      // Should not have saved yet — timer was reset
      expect(mockedAsyncStorage.setItem).not.toHaveBeenCalled();

      currentValues = { title: 'ABC', description: 'test' };
      rerender({ values: currentValues });

      // Advance past the full debounce from last change
      await act(async () => {
        jest.advanceTimersByTime(5000);
      });

      // Should have saved the latest values
      expect(mockedAsyncStorage.setItem).toHaveBeenCalledTimes(1);
      expect(mockedAsyncStorage.setItem).toHaveBeenCalledWith(
        'draft:ticket:new',
        JSON.stringify({ title: 'ABC', description: 'test' })
      );
    });

    it('should not save when enabled is false', async () => {
      renderHook(() =>
        useDraftAutoSave({
          formType: 'ticket',
          values: { title: 'test', description: '' },
          enabled: false,
          debounceMs: 1000,
        })
      );

      await act(async () => {
        jest.advanceTimersByTime(5000);
      });

      expect(mockedAsyncStorage.setItem).not.toHaveBeenCalled();
    });

    it('should silently handle AsyncStorage write errors', async () => {
      mockedAsyncStorage.setItem.mockRejectedValueOnce(new Error('Storage full'));

      renderHook(() =>
        useDraftAutoSave({
          formType: 'ticket',
          values: { title: 'test', description: '' },
          debounceMs: 1000,
        })
      );

      // Should not throw
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      expect(mockedAsyncStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('loadDraft', () => {
    it('should return parsed draft when one exists', async () => {
      const savedDraft = { title: 'Saved title', description: 'Saved desc' };
      mockedAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(savedDraft));

      const { result } = renderHook(() =>
        useDraftAutoSave({
          formType: 'ticket',
          entityId: '456',
          values: defaultValues,
        })
      );

      let loaded: typeof defaultValues | null = null;
      await act(async () => {
        loaded = await result.current.loadDraft();
      });

      expect(loaded).toEqual(savedDraft);
      expect(mockedAsyncStorage.getItem).toHaveBeenCalledWith('draft:ticket:456');
    });

    it('should return null when no draft exists', async () => {
      mockedAsyncStorage.getItem.mockResolvedValueOnce(null);

      const { result } = renderHook(() =>
        useDraftAutoSave({
          formType: 'task',
          values: defaultValues,
        })
      );

      let loaded: typeof defaultValues | null = { title: 'x', description: 'x' };
      await act(async () => {
        loaded = await result.current.loadDraft();
      });

      expect(loaded).toBeNull();
    });

    it('should return null on AsyncStorage read error', async () => {
      mockedAsyncStorage.getItem.mockRejectedValueOnce(new Error('Read error'));

      const { result } = renderHook(() =>
        useDraftAutoSave({
          formType: 'task',
          values: defaultValues,
        })
      );

      let loaded: typeof defaultValues | null = { title: 'x', description: 'x' };
      await act(async () => {
        loaded = await result.current.loadDraft();
      });

      expect(loaded).toBeNull();
    });
  });

  describe('clearDraft', () => {
    it('should remove the draft from AsyncStorage', async () => {
      const { result } = renderHook(() =>
        useDraftAutoSave({
          formType: 'ticket',
          entityId: '789',
          values: defaultValues,
        })
      );

      await act(async () => {
        await result.current.clearDraft();
      });

      expect(mockedAsyncStorage.removeItem).toHaveBeenCalledWith('draft:ticket:789');
    });

    it('should silently handle AsyncStorage remove error', async () => {
      mockedAsyncStorage.removeItem.mockRejectedValueOnce(new Error('Remove error'));

      const { result } = renderHook(() =>
        useDraftAutoSave({
          formType: 'ticket',
          values: defaultValues,
        })
      );

      // Should not throw
      await act(async () => {
        await result.current.clearDraft();
      });

      expect(mockedAsyncStorage.removeItem).toHaveBeenCalled();
    });
  });

  describe('default debounce', () => {
    it('should default to 5000ms debounce', async () => {
      renderHook(() =>
        useDraftAutoSave({
          formType: 'ticket',
          values: { title: 'test', description: '' },
        })
      );

      await act(async () => {
        jest.advanceTimersByTime(4999);
      });
      expect(mockedAsyncStorage.setItem).not.toHaveBeenCalled();

      await act(async () => {
        jest.advanceTimersByTime(1);
      });
      expect(mockedAsyncStorage.setItem).toHaveBeenCalledTimes(1);
    });
  });
});
