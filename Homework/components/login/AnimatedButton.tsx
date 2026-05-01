import { useTheme } from '@/hooks/useTheme';
import { animationPresets } from '@/utils/animations';
import { triggerHapticFeedback } from '@/utils/haptics';
import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import { LoadingIndicator } from './LoadingIndicator';

/**
 * Props for the AnimatedButton component
 */
export interface AnimatedButtonProps {
  /** Callback when button is pressed */
  onPress: () => void;
  /** Button text/title */
  title: string;
  /** Whether the button is in loading state */
  isLoading?: boolean;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Accessibility label for screen readers */
  accessibilityLabel: string;
  /** Accessibility hint describing what happens when pressed */
  accessibilityHint: string;
  /** Delay for staggered entry animation (in ms) */
  delay?: number;
}

/**
 * AnimatedButton component provides a button with animations, haptic feedback, and loading state.
 * 
 * Features:
 * - Entry animation: opacity (0→1) + translateY (50→0) with configurable delay
 * - Press animation: scale (1→0.95) on press, (0.95→1) on release in 150ms
 * - Haptic feedback on press using expo-haptics
 * - Loading state with spinner indicator
 * - Automatic disabling during loading or when disabled prop is true
 * - Full accessibility support
 * - Theme-aware styling
 * 
 * @example
 * ```tsx
 * <AnimatedButton
 *   onPress={handleLogin}
 *   title="Iniciar Sesión"
 *   isLoading={isLoading}
 *   disabled={!isFormValid}
 *   accessibilityLabel="Botón de inicio de sesión"
 *   accessibilityHint="Toca para iniciar sesión con tus credenciales"
 *   delay={200}
 * />
 * ```
 * 
 * **Validates: Requirements 3.3, 3.4, 4.1, 4.2, 5.1, 5.2, 5.3, 5.4, 5.5, 8.2, 10.2, 10.4**
 * - 3.3: Shows login button
 * - 3.4: Applies modern styles with rounded corners and subtle shadows
 * - 4.1: Animates entry of form elements when login screen mounts
 * - 4.2: Animates elements in sequence with 100ms delay
 * - 5.1: Applies scale animation when user presses button
 * - 5.2: Reduces scale to 0.95 during press
 * - 5.3: Restores scale to 1.0 when user releases button
 * - 5.4: Completes scale animation in 150ms
 * - 5.5: Provides haptic feedback when user touches button
 * - 8.2: Provides accessibility label for login button
 * - 10.2: Disables button while loading indicator is visible
 * - 10.4: Shows animated spinner inside button during loading
 */
export function AnimatedButton({
  onPress,
  title,
  isLoading = false,
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
  delay = 0,
}: AnimatedButtonProps) {
  const { theme } = useTheme();

  // Shared values for animations
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(50);
  const scale = useSharedValue(1);

  // Entry animation on mount
  useEffect(() => {
    // Staggered entry animation with configurable delay
    const timer = setTimeout(() => {
      opacity.value = withTiming(1, {
        duration: animationPresets.login.elementEnter.duration,
        easing: animationPresets.login.elementEnter.easing,
      });
      translateY.value = withTiming(0, {
        duration: animationPresets.login.elementEnter.duration,
        easing: animationPresets.login.elementEnter.easing,
      });
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, opacity, translateY]);

  // Animated styles
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

  // Handle press in - scale down and trigger haptic
  const handlePressIn = () => {
    // Trigger haptic feedback
    triggerHapticFeedback();
    
    // Scale down animation
    scale.value = withTiming(0.95, {
      duration: animationPresets.button.press.duration,
      easing: animationPresets.button.press.easing,
    });
  };

  // Handle press out - scale back up
  const handlePressOut = () => {
    // Scale up animation
    scale.value = withTiming(1, {
      duration: animationPresets.button.press.duration,
      easing: animationPresets.button.press.easing,
    });
  };

  // Determine if button should be disabled
  const isDisabled = disabled || isLoading;

  // Determine button opacity based on disabled state
  const buttonOpacity = isDisabled ? 0.5 : 1;

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled, busy: isLoading }}
        style={[
          styles.button,
          {
            backgroundColor: theme.colors.primary,
            borderRadius: theme.borderRadius.lg,
            opacity: buttonOpacity,
          },
        ]}
      >
        {isLoading ? (
          <LoadingIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>{title}</Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: 8,
  },
  button: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
