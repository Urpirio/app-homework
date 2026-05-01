import { useTheme } from '@/hooks/useTheme';
import React, { useState } from 'react';
import { Button, StyleSheet, TextInput, View } from 'react-native';
import { ErrorMessage } from './ErrorMessage';

/**
 * Example usage of the ErrorMessage component
 * 
 * This example demonstrates:
 * - Showing error messages when validation fails
 * - Clearing errors when user starts typing
 * - Shake animation on error appearance
 * - Accessibility announcements
 */
export function ErrorMessageExample() {
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | undefined>();

  const handleSubmit = () => {
    // Simple validation
    if (!email) {
      setEmailError('El correo electrónico es requerido');
    } else if (!email.includes('@')) {
      setEmailError('Ingresa un correo electrónico válido');
    } else {
      setEmailError(undefined);
      // Process form...
    }
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    // Clear error when user starts typing
    if (emailError) {
      setEmailError(undefined);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: theme.colors.inputBackground,
            borderColor: emailError ? theme.colors.error : theme.colors.border,
            color: theme.colors.text,
          },
        ]}
        value={email}
        onChangeText={handleEmailChange}
        placeholder="Correo electrónico"
        placeholderTextColor={theme.colors.textSecondary}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      
      {/* ErrorMessage component with shake animation */}
      <ErrorMessage message={emailError} visible={!!emailError} />

      <Button title="Enviar" onPress={handleSubmit} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
});
