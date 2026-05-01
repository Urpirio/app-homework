import { Easing, EasingFunction } from 'react-native-reanimated';

/**
 * Configuration for a single animation
 */
export interface AnimationConfig {
  duration: number;
  easing: EasingFunction;
}

/**
 * Preset animation configurations for the app
 */
export interface AnimationPresets {
  splash: {
    enter: AnimationConfig;
    exit: AnimationConfig;
  };
  login: {
    staggerDelay: number;
    elementEnter: AnimationConfig;
  };
  button: {
    press: AnimationConfig;
  };
  input: {
    focus: AnimationConfig;
    error: AnimationConfig;
  };
}

/**
 * Predefined animation configurations used throughout the app
 * 
 * @example
 * ```typescript
 * import { animationPresets } from '@/utils/animations';
 * 
 * // Use splash enter animation
 * const config = animationPresets.splash.enter;
 * withTiming(1, { duration: config.duration, easing: config.easing });
 * ```
 */
export const animationPresets: AnimationPresets = {
  splash: {
    enter: {
      duration: 1500,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    },
    exit: {
      duration: 800,
      easing: Easing.out(Easing.exp),
    },
  },
  login: {
    staggerDelay: 100,
    elementEnter: {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    },
  },
  button: {
    press: {
      duration: 150,
      easing: Easing.inOut(Easing.ease),
    },
  },
  input: {
    focus: {
      duration: 200,
      easing: Easing.out(Easing.ease),
    },
    error: {
      duration: 400,
      easing: Easing.elastic(1.5),
    },
  },
};
