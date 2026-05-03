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
import { BiometricButton } from './BiometricButton';
import * as SecureStore from 'expo-secure-store';
import { useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

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
  const [authError, setAuthError] = useState<string | null>(null);
  const [savedToken, setSavedToken] = useState<string | null>(null);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);

  useEffect(() => {
    loadSavedSettings();
  }, []);

  const loadSavedSettings = async () => {
    const [token, biometric] = await Promise.all([
      SecureStore.getItemAsync('userToken'),
      SecureStore.getItemAsync('isBiometricEnabled'),
    ]);
    setSavedToken(token);
    setIsBiometricEnabled(biometric === 'true');
  };

  const handleBiometricSuccess = async (token: string) => {
    // Si tenemos token, podemos navegar directamente a home
    // En una app real, podrías validar el token aquí
    router.replace('/home');
  };

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
    setAuthError(null);
    const isValid = handleSubmit();

    if (!isValid) return;

    try {
      setLoading(true);
      await onSubmit(values);
    } catch (error: any) {
      console.error('Login error:', error);
      const message = error.message || 'Correo o contraseña incorrectos';
      setAuthError(message);
      setLoading(false);
      Toast.show({
        type: 'error',
        text1: 'Error de inicio de sesión',
        text2: message,
        position: 'top'
      });
    }
  };

  /**
   * Wrapper for handleChange to also clear global auth error
   */
  const handleValueChange = (field: keyof LoginCredentials, value: string) => {
    setAuthError(null);
    handleChange(field, value);
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
        onChangeText={(text) => handleValueChange('email', text)}
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
          onChangeText={(text) => handleValueChange('password', text)}
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

      {/* Global Auth Error */}
      {/* <ErrorMessage 
        message={authError} 
        visible={!!authError} 
        style={{ marginBottom: 16 }}
      /> */}

      {/* <View style={styles.rememberContainer}>
        <Pressable 
          onPress={() => {
            const newValue = !isBiometricEnabled;
            setIsBiometricEnabled(newValue);
            SecureStore.setItemAsync('isBiometricEnabled', newValue ? 'true' : 'false');
          }}
          style={styles.rememberPressable}
        >
          <View style={[
            styles.checkbox, 
            { 
              borderColor: isBiometricEnabled ? theme.colors.primary : theme.colors.border,
              backgroundColor: isBiometricEnabled ? theme.colors.primary : 'transparent'
            }
          ]}>
            {isBiometricEnabled && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
          </View>
          <Text style={[styles.rememberText, { color: theme.colors.textSecondary }]}>
            Recordar sesión con biométricos
          </Text>
        </Pressable>
      </View> */}

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

      {isBiometricEnabled && (
        <BiometricButton 
          token={savedToken} 
          onSuccess={handleBiometricSuccess} 
        />
      )}
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
  rememberContainer: {
    marginBottom: 24,
  },
  rememberPressable: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  rememberText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
