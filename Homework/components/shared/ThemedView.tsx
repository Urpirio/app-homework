import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

/**
 * Props for the ThemedView component
 */
export interface ThemedViewProps {
  /**
   * Child components to render inside the view
   */
  children: React.ReactNode;
  
  /**
   * Additional styles to apply to the view
   */
  style?: ViewStyle;
  
  /**
   * Optional custom background color for light mode
   * If not provided, uses theme.colors.background
   */
  lightColor?: string;
  
  /**
   * Optional custom background color for dark mode
   * If not provided, uses theme.colors.background
   */
  darkColor?: string;
}

/**
 * ThemedView Component
 * 
 * A container component that automatically applies colors based on the current theme (light/dark mode).
 * This component serves as a base container throughout the app, ensuring consistent theming.
 * 
 * @component
 * @example
 * ```tsx
 * // Basic usage with default theme colors
 * <ThemedView>
 *   <Text>Content here</Text>
 * </ThemedView>
 * 
 * // With custom colors per theme
 * <ThemedView 
 *   lightColor="#F5F5F5" 
 *   darkColor="#1A1A1A"
 * >
 *   <Text>Content with custom background</Text>
 * </ThemedView>
 * 
 * // With additional styles
 * <ThemedView style={{ padding: 20, borderRadius: 8 }}>
 *   <Text>Styled content</Text>
 * </ThemedView>
 * ```
 * 
 * **Validates: Requirements 7.1, 7.2**
 * - 7.1: Splash screen adapts colors according to system theme
 * - 7.2: Login screen adapts colors according to system theme
 */
export function ThemedView({ 
  children, 
  style, 
  lightColor, 
  darkColor 
}: ThemedViewProps) {
  // Get the current theme and dark mode status
  const { theme, isDark } = useTheme();
  
  // Determine the background color based on theme
  // Priority: custom color (lightColor/darkColor) > theme default
  const backgroundColor = isDark
    ? (darkColor ?? theme.colors.background)
    : (lightColor ?? theme.colors.background);
  
  return (
    <View style={[styles.container, { backgroundColor }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // Base container styles
    // backgroundColor will be overridden by the theme-based color
  },
});
