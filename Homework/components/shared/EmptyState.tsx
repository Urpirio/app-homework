/**
 * EmptyState Component
 *
 * Displays a centered empty state with an icon, title, message,
 * and an optional call-to-action button.
 *
 * Validates: Requirements 4.7, 10.5
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';

import { useTheme } from '../../hooks/useTheme';

export interface EmptyStateProps {
  /** Ionicons icon name */
  icon: keyof typeof Ionicons.glyphMap;
  /** Primary title text */
  title: string;
  /** Descriptive message */
  message: string;
  /** Optional CTA button label */
  actionLabel?: string;
  /** Called when the CTA button is pressed */
  onAction?: () => void;
  /** Additional container styles */
  style?: ViewStyle;
}

export function EmptyState({ icon, title, message, actionLabel, onAction, style }: EmptyStateProps) {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, style]} accessibilityRole="none">
      <Ionicons
        name={icon}
        size={56}
        color={theme.colors.textSecondary}
        style={styles.icon}
      />
      <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
      <Text style={[styles.message, { color: theme.colors.textSecondary }]}>{message}</Text>
      {actionLabel && onAction && (
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
          onPress={onAction}
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
  title: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
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
