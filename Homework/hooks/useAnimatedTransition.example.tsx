/**
 * Example: Using useAnimatedTransition Hook
 * 
 * This example demonstrates how to use the useAnimatedTransition hook
 * to navigate from the splash screen to the login screen after animations complete.
 * 
 * The hook ensures that:
 * 1. Navigation happens after animations complete
 * 2. The splash screen is removed from the navigation stack (using replace)
 * 3. Users cannot navigate back to the splash screen
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnimatedLogo } from '../components/splash/AnimatedLogo';
import { useAnimatedTransition } from './useAnimatedTransition';
import { useTheme } from './useTheme';

/**
 * Example 1: Basic Usage
 * Navigate to login screen immediately after animations complete
 */
export function SplashScreenBasic() {
  const { theme } = useTheme();
  const { startTransition, isTransitioning } = useAnimatedTransition('/login');

  const handleAnimationComplete = () => {
    // Start transition to login screen
    // This will use router.replace() to remove splash from navigation stack
    startTransition();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <AnimatedLogo 
          onAnimationComplete={handleAnimationComplete}
          size={150}
        />
      </View>
    </SafeAreaView>
  );
}

/**
 * Example 2: With Delay
 * Add a small delay before navigation for smoother transition
 */
export function SplashScreenWithDelay() {
  const { theme } = useTheme();
  // Add 200ms delay before navigation
  const { startTransition, isTransitioning } = useAnimatedTransition('/login', 200);

  const handleAnimationComplete = () => {
    startTransition();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <AnimatedLogo 
          onAnimationComplete={handleAnimationComplete}
          size={150}
        />
      </View>
    </SafeAreaView>
  );
}

/**
 * Example 3: With Loading State
 * Show the transitioning state (useful for debugging or additional UI feedback)
 */
export function SplashScreenWithState() {
  const { theme } = useTheme();
  const { startTransition, isTransitioning } = useAnimatedTransition('/login');

  const handleAnimationComplete = () => {
    console.log('Animations complete, starting transition...');
    startTransition();
  };

  // You can use isTransitioning to show additional UI or prevent interactions
  React.useEffect(() => {
    if (isTransitioning) {
      console.log('Transitioning to login screen...');
    }
  }, [isTransitioning]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <AnimatedLogo 
          onAnimationComplete={handleAnimationComplete}
          size={150}
        />
      </View>
    </SafeAreaView>
  );
}

/**
 * Example 4: Navigate to Different Routes
 * The hook can navigate to any route in your app
 */
export function SplashScreenCustomRoute() {
  const { theme } = useTheme();
  // Navigate to a different route (e.g., onboarding for first-time users)
  const { startTransition } = useAnimatedTransition('/(auth)/onboarding');

  const handleAnimationComplete = () => {
    startTransition();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <AnimatedLogo 
          onAnimationComplete={handleAnimationComplete}
          size={150}
        />
      </View>
    </SafeAreaView>
  );
}

/**
 * Example 5: Conditional Navigation
 * Navigate to different routes based on app state
 */
export function SplashScreenConditional() {
  const { theme } = useTheme();
  const [targetRoute, setTargetRoute] = React.useState('/login');
  const { startTransition } = useAnimatedTransition(targetRoute);

  React.useEffect(() => {
    // Check if user is already authenticated
    const checkAuthStatus = async () => {
      // Simulated auth check
      const isAuthenticated = false; // Replace with actual auth check
      
      if (isAuthenticated) {
        setTargetRoute('/home');
      } else {
        setTargetRoute('/login');
      }
    };

    checkAuthStatus();
  }, []);

  const handleAnimationComplete = () => {
    startTransition();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <AnimatedLogo 
          onAnimationComplete={handleAnimationComplete}
          size={150}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

/**
 * Key Points:
 * 
 * 1. **router.replace() vs router.push()**:
 *    - The hook uses router.replace() to remove the splash screen from the navigation stack
 *    - This prevents users from navigating back to the splash screen
 *    - This is the correct behavior for splash screens
 * 
 * 2. **Timing**:
 *    - The hook should be called after all animations complete
 *    - Use the onAnimationComplete callback from AnimatedLogo
 *    - Optional delay parameter for smoother transitions
 * 
 * 3. **Preventing Multiple Transitions**:
 *    - The hook automatically prevents multiple simultaneous transitions
 *    - Safe to call startTransition multiple times
 * 
 * 4. **Validates Requirements**:
 *    - 2.1: Navigation occurs after splash animations complete
 *    - 2.4: Splash screen is removed from navigation stack (cannot go back)
 */
