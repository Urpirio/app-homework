import { useFormValidation } from '@/hooks/useFormValidation';
import { animationPresets } from '@/utils/animations';
import { validateEmail } from '@/utils/validation';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AnimatedButton } from './AnimatedButton';
import { AnimatedInput } from './AnimatedInput';
import { ErrorMessage } from './ErrorMessage';

interface ForgotPasswordFormProps {
  onSubmit: (email: string) => Promise<void>;
}

export function ForgotPasswordForm({ onSubmit }: ForgotPasswordFormProps) {
  const {
    values,
    errors,
    handleChange,
    handleSubmit,
    setLoading,
    isLoading,
  } = useFormValidation<{ email: string }>(
    { email: '' },
    { email: validateEmail }
  );

  const handleFormSubmit = async () => {
    const isValid = handleSubmit();
    if (!isValid) return;

    try {
      setLoading(true);
      await onSubmit(values.email);
    } catch (error) {
      console.error('Reset error:', error);
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <AnimatedInput
        value={values.email}
        onChangeText={(text) => handleChange('email', text)}
        placeholder="Correo electrónico"
        error={errors.email}
        keyboardType="email-address"
        autoCapitalize="none"
        accessibilityLabel="Correo electrónico"
        accessibilityHint="Ingresa tu correo para recuperar tu contraseña"
        delay={0}
        icon="mail-outline"
      />
      <ErrorMessage message={errors.email} visible={!!errors.email} />

      <AnimatedButton
        onPress={handleFormSubmit}
        title="Enviar Instrucciones"
        isLoading={isLoading}
        disabled={isLoading}
        accessibilityLabel="Botón de recuperación"
        accessibilityHint="Toca para enviar instrucciones de recuperación"
        delay={animationPresets.login.staggerDelay}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
});
