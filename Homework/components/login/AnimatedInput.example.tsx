import { useTheme } from '@/hooks/useTheme';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { AnimatedInput } from './AnimatedInput';

/**
 * Example usage of the AnimatedInput component
 * 
 * This example demonstrates:
 * - Basic text input
 * - Email input with validation
 * - Password input with visibility toggle
 * - Staggered entry animations
 * - Error states
 */
export default function AnimatedInputExample() {
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [emailError, setEmailError] = useState<string>();
  const [passwordError, setPasswordError] = useState<string>();

  // Simulate validation
  const validateEmail = (text: string) => {
    setEmail(text);
    if (text && !text.includes('@')) {
      setEmailError('Ingresa un correo electrónico válido');
    } else {
      setEmailError(undefined);
    }
  };

  const validatePassword = (text: string) => {
    setPassword(text);
    if (text && text.length < 6) {
      setPasswordError('La contraseña debe tener al menos 6 caracteres');
    } else {
      setPasswordError(undefined);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.title, { color: theme.colors.text }]}>
        AnimatedInput Examples
      </Text>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Basic Input
        </Text>
        <AnimatedInput
          value={username}
          onChangeText={setUsername}
          placeholder="Nombre de usuario"
          accessibilityLabel="Nombre de usuario"
          accessibilityHint="Ingresa tu nombre de usuario"
          delay={0}
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Email Input with Validation
        </Text>
        <AnimatedInput
          value={email}
          onChangeText={validateEmail}
          placeholder="Correo electrónico"
          error={emailError}
          keyboardType="email-address"
          autoCapitalize="none"
          accessibilityLabel="Correo electrónico"
          accessibilityHint="Ingresa tu correo electrónico"
          delay={100}
        />
        {emailError && (
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {emailError}
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Password Input with Visibility Toggle
        </Text>
        <AnimatedInput
          value={password}
          onChangeText={validatePassword}
          placeholder="Contraseña"
          error={passwordError}
          secureTextEntry
          accessibilityLabel="Contraseña"
          accessibilityHint="Ingresa tu contraseña"
          delay={200}
          showVisibilityToggle
        />
        {passwordError && (
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {passwordError}
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Features Demonstrated:
        </Text>
        <Text style={[styles.featureText, { color: theme.colors.textSecondary }]}>
          • Entry animations with staggered delays (0ms, 100ms, 200ms)
        </Text>
        <Text style={[styles.featureText, { color: theme.colors.textSecondary }]}>
          • Focus animations (tap any field to see border and scale change)
        </Text>
        <Text style={[styles.featureText, { color: theme.colors.textSecondary }]}>
          • Error shake animation (type invalid email or short password)
        </Text>
        <Text style={[styles.featureText, { color: theme.colors.textSecondary }]}>
          • Password visibility toggle (tap the eye icon)
        </Text>
        <Text style={[styles.featureText, { color: theme.colors.textSecondary }]}>
          • Theme-aware styling (switch system theme to see changes)
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  featureText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
});
