import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, Pressable, View, Alert } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

interface BiometricButtonProps {
  onSuccess: (token: string) => void;
  token?: string | null;
}

export const BiometricButton = ({ onSuccess, token }: BiometricButtonProps) => {
  const { theme } = useTheme();
  const [isAvailable, setIsAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('Biométricos');

  useEffect(() => {
    checkAvailability();
  }, []);

  const checkAvailability = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    
    if (compatible && enrolled) {
      setIsAvailable(true);
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        setBiometricType('Face ID');
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        setBiometricType('Huella');
      }
    }
  };

  const handlePress = async () => {
    if (!token) {
      Alert.alert('Aviso', 'Primero debes iniciar sesión manualmente para habilitar el acceso biométrico.');
      return;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: `Inicia sesión con ${biometricType}`,
      fallbackLabel: 'Usar contraseña',
      cancelLabel: 'Cancelar',
    });

    if (result.success) {
      onSuccess(token);
    }
  };

  if (!isAvailable || !token) return null;

  return (
    <Animated.View entering={FadeIn.delay(600)} style={styles.container}>
      <Pressable 
        onPress={handlePress}
        style={({ pressed }) => [
          styles.button,
          { 
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
            opacity: pressed ? 0.7 : 1
          }
        ]}
      >
        <Ionicons 
          name={biometricType === 'Face ID' ? 'scan-outline' : 'finger-print-outline'} 
          size={24} 
          color={theme.colors.primary} 
        />
        <Text style={[styles.text, { color: theme.colors.text }]}>
          Usar {biometricType}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    alignItems: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
  },
});
