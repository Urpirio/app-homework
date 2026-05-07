import { useCreateInstitution } from '@/hooks/api/useInstitutions';
import { useFileUpload } from '@/hooks/api/useUploads';
import { useTheme } from '@/hooks/useTheme';
import { getFullUrl } from '@/utils/media';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { BaseModal } from '../shared/BaseModal';
import { AnimatedButton } from './AnimatedButton';
import { AnimatedInput } from './AnimatedInput';

interface InstitutionModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const InstitutionModal = ({ visible, onClose, onSuccess }: InstitutionModalProps) => {
  const { theme } = useTheme();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [logoUri, setLogoUri] = useState<string | null>(null);

  const createMutation = useCreateInstitution();
  const { upload, progress, isUploading, reset: resetUpload } = useFileUpload();

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Toast.show({
        type: 'error',
        text1: 'Permiso denegado',
        text2: 'Necesitamos acceso a tu galería para seleccionar un logo.',
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setLogoUri(result.assets[0].uri);
    }
  };

  const resetForm = () => {
    setName('');
    setAddress('');
    setLogoUri(null);
    resetUpload();
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'El nombre es obligatorio' });
      return;
    }

    try {
      let finalLogoUrl: string | undefined;

      // Upload logo if selected
      if (logoUri) {
        const filename = logoUri.split('/').pop() ?? 'logo.jpg';
        const ext = /\.(\w+)$/.exec(filename)?.[1] ?? 'jpg';
        const uploadResult = await upload({
          uri: logoUri,
          name: `institution-logo-${Date.now()}.${ext}`,
          mimeType: `image/${ext === 'png' ? 'png' : 'jpeg'}`,
        });
        finalLogoUrl = uploadResult.fileUrl;
      }

      await createMutation.mutateAsync({
        name: name.trim(),
        address: address.trim() || undefined,
        logoUrl: finalLogoUrl,
      });

      Toast.show({ type: 'success', text1: 'Éxito', text2: 'Institución creada correctamente' });
      resetForm();
      onSuccess?.();
      onClose();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error?.response?.data?.message || 'No se pudo crear la institución',
      });
    }
  };

  const isSaving = createMutation.isPending || isUploading;

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
            accessibilityRole="button"
            accessibilityLabel="Seleccionar logo de la institución"
          >
            {logoUri ? (
              <Image source={{ uri: getFullUrl(logoUri) }} style={styles.logoPreview} />
            ) : (
              <View style={styles.placeholderContainer}>
                <Ionicons name="camera-outline" size={32} color={theme.colors.textSecondary} />
                <Text style={[styles.placeholderText, { color: theme.colors.textSecondary }]}>
                  Logo de la institución
                </Text>
              </View>
            )}
            <View style={[styles.editBadge, { backgroundColor: theme.colors.primary }]}>
              <Ionicons name="add" size={20} color="#FFF" />
            </View>
          </Pressable>

          {isUploading && (
            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { backgroundColor: theme.colors.border + '30' }]}>
                <View
                  style={[
                    styles.progressFill,
                    { backgroundColor: theme.colors.primary, width: `${progress}%` },
                  ]}
                />
              </View>
              <Text style={[styles.progressText, { color: theme.colors.textSecondary }]}>
                Subiendo logo... {progress}%
              </Text>
            </View>
          )}
        </View>

        <View style={styles.buttonContainer}>
          <AnimatedButton
            title={isSaving ? 'Creando...' : 'Crear Institución'}
            onPress={handleCreate}
            loading={isSaving}
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
    overflow: 'hidden',
  },
  logoPreview: { width: '100%', height: '100%', borderRadius: 24 },
  placeholderContainer: { alignItems: 'center', gap: 8 },
  placeholderText: { fontSize: 13, fontWeight: '600' },
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
    borderColor: '#FFF',
  },
  progressContainer: { alignItems: 'center', marginTop: 4 },
  progressBar: { width: '100%', height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  progressText: { fontSize: 12, marginTop: 4 },
});
