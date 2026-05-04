/**
 * Tests for usePreventNavigation hook
 *
 * Validates: Requirements 9.7
 */

import { renderHook } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { usePreventNavigation } from '../usePreventNavigation';

// Track the callback passed to usePreventRemove
let preventRemoveCallback: ((e: { data: { action: any } }) => void) | null = null;
let preventRemoveCondition = false;

const mockDispatch = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    dispatch: mockDispatch,
  }),
  usePreventRemove: (condition: boolean, callback: (e: { data: { action: any } }) => void) => {
    preventRemoveCondition = condition;
    preventRemoveCallback = callback;
  },
}));

jest.spyOn(Alert, 'alert');

beforeEach(() => {
  jest.clearAllMocks();
  preventRemoveCallback = null;
  preventRemoveCondition = false;
});

describe('usePreventNavigation', () => {
  it('should enable prevention when isDirty is true', () => {
    renderHook(() =>
      usePreventNavigation({ isDirty: true })
    );

    expect(preventRemoveCondition).toBe(true);
  });

  it('should disable prevention when isDirty is false', () => {
    renderHook(() =>
      usePreventNavigation({ isDirty: false })
    );

    expect(preventRemoveCondition).toBe(false);
  });

  it('should show alert with default title and message when triggered', () => {
    renderHook(() =>
      usePreventNavigation({ isDirty: true })
    );

    const mockAction = { type: 'GO_BACK' };
    preventRemoveCallback?.({ data: { action: mockAction } });

    expect(Alert.alert).toHaveBeenCalledWith(
      'Unsaved Changes',
      'You have unsaved changes. Are you sure you want to leave?',
      expect.arrayContaining([
        expect.objectContaining({ text: 'Stay', style: 'cancel' }),
        expect.objectContaining({ text: 'Leave', style: 'destructive' }),
      ])
    );
  });

  it('should show alert with custom title and message', () => {
    renderHook(() =>
      usePreventNavigation({
        isDirty: true,
        title: 'Draft Not Saved',
        message: 'Your draft will be lost.',
      })
    );

    preventRemoveCallback?.({ data: { action: { type: 'GO_BACK' } } });

    expect(Alert.alert).toHaveBeenCalledWith(
      'Draft Not Saved',
      'Your draft will be lost.',
      expect.any(Array)
    );
  });

  it('should dispatch the action when user confirms "Leave"', () => {
    renderHook(() =>
      usePreventNavigation({ isDirty: true })
    );

    const mockAction = { type: 'GO_BACK' };
    preventRemoveCallback?.({ data: { action: mockAction } });

    // Get the "Leave" button's onPress callback
    const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
    const buttons = alertCall[2];
    const leaveButton = buttons.find((b: any) => b.text === 'Leave');

    leaveButton.onPress();

    expect(mockDispatch).toHaveBeenCalledWith(mockAction);
  });

  it('should not dispatch when user taps "Stay"', () => {
    renderHook(() =>
      usePreventNavigation({ isDirty: true })
    );

    preventRemoveCallback?.({ data: { action: { type: 'GO_BACK' } } });

    const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
    const buttons = alertCall[2];
    const stayButton = buttons.find((b: any) => b.text === 'Stay');

    // "Stay" has no onPress — it just dismisses the alert
    expect(stayButton.onPress).toBeUndefined();
    expect(mockDispatch).not.toHaveBeenCalled();
  });
});
