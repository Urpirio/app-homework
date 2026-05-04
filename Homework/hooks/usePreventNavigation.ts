/**
 * usePreventNavigation Hook
 *
 * Wraps React Navigation's `usePreventRemove` to warn users when navigating
 * away from a form with unsaved changes. Shows a native Alert dialog.
 *
 * Validates: Requirements 9.7
 */

import { useNavigation, usePreventRemove } from '@react-navigation/native';
import { Alert } from 'react-native';

export interface UsePreventNavigationOptions {
  /** Whether the form has unsaved changes */
  isDirty: boolean;
  /** Title for the confirmation dialog */
  title?: string;
  /** Message for the confirmation dialog */
  message?: string;
}

/**
 * usePreventNavigation
 *
 * Shows a native alert when the user tries to navigate away from a dirty form.
 * If the user confirms, the original navigation action is dispatched.
 *
 * @param options - Configuration for navigation prevention
 */
export function usePreventNavigation(options: UsePreventNavigationOptions): void {
  const {
    isDirty,
    title = 'Unsaved Changes',
    message = 'You have unsaved changes. Are you sure you want to leave?',
  } = options;

  const navigation = useNavigation();

  usePreventRemove(isDirty, ({ data }) => {
    Alert.alert(title, message, [
      { text: 'Stay', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: () => {
          navigation.dispatch(data.action);
        },
      },
    ]);
  });
}
