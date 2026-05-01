import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedView } from '../shared/ThemedView';

/**
 * Props for the SplashContainer component
 */
export interface SplashContainerProps {
  /**
   * Child components to render inside the container
   */
  children: React.ReactNode;
}

/**
 * SplashContainer Component
 * 
 * Main container for the splash screen that provides:
 * - Theme-aware background colors (adapts to light/dark mode)
 * - Safe area handling to avoid notches and system UI
 * - Centered content layout (vertical and horizontal)
 * 
 * This component wraps the splash screen content and ensures it displays
 * correctly across all devices with proper theming and safe area margins.
 * 
 * @component
 * @example
 * ```tsx
 * <SplashContainer>
 *   <AnimatedLogo onAnimationComplete={handleComplete} />
 * </SplashContainer>
 * ```
 * 
 * **Validates: Requirements 1.1, 7.1, 9.3**
 * - 1.1: Splash screen displays the logo/brand when app starts
 * - 7.1: Splash screen adapts colors according to system theme
 * - 9.3: Maintains safe area margins to prevent overlap with system UI
 */
export function SplashContainer({ children }: SplashContainerProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        {children}
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
