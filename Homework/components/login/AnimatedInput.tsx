import { useTheme } from '@/hooks/useTheme';
import { animationPresets } from '@/utils/animations';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    KeyboardTypeOptions,
    Pressable,
    StyleSheet,
    Text,
    TextInput
} from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withTiming,
} from 'react-native-reanimated';

/**
 * Props for the AnimatedInput component
 */
export interface AnimatedInputProps {
  /** Current value of the input field */
  value: string;
  /** Callback when text changes */
  onChangeText: (text: string) => void;
  /** Placeholder text */
  placeholder: string;
  /** Error message to display (if any) */
  error?: string;
  /** Whether to hide the text (for passwords) */
  secureTextEntry?: boolean;
  /** Auto-capitalization behavior */
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  /** Keyboard type */
  keyboardType?: KeyboardTypeOptions;
  /** Accessibility label for screen readers */
  accessibilityLabel: string;
  /** Accessibility hint describing the purpose */
  accessibilityHint: string;
  /** Delay for staggered entry animation (in ms) */
  delay?: number;
  /** Whether to show password visibility toggle */
  showVisibilityToggle?: boolean;
  /** Callback when visibility toggle is pressed */
  onToggleVisibility?: () => void;
  /** Icon name from Ionicons */
  icon?: keyof typeof Ionicons.glyphMap;
}

/**
 * AnimatedInput component provides an input field with animations and validation visual feedback.
 * 
 * Features:
 * - Entry animation: opacity (0→1) + translateY (50→0) with configurable delay
 * - Focus animation: borderColor change, borderWidth (1→2), scale (1→1.02)
 * - Error animation: shake effect with red border
 * - Password visibility toggle
 * - Full accessibility support
 * - Theme-aware styling
 * 
 * @example
 * ```tsx
 * <AnimatedInput
 *   value={email}
 *   onChangeText={setEmail}
 *   placeholder="Correo electrónico"
 *   error={errors.email}
 *   keyboardType="email-address"
 *   autoCapitalize="none"
 *   accessibilityLabel="Correo electrónico"
 *   accessibilityHint="Ingresa tu correo electrónico para iniciar sesión"
 *   delay={0}
 * />
 * ```
 * 
 * **Validates: Requirements 3.1, 3.2, 3.5, 3.6, 4.1, 4.2, 4.3, 6.1, 6.2, 6.3, 8.1, 8.3**
 * - 3.1: Shows input field for email or username
 * - 3.2: Shows input field for password
 * - 3.5: Shows visual focus indicator when user taps field
 * - 3.6: Shows visibility icon in password field
 * - 4.1: Animates entry of form elements when login screen mounts
 * - 4.2: Animates elements in sequence with 100ms delay
 * - 4.3: Uses fade and slide from bottom animations
 * - 6.1: Shows red border on empty fields when validation fails
 * - 6.2: Shows error message below field (via parent component)
 * - 6.3: Animates error appearance with shake animation
 * - 8.1: Provides accessibility labels for input fields
 * - 8.3: Provides accessibility hints describing field purpose
 */
export function AnimatedInput({
  value,
  onChangeText,
  placeholder,
  error,
  secureTextEntry = false,
  autoCapitalize = 'none',
  keyboardType = 'default',
  accessibilityLabel,
  accessibilityHint,
  delay = 0,
  showVisibilityToggle = false,
  onToggleVisibility,
  icon,
}: AnimatedInputProps) {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  // Shared values for animations
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(50);
  const scale = useSharedValue(1);
  const borderWidth = useSharedValue(1);
  const shakeTranslateX = useSharedValue(0);

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

  // Focus animation
  useEffect(() => {
    if (isFocused) {
      // Animate to focused state
      scale.value = withTiming(1.02, {
        duration: animationPresets.input.focus.duration,
        easing: animationPresets.input.focus.easing,
      });
      borderWidth.value = withTiming(2, {
        duration: animationPresets.input.focus.duration,
        easing: animationPresets.input.focus.easing,
      });
    } else {
      // Animate back to normal state
      scale.value = withTiming(1, {
        duration: animationPresets.input.focus.duration,
        easing: animationPresets.input.focus.easing,
      });
      borderWidth.value = withTiming(1, {
        duration: animationPresets.input.focus.duration,
        easing: animationPresets.input.focus.easing,
      });
    }
  }, [isFocused, scale, borderWidth]);

  // Error shake animation
  useEffect(() => {
    if (error) {
      // Shake animation: oscillate translateX between -10 and 10
      shakeTranslateX.value = withSequence(
        withTiming(10, { duration: 50, easing: Easing.linear }),
        withTiming(-10, { duration: 50, easing: Easing.linear }),
        withTiming(10, { duration: 50, easing: Easing.linear }),
        withTiming(-10, { duration: 50, easing: Easing.linear }),
        withTiming(10, { duration: 50, easing: Easing.linear }),
        withTiming(-10, { duration: 50, easing: Easing.linear }),
        withTiming(5, { duration: 50, easing: Easing.linear }),
        withTiming(0, { duration: 50, easing: Easing.linear })
      );
    }
  }, [error, shakeTranslateX]);

  // Animated styles for container
  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        { translateY: translateY.value },
        { scale: scale.value },
        { translateX: shakeTranslateX.value },
      ],
    };
  });

  // Animated styles for input wrapper (border)
  const animatedInputWrapperStyle = useAnimatedStyle(() => {
    return {
      borderWidth: borderWidth.value,
    };
  });

  // Determine border color based on state
  const getBorderColor = () => {
    if (error) return theme.colors.error;
    if (isFocused) return theme.colors.primary;
    return theme.colors.border;
  };

  // Handle visibility toggle
  const handleToggleVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
    if (onToggleVisibility) {
      onToggleVisibility();
    }
  };

  // Determine if text should be hidden
  const shouldHideText = secureTextEntry && !isPasswordVisible;

  return (
    <Animated.View style={[styles.container, animatedContainerStyle]}>
      <Animated.View
        style={[
          styles.inputWrapper,
          animatedInputWrapperStyle,
          {
            backgroundColor: isFocused ? theme.colors.background : theme.colors.inputBackground,
            borderColor: getBorderColor(),
            borderRadius: theme.borderRadius.lg,
          },
        ]}
      >
        {icon && (
          <Ionicons 
            name={icon} 
            size={20} 
            color={isFocused ? theme.colors.primary : theme.colors.textSecondary} 
            style={styles.icon}
          />
        )}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textSecondary}
          secureTextEntry={shouldHideText}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          accessibilityLabel={accessibilityLabel}
          accessibilityHint={accessibilityHint}
          style={[
            styles.input,
            {
              color: theme.colors.text,
            },
          ]}
        />
        {showVisibilityToggle && (
          <Pressable
            onPress={handleToggleVisibility}
            style={styles.visibilityToggle}
            accessibilityLabel={
              isPasswordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'
            }
            accessibilityRole="button"
            testID="password-visibility-toggle"
          >
            <Ionicons 
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'} 
              size={20} 
              color={theme.colors.textSecondary} 
            />
          </Pressable>
        )}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    minHeight: 56,
    borderWidth: 1.5,
  },
  icon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 14,
    fontWeight: '500',
  },
  visibilityToggle: {
    padding: 8,
    marginLeft: 4,
  },
});
