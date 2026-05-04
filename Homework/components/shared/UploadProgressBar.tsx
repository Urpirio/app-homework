/**
 * UploadProgressBar Component
 *
 * Displays a visual progress bar with percentage text and estimated time remaining
 * for file upload operations. Styled to match the app's dark/light theme.
 *
 * Validates: Requirements 8.2, 1.3
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { UploadStatus } from '../../hooks/api/useUploads';
import { useTheme } from '../../hooks/useTheme';

export interface UploadProgressBarProps {
  /** Upload progress from 0 to 100 */
  progress: number;
  /** Current upload status */
  status: UploadStatus;
  /** Estimated time remaining in seconds, or null if not yet calculated */
  estimatedTimeRemaining?: number | null;
}

/**
 * Formats seconds into a human-readable time string.
 * Examples: "< 1s", "5s", "1m 30s", "2m"
 */
export function formatTimeRemaining(seconds: number | null | undefined): string | null {
  if (seconds == null || seconds < 0) {
    return null;
  }

  const rounded = Math.ceil(seconds);

  if (rounded < 1) {
    return '< 1s';
  }

  if (rounded < 60) {
    return `${rounded}s`;
  }

  const minutes = Math.floor(rounded / 60);
  const remainingSeconds = rounded % 60;

  if (remainingSeconds === 0) {
    return `${minutes}m`;
  }

  return `${minutes}m ${remainingSeconds}s`;
}

export function UploadProgressBar({
  progress,
  status,
  estimatedTimeRemaining,
}: UploadProgressBarProps) {
  const { theme } = useTheme();

  // Clamp progress between 0 and 100
  const clampedProgress = Math.max(0, Math.min(100, progress));

  const barColor =
    status === 'error'
      ? theme.colors.error
      : status === 'success'
        ? theme.colors.success
        : theme.colors.primary;

  const timeText = formatTimeRemaining(estimatedTimeRemaining);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.percentageText, { color: theme.colors.text }]}>
          {status === 'error'
            ? 'Upload failed'
            : status === 'success'
              ? 'Upload complete'
              : `${clampedProgress}%`}
        </Text>
        {status === 'uploading' && timeText && (
          <Text style={[styles.etaText, { color: theme.colors.textSecondary }]}>
            {timeText} remaining
          </Text>
        )}
      </View>
      <View
        style={[
          styles.trackBar,
          { backgroundColor: theme.colors.inputBackground },
        ]}
      >
        <View
          style={[
            styles.fillBar,
            {
              backgroundColor: barColor,
              width: `${clampedProgress}%`,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  percentageText: {
    fontSize: 13,
    fontWeight: '600',
  },
  etaText: {
    fontSize: 12,
  },
  trackBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fillBar: {
    height: '100%',
    borderRadius: 3,
  },
});
