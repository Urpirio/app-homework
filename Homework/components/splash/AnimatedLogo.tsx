import { useTheme } from '@/hooks/useTheme';
import { animationPresets } from '@/utils/animations';
import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withTiming
} from 'react-native-reanimated';

/**
 * Props for the AnimatedLogo component
 */
export interface AnimatedLogoProps {
  /**
   * Callback invoked when both entry and exit animations complete
   */
  onAnimationComplete: () => void;
  
  /**
   * Optional size for the logo (defaults to 120)
   */
  size?: number;
}

/**
 * AnimatedLogo Component
 * 
 * Renders and animates the app logo during the splash screen.
 * Executes a two-phase animation sequence:
 * 
 * 1. **Entry Animation** (1500ms):
 *    - Scale: 0 → 1
 *    - Opacity: 0 → 1
 *    - Easing: Bezier curve for smooth entrance
 * 
 * 2. **Exit Animation** (800ms):
 *    - Scale: 1 → 1.2
 *    - Opacity: 1 → 0
 *    - Easing: Exponential out for dramatic exit
 * 
 * The component uses React Native Reanimated for high-performance
 * native animations that run at 60 FPS on the UI thread.
 * 
 * @component
 * @example
 * ```tsx
 * <AnimatedLogo 
 *   onAnimationComplete={() => router.replace('/login')}
 *   size={150}
 * />
 * ```
 * 
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5**
 * - 1.1: Displays the logo/brand when splash screen is visible
 * - 1.2: Executes entry animation of the logo
 * - 1.3: Completes entry animation within 1000-2000ms (1500ms)
 * - 1.4: Executes exit animation after entry completes
 * - 1.5: Completes exit animation within 500-1000ms (800ms)
 */
export function AnimatedLogo({ 
  onAnimationComplete, 
  size = 120 
}: AnimatedLogoProps) {
  const { theme } = useTheme();
  
  // Shared values for animations
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  // Animated style that responds to shared values
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  useEffect(() => {
    // Entry animation: scale and opacity from 0 to 1
    const entryConfig = animationPresets.splash.enter;
    const exitConfig = animationPresets.splash.exit;

    // Start entry animation
    scale.value = withTiming(1, {
      duration: entryConfig.duration,
      easing: entryConfig.easing,
    });

    opacity.value = withTiming(
      1,
      {
        duration: entryConfig.duration,
        easing: entryConfig.easing,
      },
      (finished) => {
        // After entry completes, start exit animation
        if (finished) {
          scale.value = withTiming(1.2, {
            duration: exitConfig.duration,
            easing: exitConfig.easing,
          });

          opacity.value = withTiming(
            0,
            {
              duration: exitConfig.duration,
              easing: exitConfig.easing,
            },
            (exitFinished) => {
              // Notify completion on JS thread
              if (exitFinished) {
                runOnJS(onAnimationComplete)();
              }
            }
          );
        }
      }
    );
  }, [scale, opacity, onAnimationComplete]);

  return (
    <Animated.View
      style={[
        styles.container,
        animatedStyle,
        {
          width: size,
          height: size,
          backgroundColor: theme.colors.foreground,
        },
      ]}
      testID="animated-logo"
    >
      {/* Placeholder for actual logo - using a simple circle for now */}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 60, // Half of default size for circular shape
    justifyContent: 'center',
    alignItems: 'center',
  },
});
