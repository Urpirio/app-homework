import { useFormValidation } from '@/hooks/useFormValidation';
import { LoginCredentials } from '@/types/auth';
import { animationPresets } from '@/utils/animations';
import { validateEmail, validatePassword } from '@/utils/validation';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { AnimatedButton } from './AnimatedButton';
import { AnimatedInput } from './AnimatedInput';
import { ErrorMessage } from './ErrorMessage';
import { SocialLogin } from './SocialLogin';
import { useTheme } from '@/hooks/useTheme';
import { router } from 'expo-router';

/**
 * Props for the LoginForm component
 */
export interface LoginFormProps {
  /** Callback when form is submitted with valid credentials */
  onSubmit: (credentials: LoginCredentials) => Promise<void>;
}

/**
 * LoginForm component provides a complete login form with validation,
 * animations, and accessibility support.
 */
export function LoginForm({ onSubmit }: LoginFormProps) {
  // State for password visibility toggle
  const [showPassword, setShowPassword] = useState(false);

  // Form validation hook
  const {
    values,
    errors,
    handleChange,
    handleSubmit,
    setLoading,
    isLoading,
  } = useFormValidation<LoginCredentials>(
    { email: '', password: '' },
    {
      email: validateEmail,
      password: validatePassword,
    }
  );

  /**
   * Handle form submission
   */
  const handleFormSubmit = async () => {
    const isValid = handleSubmit();

    if (!isValid) return;

    try {
      setLoading(true);
      await onSubmit(values);
      router.replace('/home');
    } catch (error) {
      console.error('Login error:', error);
      setLoading(false);
    }
  };

  /**
   * Handle password visibility toggle
   */
  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      {/* Email Input - Delay: 0ms */}
      <AnimatedInput
        value={values.email}
        onChangeText={(text) => handleChange('email', text)}
        placeholder="Correo electrónico"
        error={errors.email}
        keyboardType="email-address"
        autoCapitalize="none"
        accessibilityLabel="Correo electrónico"
        accessibilityHint="Ingresa tu correo electrónico o nombre de usuario para iniciar sesión"
        delay={0}
        icon="mail-outline"
      />
      <ErrorMessage message={errors.email} visible={!!errors.email} />

      {/* Password Input - Delay: 100ms (staggered) */}
      <View style={styles.passwordContainer}>
        <AnimatedInput
          value={values.password}
          onChangeText={(text) => handleChange('password', text)}
          placeholder="Contraseña"
          error={errors.password}
          secureTextEntry={true}
          autoCapitalize="none"
          accessibilityLabel="Contraseña"
          accessibilityHint="Ingresa tu contraseña para iniciar sesión"
          delay={animationPresets.login.staggerDelay}
          showVisibilityToggle={true}
          onToggleVisibility={handleTogglePasswordVisibility}
          icon="lock-closed-outline"
        />
        <ErrorMessage message={errors.password} visible={!!errors.password} />
        
        <Animated.View entering={FadeIn.delay(300)}>
          <Pressable 
            style={styles.forgotPassword}
            onPress={() => router.push('/forgot-password')}
          >
            <Text style={[styles.forgotPasswordText, { color: theme.colors.primary }]}>
              ¿Olvidaste tu contraseña?
            </Text>
          </Pressable>
        </Animated.View>
      </View>

      {/* Login Button - Delay: 200ms (staggered) */}
      <AnimatedButton
        onPress={handleFormSubmit}
        title="Iniciar Sesión"
        isLoading={isLoading}
        disabled={isLoading}
        accessibilityLabel="Botón de inicio de sesión"
        accessibilityHint="Toca para iniciar sesión con tus credenciales"
        delay={animationPresets.login.staggerDelay * 2}
      />

      {/* Social Login Section */}
      <SocialLogin />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  passwordContainer: {
    marginBottom: 8,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: 8,
    marginBottom: 16,
    paddingVertical: 4,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
