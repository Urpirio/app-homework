import { useTheme } from '@/hooks/useTheme';
import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { BaseModal } from '../shared/BaseModal';
import { AnimatedInput } from './AnimatedInput';
import { AnimatedButton } from './AnimatedButton';
import api from '@/utils/api';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Image, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

interface InstitutionModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const InstitutionModal = ({ visible, onClose, onSuccess }: InstitutionModalProps) => {
  const { theme } = useTheme();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [logo, setLogo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setLogo(result.assets[0].uri);
    }
  };

  const handleCreate = async () => {
    if (!name) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'El nombre es obligatorio' });
      return;
    }

    setLoading(true);
    try {
      await api.post('/institutions', {
        name,
        address,
        logoUrl: logo,
      });
      Toast.show({ type: 'success', text1: 'Éxito', text2: 'Institución creada correctamente' });
      onSuccess?.();
      onClose();
      setName('');
      setAddress('');
      setLogo(null);
    } catch (error: any) {
      Toast.show({ 
        type: 'error', 
        text1: 'Error', 
        text2: error.response?.data?.message || 'No se pudo crear la institución' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseModal visible={visible} onClose={onClose}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Nueva Institución</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Registra una nueva entidad educativa en el sistema.
        </Text>

        <View style={styles.inputContainer}>
          <AnimatedInput
            value={name}
            onChangeText={setName}
            placeholder="Nombre de la Institución"
            icon="business-outline"
          />
          
          <AnimatedInput
            value={address}
            onChangeText={setAddress}
            placeholder="Dirección (opcional)"
            icon="location-outline"
          />

          <Pressable 
            onPress={pickImage} 
            style={[styles.logoSelector, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
          >
            {logo ? (
              <Image source={{ uri: logo }} style={styles.logoPreview} />
            ) : (
              <View style={styles.placeholderContainer}>
                <Ionicons name="camera-outline" size={32} color={theme.colors.textSecondary} />
                <Text style={[styles.placeholderText, { color: theme.colors.textSecondary }]}>Logo de la institución</Text>
              </View>
            )}
            <View style={[styles.editBadge, { backgroundColor: theme.colors.primary }]}>
              <Ionicons name="add" size={20} color="#FFF" />
            </View>
          </Pressable>
        </View>

        <View style={styles.buttonContainer}>
          <AnimatedButton
            title="Crear Institución"
            onPress={handleCreate}
            loading={loading}
          />
        </View>
      </ScrollView>
    </BaseModal>
  );
};

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '800', marginBottom: 8 },
  subtitle: { fontSize: 14, marginBottom: 24, lineHeight: 20 },
  inputContainer: { marginBottom: 24, gap: 12 },
  buttonContainer: { paddingBottom: 20 },
  logoSelector: {
    height: 120,
    borderRadius: 24,
    borderWidth: 1,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
    overflow: 'hidden'
  },
  logoPreview: {
    width: '100%',
    height: '100%',
    borderRadius: 24
  },
  placeholderContainer: {
    alignItems: 'center',
    gap: 8
  },
  placeholderText: {
    fontSize: 13,
    fontWeight: '600'
  },
  editBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF'
  }
});
