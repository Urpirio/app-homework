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
  const [regError, setRegError] = React.useState<string | null>(null);
  
  const {
    values,
    errors,
    handleChange,
    handleSubmit,
    setLoading,
    isLoading,
  } = useFormValidation({
    fullName: '',
    email: '',
    password: '',
  }, {
    fullName: (val) => val.length < 3 ? 'Mínimo 3 caracteres' : null,
    email: validateEmail,
    password: validatePassword,
  });

  const handleValueChange = (field: string, value: string) => {
    setRegError(null);
    handleChange(field as any, value);
  };

  const handleFormSubmit = async () => {
    setRegError(null);
    const isValid = handleSubmit();
    if (!isValid) return;

    try {
      setLoading(true);
      await onSubmit(values);
    } catch (error: any) {
      console.error('Register error:', error);
      setRegError(error.message || 'No se pudo crear la cuenta. Intenta con otro correo.');
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <AnimatedInput
        value={values.fullName}
        onChangeText={(text) => handleValueChange('fullName', text)}
        placeholder="Nombre completo"
        error={errors.fullName}
        accessibilityLabel="Nombre completo"
        accessibilityHint="Ingresa tu nombre completo"
        delay={0}
        icon="person-outline"
      />
      <ErrorMessage message={errors.fullName} visible={!!errors.fullName} />

      <AnimatedInput
        value={values.email}
        onChangeText={(text) => handleValueChange('email', text)}
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
        onChangeText={(text) => handleValueChange('password', text)}
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

      <ErrorMessage 
        message={regError} 
        visible={!!regError} 
        style={{ marginBottom: 16 }}
      />

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
