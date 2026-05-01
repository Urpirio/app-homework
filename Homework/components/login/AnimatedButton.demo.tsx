import { useTheme } from '@/hooks/useTheme';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnimatedButton } from './AnimatedButton';
import { AnimatedInput } from './AnimatedInput';

/**
 * Demo screen showing AnimatedButton in a realistic login form context
 * This demonstrates the component working with other form elements
 */
export default function AnimatedButtonDemo() {
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleLogin = () => {
    setMessage('');
    setIsLoading(true);
    
    // Simulate authentication
    setTimeout(() => {
      setIsLoading(false);
      setMessage('¡Login exitoso! 🎉');
    }, 2000);
  };

  const isFormValid = email.length > 0 && password.length > 0;

  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          AnimatedButton Demo
        </Text>
        
        <View style={styles.form}>
          <AnimatedInput
            value={email}
            onChangeText={setEmail}
            placeholder="Correo electrónico"
            keyboardType="email-address"
            autoCapitalize="none"
            accessibilityLabel="Correo electrónico"
            accessibilityHint="Ingresa tu correo electrónico"
            delay={0}
          />
          
          <AnimatedInput
            value={password}
            onChangeText={setPassword}
            placeholder="Contraseña"
            secureTextEntry={true}
            accessibilityLabel="Contraseña"
            accessibilityHint="Ingresa tu contraseña"
            delay={100}
            showVisibilityToggle={true}
          />
          
          <AnimatedButton
            onPress={handleLogin}
            title="Iniciar Sesión"
            isLoading={isLoading}
            disabled={!isFormValid}
            accessibilityLabel="Botón de inicio de sesión"
            accessibilityHint="Toca para iniciar sesión con tus credenciales"
            delay={200}
          />
        </View>
        
        {message ? (
          <Text style={[styles.message, { color: theme.colors.success }]}>
            {message}
          </Text>
        ) : null}
        
        <View style={styles.info}>
          <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
            Features demonstrated:
          </Text>
          <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
            • Entry animations with staggered delays
          </Text>
          <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
            • Press animation (scale down/up)
          </Text>
          <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
            • Haptic feedback on press
          </Text>
          <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
            • Loading state with spinner
          </Text>
          <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
            • Disabled state when form invalid
          </Text>
          <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
            • Theme-aware styling
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 32,
    textAlign: 'center',
  },
  form: {
    width: '100%',
    marginBottom: 24,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '600',
  },
  info: {
    marginTop: 24,
    padding: 16,
    borderRadius: 8,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 4,
  },
});
