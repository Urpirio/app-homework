import { useTheme } from '@/hooks/useTheme';
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

/**
 * Props for the LoadingIndicator component
 */
export interface LoadingIndicatorProps {
  /** Size of the spinner: 'small' or 'large' */
  size?: 'small' | 'large';
  /** Custom color for the spinner (overrides theme color) */
  color?: string;
}

/**
 * LoadingIndicator component displays an animated spinner during loading states.
 * 
 * Features:
 * - Animated spinner using React Native's ActivityIndicator
 * - Automatically adapts color based on current theme (light/dark)
 * - Supports custom color override
 * - Configurable size (small or large)
 * 
 * @example
 * ```tsx
 * // Default usage with theme color
 * <LoadingIndicator />
 * 
 * // Custom size
 * <LoadingIndicator size="large" />
 * 
 * // Custom color
 * <LoadingIndicator color="#FF0000" />
 * ```
 * 
 * **Validates: Requirements 10.1, 10.4**
 * - 10.1: Shows loading indicator when user taps login button with valid fields
 * - 10.4: Shows animated spinner inside login button during loading
 */
export function LoadingIndicator({ 
  size = 'small', 
  color 
}: LoadingIndicatorProps) {
  const { theme } = useTheme();
  
  // Use custom color if provided, otherwise use theme's primary color
  const spinnerColor = color || theme.colors.primary;
  
  return (
    <View style={styles.container}>
      <ActivityIndicator 
        size={size} 
        color={spinnerColor}
        testID="loading-indicator"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
