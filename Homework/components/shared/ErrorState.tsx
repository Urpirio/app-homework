/**
 * ErrorState Component
 *
 * Displays a categorized error with an icon matching the error category,
 * a user-friendly message, and an action button (Retry/Login/Back/Contact Support).
 *
 * Validates: Requirements 4.7, 9.3, 9.4
 */

import { Ionicons } from '@expo/vector-icons';
import { AxiosError } from 'axios';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';

import { useTheme } from '../../hooks/useTheme';
import { CategorizedError, categorizeError } from '../../utils/errorHandler';

export interface ErrorStateProps {
  /** A pre-categorized error or a raw AxiosError to categorize */
  error: CategorizedError | AxiosError | Error;
  /** Called when the user taps Retry */
  onRetry?: () => void;
  /** Called when the user taps Login */
  onLogin?: () => void;
  /** Called when the user taps Back */
  onBack?: () => void;
  /** Additional container styles */
  style?: ViewStyle;
}

const CATEGORY_ICONS: Record<CategorizedError['category'], keyof typeof Ionicons.glyphMap> = {
  network: 'wifi-outline',
  timeout: 'time-outline',
  auth: 'lock-closed-outline',
  permission: 'shield-outline',
  server: 'server-outline',
  validation: 'alert-circle-outline',
  unknown: 'alert-circle-outline',
};

const ACTION_LABELS: Record<CategorizedError['action'], string> = {
  retry: 'Retry',
  login: 'Log In',
  back: 'Go Back',
  contact_support: 'Contact Support',
  fix_input: 'Try Again',
};

function isCategorizedError(error: unknown): error is CategorizedError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'category' in error &&
    'userMessage' in error &&
    'action' in error
  );
}

function isAxiosError(error: unknown): error is AxiosError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'isAxiosError' in error &&
    (error as AxiosError).isAxiosError === true
  );
}

export function ErrorState({ error, onRetry, onLogin, onBack, style }: ErrorStateProps) {
  const { theme } = useTheme();

  const categorized: CategorizedError = isCategorizedError(error)
    ? error
    : isAxiosError(error)
      ? categorizeError(error)
      : {
          category: 'unknown' as const,
          userMessage: error.message || 'An unexpected error occurred.',
          retryable: false,
          action: 'contact_support' as const,
        };

  const iconName = CATEGORY_ICONS[categorized.category];
  const actionLabel = ACTION_LABELS[categorized.action];

  const handleAction = () => {
    switch (categorized.action) {
      case 'retry':
      case 'fix_input':
        onRetry?.();
        break;
      case 'login':
        onLogin?.();
        break;
      case 'back':
        onBack?.();
        break;
      case 'contact_support':
        onRetry?.();
        break;
    }
  };

  const hasAction =
    (categorized.action === 'retry' && onRetry) ||
    (categorized.action === 'fix_input' && onRetry) ||
    (categorized.action === 'login' && onLogin) ||
    (categorized.action === 'back' && onBack) ||
    (categorized.action === 'contact_support' && onRetry);

  return (
    <View
      style={[styles.container, style]}
      accessibilityRole="alert"
      accessibilityLabel={categorized.userMessage}
    >
      <Ionicons
        name={iconName}
        size={48}
        color={theme.colors.textSecondary}
        style={styles.icon}
      />
      <Text style={[styles.message, { color: theme.colors.text }]}>
        {categorized.userMessage}
      </Text>
      {hasAction && (
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleAction}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
        >
          <Text style={styles.actionButtonText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  icon: {
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  actionButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
