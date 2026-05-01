import { useTheme } from '@/hooks/useTheme';
import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withRepeat, 
  withTiming, 
  Easing 
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * BackgroundShapes component
 * 
 * Renders abstract, animated shapes in the background to provide
 * depth and a "premium" aesthetic to the screen.
 * 
 * Uses shared values to gently animate the shapes for a dynamic feel.
 */
export const BackgroundShapes = () => {
  const { theme, isDark } = useTheme();

  // Animation values for subtle floating effect
  const floatAnim = useSharedValue(0);

  React.useEffect(() => {
    floatAnim.value = withRepeat(
      withTiming(1, { duration: 10000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, [floatAnim]);

  const animatedShape1 = useAnimatedStyle(() => ({
    transform: [
      { translateX: floatAnim.value * 20 },
      { translateY: floatAnim.value * -30 },
    ],
  }));

  const animatedShape2 = useAnimatedStyle(() => ({
    transform: [
      { translateX: floatAnim.value * -15 },
      { translateY: floatAnim.value * 40 },
    ],
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Top Left Shape */}
      <Animated.View 
        style={[
          styles.shape, 
          styles.shape1, 
          { backgroundColor: isDark ? '#1A2A44' : '#E6F0FF' },
          animatedShape1
        ]} 
      />
      
      {/* Bottom Right Shape */}
      <Animated.View 
        style={[
          styles.shape, 
          styles.shape2, 
          { backgroundColor: isDark ? '#2D1A44' : '#F5E6FF' },
          animatedShape2
        ]} 
      />

      {/* Center Soft Glow */}
      <View 
        style={[
          styles.glow,
          { backgroundColor: theme.colors.background, opacity: 0.6 }
        ]} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  shape: {
    position: 'absolute',
    borderRadius: 1000,
    opacity: 0.5,
  },
  shape1: {
    width: SCREEN_WIDTH * 0.8,
    height: SCREEN_WIDTH * 0.8,
    top: -SCREEN_WIDTH * 0.2,
    left: -SCREEN_WIDTH * 0.2,
  },
  shape2: {
    width: SCREEN_WIDTH * 0.9,
    height: SCREEN_WIDTH * 0.9,
    bottom: -SCREEN_WIDTH * 0.3,
    right: -SCREEN_WIDTH * 0.3,
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
  },
});
