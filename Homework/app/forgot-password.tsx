import { ForgotPasswordForm } from '@/components/login/ForgotPasswordForm';
import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { KeyboardAvoidingContainer } from '@/components/shared/KeyboardAvoidingContainer';
import { ThemedView } from '@/components/shared/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View, Alert } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '@/utils/api';
import Toast from 'react-native-toast-message';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ForgotPasswordScreen() {
  const { theme } = useTheme();

  const handleReset = async (email: string) => {
    try {
      await api.post('/auth/forgot-password', { email });
      
      router.push({
        pathname: '/verify-code',
        params: { email, type: 'forgot' }
      });
    } catch (error: any) {
      console.error('Reset error:', error);
      const message = error.response?.data?.message || 'Error al enviar el código de recuperación';
      const errorMessage = Array.isArray(message) ? message[0] : message;
      
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errorMessage,
        position: 'top'
      });
    }
  };

  const horizontalPadding = SCREEN_WIDTH > 400 ? theme.spacing.xl : theme.spacing.md;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ThemedView style={styles.container}>
        <BackgroundShapes />
        
        <KeyboardAvoidingContainer>
          <View style={{ ...styles.content, paddingHorizontal: horizontalPadding }}>
            <Animated.View entering={FadeInDown.delay(200)} style={styles.header}>
              <Pressable 
                onPress={() => router.back()} 
                style={styles.backButton}
              >
                <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
              </Pressable>
              
              <Text style={[styles.title, { color: theme.colors.text }]}>
                Recuperar Contraseña
              </Text>
              <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                Ingresa tu correo y te enviaremos las instrucciones para restablecer tu cuenta.
              </Text>
            </Animated.View>

            <ForgotPasswordForm onSubmit={handleReset} />
          </View>
        </KeyboardAvoidingContainer>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  content: { flex: 1, paddingVertical: 20 },
  header: { marginBottom: 40 },
  backButton: { marginBottom: 20 },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 8 },
  subtitle: { fontSize: 16, opacity: 0.8 },
});
