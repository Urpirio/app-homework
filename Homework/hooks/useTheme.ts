import { useColorScheme } from 'react-native';
import { Theme, darkTheme, lightTheme } from '../types/theme';

/**
 * Return type for the useTheme hook
 */
export interface UseThemeReturn {
  theme: Theme;
  isDark: boolean;
}

/**
 * Custom hook for accessing the current theme based on system preferences
 * 
 * This hook uses React Native's useColorScheme to detect the system's
 * light/dark mode preference and returns the appropriate theme configuration.
 * 
 * @returns {UseThemeReturn} Object containing the current theme and isDark flag
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { theme, isDark } = useTheme();
 *   
 *   return (
 *     <View style={{ backgroundColor: theme.colors.background }}>
 *       <Text style={{ color: theme.colors.text }}>
 *         Current mode: {isDark ? 'Dark' : 'Light'}
 *       </Text>
 *     </View>
 *   );
 * }
 * ```
 * 
 * **Validates: Requirements 7.1, 7.2, 7.3**
 * - 7.1: Splash screen adapts colors according to system theme
 * - 7.2: Login screen adapts colors according to system theme
 * - 7.3: App updates colors in real-time when system theme changes
 */
export function useTheme(): UseThemeReturn {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? darkTheme : lightTheme;

  return {
    theme,
    isDark,
  };
}
