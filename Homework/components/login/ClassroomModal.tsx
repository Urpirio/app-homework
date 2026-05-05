import { useTheme } from '@/hooks/useTheme';
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { BaseModal } from '../shared/BaseModal';
import { AnimatedInput } from './AnimatedInput';
import { AnimatedButton } from './AnimatedButton';
import { Ionicons } from '@expo/vector-icons';
import api from '@/utils/api';
import Toast from 'react-native-toast-message';

interface ClassroomModalProps {
  visible: boolean;
  onClose: () => void;
  institutionId?: string;
  onSuccess?: () => void;
}

export const ClassroomModal = ({ visible, onClose, institutionId, onSuccess }: ClassroomModalProps) => {
  const { theme } = useTheme();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Por favor asigna un nombre al aula' });
      return;
    }

    setLoading(true);
    try {
      await api.post('/classrooms', {
        name,
        description,
        institutionId
      });

      Toast.show({ type: 'success', text1: 'Éxito', text2: 'Aula creada correctamente' });
      onSuccess?.();
      onClose();
      setName('');
      setDescription('');
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'No se pudo crear el aula' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseModal visible={visible} onClose={onClose}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Nueva Aula</Text>
        
        <View style={styles.inputContainer}>
          <AnimatedInput
            value={name}
            onChangeText={setName}
            placeholder="Nombre del Aula (ej. Matemáticas 101)"
            icon="business-outline"
          />
          <AnimatedInput
            value={description}
            onChangeText={setDescription}
            placeholder="Descripción corta"
            icon="document-text-outline"
          />
        </View>

        <View style={styles.buttonContainer}>
          <AnimatedButton
            title="Crear Aula"
            onPress={handleCreate}
            isLoading={loading}
            disabled={!name}
            accessibilityLabel="Botón para crear aula"
            accessibilityHint="Toca para crear el aula con el nombre proporcionado"
          />
        </View>
      </ScrollView>
    </BaseModal>
  );
};

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '800', marginBottom: 20 },
  inputContainer: { marginBottom: 20 },
  buttonContainer: { paddingBottom: 20 },
});
