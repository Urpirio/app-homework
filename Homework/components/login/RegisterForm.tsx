import { useFormValidation } from '@/hooks/useFormValidation';
import { animationPresets } from '@/utils/animations';
import { validateEmail, validatePassword } from '@/utils/validation';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AnimatedButton } from './AnimatedButton';
import { AnimatedInput } from './AnimatedInput';
import { ErrorMessage } from './ErrorMessage';

interface RegisterFormProps {
  onSubmit: (data: any) => Promise<void>;
}

export function RegisterForm({ onSubmit }: RegisterFormProps) {
  const {
    values,
    errors,
    handleChange,
    handleSubmit,
    setLoading,
    isLoading,
  } = useFormValidation({
    username: '',
    email: '',
    password: '',
  }, {
    username: (val) => val.length < 3 ? 'Mínimo 3 caracteres' : null,
    email: validateEmail,
    password: validatePassword,
  });

  const handleFormSubmit = async () => {
    const isValid = handleSubmit();
    if (!isValid) return;

    try {
      setLoading(true);
      await onSubmit(values);
    } catch (error) {
      console.error('Register error:', error);
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <AnimatedInput
        value={values.username}
        onChangeText={(text) => handleChange('username', text)}
        placeholder="Nombre de usuario"
        error={errors.username}
        accessibilityLabel="Nombre de usuario"
        accessibilityHint="Ingresa tu nombre de usuario"
        delay={0}
        icon="person-outline"
      />
      <ErrorMessage message={errors.username} visible={!!errors.username} />

      <AnimatedInput
        value={values.email}
        onChangeText={(text) => handleChange('email', text)}
        placeholder="Correo electrónico"
        error={errors.email}
        keyboardType="email-address"
        autoCapitalize="none"
        accessibilityLabel="Correo electrónico"
        accessibilityHint="Ingresa tu correo electrónico"
        delay={animationPresets.login.staggerDelay}
        icon="mail-outline"
      />
      <ErrorMessage message={errors.email} visible={!!errors.email} />

      <AnimatedInput
        value={values.password}
        onChangeText={(text) => handleChange('password', text)}
        placeholder="Contraseña"
        error={errors.password}
        secureTextEntry={true}
        autoCapitalize="none"
        accessibilityLabel="Contraseña"
        accessibilityHint="Crea una contraseña segura"
        delay={animationPresets.login.staggerDelay * 2}
        icon="lock-closed-outline"
        showVisibilityToggle={true}
      />
      <ErrorMessage message={errors.password} visible={!!errors.password} />

      <AnimatedButton
        onPress={handleFormSubmit}
        title="Crear Cuenta"
        isLoading={isLoading}
        disabled={isLoading}
        accessibilityLabel="Botón de registro"
        accessibilityHint="Toca para crear tu cuenta"
        delay={animationPresets.login.staggerDelay * 3}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
});
