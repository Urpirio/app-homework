import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native';
import { BaseModal } from '../shared/BaseModal';
import { AnimatedInput } from './AnimatedInput';
import { AnimatedButton } from './AnimatedButton';
import api from '@/utils/api';
import Toast from 'react-native-toast-message';

interface ManualEnrollmentModalProps {
  visible: boolean;
  onClose: () => void;
  institutionId: string;
  onSuccess?: () => void;
}

export const ManualEnrollmentModal = ({ visible, onClose, institutionId, onSuccess }: ManualEnrollmentModalProps) => {
  const { theme } = useTheme();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let pass = '';
    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(pass);
  };

  const handleEnroll = async () => {
    if (!fullName || !email || !password) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Completa todos los campos' });
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/institutional-user', {
        fullName,
        email,
        password,
        role: 'STUDENT',
        institutionId
      });
      Toast.show({ type: 'success', text1: 'Éxito', text2: 'Estudiante matriculado' });
      onSuccess?.();
      onClose();
      setFullName('');
      setEmail('');
      setPassword('');
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: error.response?.data?.message || 'Error al matricular' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseModal visible={visible} onClose={onClose}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Nuevo Estudiante</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Registra manualmente a un alumno en esta institución.
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
            autoCapitalize="none"
          />
          
          <View style={styles.passwordRow}>
            <View style={{ flex: 1 }}>
              <AnimatedInput
                value={password}
                onChangeText={setPassword}
                placeholder="Contraseña"
                icon="lock-closed-outline"
                autoCapitalize="none"
              />
            </View>
            <Pressable 
              style={[styles.generateBtn, { backgroundColor: theme.colors.primary }]}
              onPress={generatePassword}
            >
              <Ionicons name="refresh" size={24} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <AnimatedButton
            title="Finalizar Matrícula"
            onPress={handleEnroll}
            loading={loading}
          />
        </View>
      </ScrollView>
    </BaseModal>
  );
};

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '800', marginBottom: 8 },
  subtitle: { fontSize: 14, marginBottom: 24, lineHeight: 20 },
  inputContainer: { marginBottom: 24 },
  passwordRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  generateBtn: { width: 50, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  buttonContainer: { paddingBottom: 20 },
});
