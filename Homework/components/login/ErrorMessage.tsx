import { useTheme } from '@/hooks/useTheme';
import { animationPresets } from '@/utils/animations';
import React, { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withTiming,
} from 'react-native-reanimated';

/**
 * Props for the ErrorMessage component
 */
export interface ErrorMessageProps {
  /** The error message to display */
  message?: string;
  /** Whether the error message should be visible */
  visible: boolean;
}

/**
 * ErrorMessage component displays validation errors with a shake animation
 * and proper accessibility support.
 * 
 * Features:
 * - Shake animation: translateX oscillates between -10 and 10 in 400ms
 * - Fade in animation: opacity 0→1
 * - Accessibility: Uses accessibilityLiveRegion to announce errors to screen readers
 * 
 * @example
 * ```tsx
 * <ErrorMessage 
 *   message="El correo electrónico es requerido" 
 *   visible={!!errors.email} 
 * />
 * ```
 * 
 * **Validates: Requirements 6.2, 6.3, 6.5, 8.4**
 * - 6.2: Shows error message below field
 * - 6.3: Animates error appearance with shake animation
 * - 6.5: Completes shake animation in 400ms
 * - 8.4: Announces errors to screen readers
 */
export function ErrorMessage({ message, visible }: ErrorMessageProps) {
  const { theme } = useTheme();
  
  // Shared values for animations
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(0);
  
  // Trigger animations when error becomes visible
  useEffect(() => {
    if (visible && message) {
      // Shake animation: oscillate translateX between -10 and 10
      // Using withSequence to create the shake effect
      translateX.value = withSequence(
        withTiming(10, { duration: 50, easing: Easing.linear }),
        withTiming(-10, { duration: 50, easing: Easing.linear }),
        withTiming(10, { duration: 50, easing: Easing.linear }),
        withTiming(-10, { duration: 50, easing: Easing.linear }),
        withTiming(10, { duration: 50, easing: Easing.linear }),
        withTiming(-10, { duration: 50, easing: Easing.linear }),
        withTiming(5, { duration: 50, easing: Easing.linear }),
        withTiming(0, { duration: 50, easing: Easing.linear })
      );
      
      // Fade in animation: opacity 0→1
      opacity.value = withTiming(1, {
        duration: animationPresets.input.error.duration,
        easing: animationPresets.input.error.easing,
      });
    } else {
      // Fade out when error is cleared
      opacity.value = withTiming(0, { duration: 200, easing: Easing.out(Easing.ease) });
      translateX.value = 0;
    }
  }, [visible, message, translateX, opacity]);
  
  // Animated styles
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
      opacity: opacity.value,
    };
  });
  
  // Don't render if no message
  if (!message) {
    return null;
  }
  
  return (
    <Animated.View
      style={[styles.container, animatedStyle]}
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
    >
      <Text style={[styles.errorText, { color: theme.colors.error }]}>
        {message}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 4,
    minHeight: 20,
  },
  errorText: {
    fontSize: 12,
    lineHeight: 16,
  },
});
