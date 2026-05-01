/**
 * LoginForm Component Examples
 * 
 * This file demonstrates various usage patterns for the LoginForm component.
 */

import { ThemedView } from '@/components/shared';
import { LoginCredentials } from '@/types/auth';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { LoginForm } from './LoginForm';

/**
 * Example 1: Basic Usage
 * 
 * Simple login form with basic authentication handling.
 */
export function BasicLoginFormExample() {
  const handleLogin = async (credentials: LoginCredentials) => {
    console.log('Login attempt with:', credentials);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Navigate to home
    router.replace('/home');
  };

  return (
    <ThemedView style={styles.container}>
      <Text style={styles.title}>Bienvenido</Text>
      <LoginForm onSubmit={handleLogin} />
    </ThemedView>
  );
}

/**
 * Example 2: With Error Handling
 * 
 * Login form with comprehensive error handling for different error types.
 */
export function LoginFormWithErrorHandlingExample() {
  const [authError, setAuthError] = useState<string | null>(null);

  const handleLogin = async (credentials: LoginCredentials) => {
    try {
      setAuthError(null);
      
      // Simulate authentication
      const response = await authenticateUser(credentials);
      
      if (response.success) {
        router.replace('/home');
      }
    } catch (error) {
      if (error instanceof NetworkError) {
        setAuthError('Error de conexión. Verifica tu internet e intenta nuevamente');
      } else if (error instanceof AuthenticationError) {
        setAuthError('Correo o contraseña incorrectos');
      } else {
        setAuthError('Ocurrió un error inesperado. Intenta nuevamente');
      }
      throw error;
    }
  };

  return (
    <ThemedView style={styles.container}>
      <Text style={styles.title}>Iniciar Sesión</Text>
      <LoginForm onSubmit={handleLogin} />
      {authError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{authError}</Text>
        </View>
      )}
    </ThemedView>
  );
}

/**
 * Example 3: With Success Feedback
 * 
 * Login form that shows success message before navigation.
 */
export function LoginFormWithSuccessFeedbackExample() {
  const [showSuccess, setShowSuccess] = useState(false);

  const handleLogin = async (credentials: LoginCredentials) => {
    // Authenticate
    await authenticateUser(credentials);
    
    // Show success message
    setShowSuccess(true);
    
    // Wait a moment before navigating
    setTimeout(() => {
      router.replace('/home');
    }, 1000);
  };

  return (
    <ThemedView style={styles.container}>
      <Text style={styles.title}>Iniciar Sesión</Text>
      <LoginForm onSubmit={handleLogin} />
      {showSuccess && (
        <View style={styles.successContainer}>
          <Text style={styles.successText}>✓ Inicio de sesión exitoso</Text>
        </View>
      )}
    </ThemedView>
  );
}

/**
 * Example 4: With Additional Actions
 * 
 * Login form with forgot password and sign up links.
 */
export function LoginFormWithActionsExample() {
  const handleLogin = async (credentials: LoginCredentials) => {
    await authenticateUser(credentials);
    router.replace('/home');
  };

  const handleForgotPassword = () => {
    router.push('/forgot-password');
  };

  const handleSignUp = () => {
    router.push('/signup');
  };

  return (
    <ThemedView style={styles.container}>
      <Text style={styles.title}>Iniciar Sesión</Text>
      <LoginForm onSubmit={handleLogin} />
      
      <View style={styles.actionsContainer}>
        <Text style={styles.link} onPress={handleForgotPassword}>
          ¿Olvidaste tu contraseña?
        </Text>
        <Text style={styles.link} onPress={handleSignUp}>
          Crear cuenta nueva
        </Text>
      </View>
    </ThemedView>
  );
}

/**
 * Example 5: With Alert on Error
 * 
 * Login form that shows native alert on authentication error.
 */
export function LoginFormWithAlertExample() {
  const handleLogin = async (credentials: LoginCredentials) => {
    try {
      await authenticateUser(credentials);
      router.replace('/home');
    } catch (error) {
      Alert.alert(
        'Error de autenticación',
        'No se pudo iniciar sesión. Verifica tus credenciales e intenta nuevamente.',
        [{ text: 'OK' }]
      );
      throw error;
    }
  };

  return (
    <ThemedView style={styles.container}>
      <Text style={styles.title}>Iniciar Sesión</Text>
      <LoginForm onSubmit={handleLogin} />
    </ThemedView>
  );
}

// Mock authentication function for examples
async function authenticateUser(credentials: LoginCredentials) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Simulate authentication logic
  if (credentials.email === 'test@example.com' && credentials.password === 'password123') {
    return { success: true, token: 'mock-token' };
  }
  
  throw new AuthenticationError('Invalid credentials');
}

// Mock error classes
class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 32,
  },
  errorContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#FFE5E5',
    borderRadius: 8,
    width: '100%',
  },
  errorText: {
    color: '#D32F2F',
    textAlign: 'center',
  },
  successContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    width: '100%',
  },
  successText: {
    color: '#2E7D32',
    textAlign: 'center',
    fontWeight: '600',
  },
  actionsContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  link: {
    color: '#007AFF',
    fontSize: 14,
    marginVertical: 8,
  },
});
