import { RegisterForm } from '@/components/login/RegisterForm';
import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { KeyboardAvoidingContainer } from '@/components/shared/KeyboardAvoidingContainer';
import { ThemedView } from '@/components/shared/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { router } from 'expo-router';
import React from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function RegisterScreen() {
  const { theme } = useTheme();

  const handleRegister = async (data: any) => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log('User registered:', data);
    alert('Cuenta creada con éxito.');
    router.replace('/home');
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
                Crear Cuenta
              </Text>
              <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                Únete a nosotros y empieza a gestionar tus tareas de forma eficiente.
              </Text>
            </Animated.View>

            <RegisterForm onSubmit={handleRegister} />

            <Animated.View entering={FadeInDown.delay(600)} style={styles.footer}>
              <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
                ¿Ya tienes una cuenta? {' '}
                <Text 
                  style={{ color: theme.colors.primary, fontWeight: '700' }}
                  onPress={() => router.back()}
                >
                  Inicia sesión
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
  safeArea: { flex: 1 },
  container: { flex: 1 },
  content: { flex: 1, paddingVertical: 20 },
  header: { marginBottom: 30 },
  backButton: { marginBottom: 20 },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 8 },
  subtitle: { fontSize: 16, opacity: 0.8 },
  footer: { marginTop: 30, alignItems: 'center' },
  footerText: { fontSize: 15 },
});
