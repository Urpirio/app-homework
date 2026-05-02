import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { AnimatedButton } from '@/components/login/AnimatedButton';
import { AnimatedInput } from '@/components/login/AnimatedInput';
import { KeyboardAvoidingContainer } from '@/components/shared/KeyboardAvoidingContainer';
import { ErrorMessage } from '@/components/login/ErrorMessage';
import { validatePassword } from '@/utils/validation';
import Animated, { FadeInDown } from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ResetPasswordScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { email, code } = useLocalSearchParams<{ email: string; code: string }>();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleReset = async () => {
    // Reset errors
    setPasswordError(null);
    setConfirmError(null);

    // Validate
    const passError = validatePassword(password);
    if (passError) {
      setPasswordError(passError);
      return;
    }

    if (password !== confirmPassword) {
      setConfirmError('Las contraseñas no coinciden');
      return;
    }

    try {
      setIsLoading(true);
      
      await api.post('/auth/reset-password', { 
        email, 
        password,
        code
      });

      setIsLoading(false);
      Alert.alert('Éxito', 'Tu contraseña ha sido restablecida correctamente', [
        { text: 'Iniciar Sesión', onPress: () => router.replace('/login') }
      ]);
    } catch (error: any) {
      setIsLoading(false);
      const message = error.response?.data?.message || 'No se pudo restablecer la contraseña';
      Alert.alert('Error', Array.isArray(message) ? message[0] : message);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <BackgroundShapes />
      
      <KeyboardAvoidingContainer>
        <View style={styles.container}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={[styles.backButton, { backgroundColor: theme.colors.card }]}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>

          <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.text }]}>Nueva Contraseña</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              Crea una nueva contraseña segura para tu cuenta.
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.form}>
            <View style={styles.inputGroup}>
              <AnimatedInput
                value={password}
                onChangeText={setPassword}
                placeholder="Nueva contraseña"
                secureTextEntry
                icon="lock-closed-outline"
                showVisibilityToggle
                error={passwordError}
              />
              <ErrorMessage message={passwordError} visible={!!passwordError} />
            </View>

            <View style={styles.inputGroup}>
              <AnimatedInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirmar nueva contraseña"
                secureTextEntry
                icon="shield-checkmark-outline"
                showVisibilityToggle
                error={confirmError}
              />
              <ErrorMessage message={confirmError} visible={!!confirmError} />
            </View>

            <View style={styles.buttonWrapper}>
              <AnimatedButton
                title="Restablecer Contraseña"
                onPress={handleReset}
                isLoading={isLoading}
              />
            </View>
          </Animated.View>
        </View>
      </KeyboardAvoidingContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 12,
  },
  buttonWrapper: {
    marginTop: 24,
  },
});
