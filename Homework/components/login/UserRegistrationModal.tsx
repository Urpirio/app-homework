import { useTheme } from '@/hooks/useTheme';
import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { BaseModal } from '../shared/BaseModal';
import { AnimatedInput } from './AnimatedInput';
import { AnimatedButton } from './AnimatedButton';
import api from '@/utils/api';
import Toast from 'react-native-toast-message';

interface UserRegistrationModalProps {
  visible: boolean;
  onClose: () => void;
  role: 'STUDENT' | 'TEACHER' | 'SUPPORT';
  onSuccess?: () => void;
}

export const UserRegistrationModal = ({ visible, onClose, role, onSuccess }: UserRegistrationModalProps) => {
  const { theme } = useTheme();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!fullName || !email) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Por favor llena todos los campos' });
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/institutional-user', {
        email,
        fullName,
        role,
      });
      Toast.show({ 
        type: 'success', 
        text1: 'Éxito', 
        text2: `${role === 'STUDENT' ? 'Estudiante' : 'Maestro'} registrado correctamente` 
      });
      onSuccess?.();
      onClose();
      setFullName('');
      setEmail('');
    } catch (error: any) {
      Toast.show({ 
        type: 'error', 
        text1: 'Error', 
        text2: error.response?.data?.message || 'No se pudo registrar al usuario' 
      });
    } finally {
      setLoading(false);
    }
  };

  const roleLabel = role === 'STUDENT' ? 'Estudiante' : role === 'TEACHER' ? 'Maestro' : 'Soporte';

  return (
    <BaseModal visible={visible} onClose={onClose}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Registrar {roleLabel}</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Se creará una cuenta con contraseña temporal y verificación automática.
        </Text>

        <View style={styles.inputContainer}>
          <AnimatedInput
            value={fullName}
            onChangeText={setFullName}
            placeholder="Nombre Completo"
            icon="person-outline"
          />
          
          <AnimatedInput
            value={email}
            onChangeText={setEmail}
            placeholder="Correo Electrónico"
            icon="mail-outline"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.buttonContainer}>
          <AnimatedButton
            title={`Registrar ${roleLabel}`}
            onPress={handleRegister}
            loading={loading}
          />
        </View>
      </ScrollView>
    </BaseModal>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 24,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 24,
  },
  buttonContainer: {
    paddingBottom: 20,
  },
});
