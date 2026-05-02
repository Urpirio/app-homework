import { LoginForm } from '@/components/login/LoginForm';
import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { AnimatedLogo } from '@/components/splash/AnimatedLogo';
import { KeyboardAvoidingContainer } from '@/components/shared/KeyboardAvoidingContainer';
import { ThemedView } from '@/components/shared/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { LoginCredentials } from '@/types/auth';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '@/utils/api';
import * as SecureStore from 'expo-secure-store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Login Screen
 *
 * Pantalla de autenticación que integra todos los componentes de login
 * con soporte completo de tema, teclado, áreas seguras y responsividad.
 *
 * Estructura:
 *   SafeAreaView
 *     └── ThemedView (contenedor principal con colores del tema)
 *           └── KeyboardAvoidingContainer (manejo del teclado + ScrollView)
 *                 └── LoginForm (formulario con validación y animaciones)
 *
 * **Validates: Requirements 3.1, 3.2, 3.3, 7.1, 7.2, 9.2, 9.3, 9.4, 9.5**
 * - 3.1: Muestra campo de entrada para correo electrónico
 * - 3.2: Muestra campo de entrada para contraseña
 * - 3.3: Muestra botón de inicio de sesión
 * - 7.1: Adapta colores según el tema del sistema (splash)
 * - 7.2: Adapta colores según el tema del sistema (login)
 * - 9.2: Adapta espaciado y tamaño de elementos según dimensiones de pantalla
 * - 9.3: Mantiene márgenes seguros para evitar superposición con notches
 * - 9.4: Ajusta contenido cuando aparece el teclado
 * - 9.5: Usa ScrollView para garantizar accesibilidad en pantallas pequeñas
 */
export default function LoginScreen() {
  const { theme } = useTheme();

  // Loading state for async authentication simulation
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  /**
   * Handle form submission with simulated async authentication.
   *
   * In a real app this would call an authentication API.
   * Here we simulate a network request with a delay and try/catch
   * to demonstrate proper loading state management.
   *
   * **Validates: Requirements 10.1, 10.2, 10.3, 10.5**
   */
  const handleSubmit = async (credentials: LoginCredentials): Promise<void> => {
    setIsAuthenticating(true);

    try {
      // Llamada real al backend en Railway
      const response = await api.post('/auth/login', credentials);
      const { access_token } = response.data;
      
      // Guardar token de forma segura
      await SecureStore.setItemAsync('userToken', access_token);
      
      console.log('Authentication successful');
      router.replace('/home');
    } catch (error: any) {
      console.error('Authentication error:', error.response?.data || error.message);
      const errorMessage = error.response?.data?.message || 'Correo o contraseña incorrectos';
      throw new Error(Array.isArray(errorMessage) ? errorMessage[0] : errorMessage);
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Responsive horizontal padding based on screen width
  // Wider screens get more padding to keep content readable
  const horizontalPadding = SCREEN_WIDTH > 400 ? theme.spacing.xl : theme.spacing.md;

  return (
    // SafeAreaView ensures content respects device notches and system bars (Req 9.3)
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
      testID="login-screen"
    >
      {/* ThemedView adapts background color to light/dark theme (Req 7.1, 7.2) */}
      <ThemedView style={styles.container}>
        <BackgroundShapes />
        
        <KeyboardAvoidingContainer>
          <View
            style={{
              ...styles.content,
              paddingHorizontal: horizontalPadding,
            }}
          >
            {/* Header Section */}
            <Animated.View 
              entering={FadeInDown.delay(200).duration(800)}
              style={styles.header}
            >
              <View style={styles.logoContainer}>
                <AnimatedLogo size={80} onAnimationComplete={() => {}} />
              </View>
              <Text style={[styles.welcomeTitle, { color: theme.colors.text }]}>
                Bienvenido de nuevo
              </Text>
              <Text style={[styles.welcomeSubtitle, { color: theme.colors.textSecondary }]}>
                Ingresa tus credenciales para continuar
              </Text>
            </Animated.View>

            {/* Form Section */}
            <LoginForm onSubmit={handleSubmit} />

            {/* Footer Section */}
            <Animated.View 
              entering={FadeInDown.delay(500).duration(800)}
              style={styles.footer}
            >
              <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
                ¿No tienes una cuenta? {' '}
                <Text 
                  style={{ color: theme.colors.primary, fontWeight: '700' }}
                  onPress={() => router.push('/register')}
                >
                  Regístrate
                </Text>
              </Text>
            </Animated.View>
          </View>
        </KeyboardAvoidingContainer>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingVertical: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
  },
  footer: {
    marginTop: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 15,
    fontWeight: '500',
  },
});
