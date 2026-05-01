import { ViewStyle } from 'react-native';

/**
 * Color scheme interface defining all color tokens used in the app
 */
export interface ColorScheme {
  background: string;
  foreground: string;
  primary: string;
  secondary: string;
  border: string;
  error: string;
  success: string;
  text: string;
  textSecondary: string;
  inputBackground: string;
  primaryLight: string;
  surface: string;
  card: string;
}

/**
 * Spacing scale interface for consistent spacing throughout the app
 */
export interface Spacing {
  xs: number;   // 4
  sm: number;   // 8
  md: number;   // 16
  lg: number;   // 24
  xl: number;   // 32
}

/**
 * Border radius scale interface for consistent rounded corners
 */
export interface BorderRadius {
  sm: number;   // 4
  md: number;   // 8
  lg: number;   // 16
}

/**
 * Shadow styles interface for elevation and depth
 */
export interface Shadows {
  sm: ViewStyle;
  md: ViewStyle;
  lg: ViewStyle;
}

/**
 * Complete theme interface combining all design tokens
 */
export interface Theme {
  colors: ColorScheme;
  spacing: Spacing;
  borderRadius: BorderRadius;
  shadows: Shadows;
}

/**
 * Light theme configuration
 * Provides a bright, high-contrast color scheme suitable for well-lit environments
 */
export const lightTheme: Theme = {
  colors: {
    background: '#FFFFFF',
    foreground: '#000000',
    primary: '#007AFF',
    secondary: '#5856D6',
    border: '#C7C7CC',
    error: '#FF3B30',
    success: '#34C759',
    text: '#1C1C1E',
    textSecondary: '#636366',
    inputBackground: '#F2F2F7',
    primaryLight: '#E5F1FF',
    surface: '#FFFFFF',
    card: '#F9F9F9',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 16,
  },
  shadows: {
    sm: {},
    md: {},
    lg: {},
  },
};

/**
 * Dark theme configuration
 * Provides a dark, high-contrast color scheme suitable for low-light environments
 */
export const darkTheme: Theme = {
  colors: {
    background: '#000000',
    foreground: '#FFFFFF',
    primary: '#0A84FF',
    secondary: '#5E5CE6',
    border: '#38383A',
    error: '#FF453A',
    success: '#32D74B',
    text: '#FFFFFF',
    textSecondary: '#AEAEB2',
    inputBackground: '#1C1C1E',
    primaryLight: '#003A75',
    surface: '#121212',
    card: '#1C1C1E',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 16,
  },
  shadows: {
    sm: {},
    md: {},
    lg: {},
  },
};
