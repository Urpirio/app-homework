import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TextInput,
  TouchableOpacity,
  Keyboard,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { AnimatedButton } from '@/components/login/AnimatedButton';
import { KeyboardAvoidingContainer } from '@/components/shared/KeyboardAvoidingContainer';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import api from '@/utils/api';
import * as SecureStore from 'expo-secure-store';
import Toast from 'react-native-toast-message';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function VerifyCodeScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { email, password, type = 'register' } = useLocalSearchParams<{ email: string; password?: string; type: string }>();
  
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef<Array<TextInput | null>>([]);

  const handleTextChange = (text: string, index: number) => {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    // Mover al siguiente input si hay texto
    if (text.length !== 0 && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    // Mover al anterior si se borra
    if (e.nativeEvent.key === 'Backspace' && code[index] === '' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const verificationCode = code.join('');
    if (verificationCode.length < 6) {
      Alert.alert('Error', 'Por favor ingresa el código completo');
      return;
    }

    try {
      setIsLoading(true);
      
      await api.post('/auth/verify-code', { 
        email, 
        code: verificationCode,
        isReset: type === 'forgot'
      });

      if (type === 'forgot') {
        setIsLoading(false);
        router.replace({
          pathname: '/reset-password',
          params: { email, code: verificationCode }
        });
      } else {
        // Si es registro, intentar login automático
        if (email && password) {
          const loginRes = await api.post('/auth/login', { email, password });
          const { access_token } = loginRes.data;
          await SecureStore.setItemAsync('userToken', access_token);
          
          setIsLoading(false);
          Toast.show({
            type: 'success',
            text1: '¡Bienvenido!',
            text2: 'Tu cuenta ha sido verificada y activada.',
            position: 'top'
          });
          router.replace('/home');
        } else {
          setIsLoading(false);
          router.replace('/login');
        }
      }
    } catch (error: any) {
      setIsLoading(false);
      const message = error.response?.data?.message || 'El código ingresado es incorrecto';
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
            <Text style={[styles.title, { color: theme.colors.text }]}>Verificar Cuenta</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              Ingresa el código de 6 dígitos que enviamos a{'\n'}
              <Text style={{ color: theme.colors.primary, fontWeight: '700' }}>{email || 'tu correo'}</Text>
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(200).duration(600)} style={styles.codeContainer}>
            {code.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputRefs.current[index] = ref)}
                style={[
                  styles.codeInput,
                  { 
                    backgroundColor: theme.colors.card, 
                    color: theme.colors.text,
                    borderColor: digit ? theme.colors.primary : theme.colors.border
                  }
                ]}
                value={digit}
                onChangeText={(text) => handleTextChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
              />
            ))}
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(400).duration(600)} style={styles.footer}>
            <AnimatedButton
              title="Verificar"
              onPress={handleVerify}
              isLoading={isLoading}
            />

            <TouchableOpacity style={styles.resendButton}>
              <Text style={[styles.resendText, { color: theme.colors.textSecondary }]}>
                ¿No recibiste el código?{' '}
                <Text style={{ color: theme.colors.primary, fontWeight: '700' }}>Reenviar</Text>
              </Text>
            </TouchableOpacity>
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
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  codeInput: {
    width: (SCREEN_WIDTH - 48 - 40) / 6,
    height: 60,
    borderRadius: 16,
    borderWidth: 2,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  footer: {
    marginTop: 20,
  },
  resendButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  resendText: {
    fontSize: 14,
  },
});
