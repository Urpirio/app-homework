import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { ErrorState } from '@/components/shared/ErrorState';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import { ThemedView } from '@/components/shared/ThemedView';
import { useInstitution, useUpdateInstitution } from '@/hooks/api/useInstitutions';
import { useFileUpload } from '@/hooks/api/useUploads';
import { useTheme } from '@/hooks/useTheme';
import { getFullUrl } from '@/utils/media';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

export default function EditInstitutionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useTheme();

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [logoChanged, setLogoChanged] = useState(false);

  const {
    data: institution,
    isLoading: fetching,
    isError,
    error,
    refetch,
  } = useInstitution(id!);

  const updateMutation = useUpdateInstitution();
  const { upload, progress, isUploading, status: uploadStatus } = useFileUpload();

  // Populate form when institution data loads
  useEffect(() => {
    if (institution) {
      setName(institution.name || '');
      setAddress(institution.address || '');
      setLogoUri(institution.logoUrl || null);
    }
  }, [institution]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Toast.show({
        type: 'error',
        text1: 'Permiso denegado',
        text2: 'Necesitamos acceso a tu galería para cambiar el logo.',
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
      setLogoChanged(true);
    }
  };

  const handleUpdate = async () => {
    if (!name.trim()) {
      Toast.show({ type: 'error', text1: 'El nombre es obligatorio' });
      return;
    }

    try {
      let finalLogoUrl = institution?.logoUrl;

      // Upload new logo if it's a local file
      if (logoUri && (logoUri.startsWith('file://') || logoUri.startsWith('content://'))) {
        const filename = logoUri.split('/').pop() ?? 'logo.jpg';
        const ext = /\.(\w+)$/.exec(filename)?.[1] ?? 'jpg';
        const uploadResult = await upload({
          uri: logoUri,
          name: `institution-logo-${id}.${ext}`,
          mimeType: `image/${ext === 'png' ? 'png' : 'jpeg'}`,
        });
        finalLogoUrl = uploadResult.fileUrl;
      }

      await updateMutation.mutateAsync({
        id: id!,
        name: name.trim(),
        address: address.trim() || undefined,
        logoUrl: finalLogoUrl,
      });

      Toast.show({ type: 'success', text1: 'Institución actualizada' });
      router.back();
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err?.response?.data?.message || 'No se pudo actualizar la institución',
      });
    }
  };

  const isSaving = updateMutation.isPending || isUploading;

  if (fetching) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <ThemedView style={styles.container}>
          <BackgroundShapes />
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
            </Pressable>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Editar Institución</Text>
          </View>
          <SkeletonLoader rows={3} variant="detail" />
        </ThemedView>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <ThemedView style={styles.container}>
          <BackgroundShapes />
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
            </Pressable>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Editar Institución</Text>
          </View>
          <ErrorState error={error!} onRetry={() => refetch()} />
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ThemedView style={styles.container}>
        <BackgroundShapes />

        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Editar Institución</Text>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.logoSection}>
              <Pressable
                onPress={pickImage}
                style={[styles.logoContainer, { backgroundColor: theme.colors.card }]}
                accessibilityRole="button"
                accessibilityLabel="Cambiar logo de la institución"
              >
                {logoUri ? (
                  <Image source={{ uri: getFullUrl(logoUri) }} style={styles.logo} />
                ) : (
                  <Ionicons name="camera" size={40} color={theme.colors.textSecondary} />
                )}
                <View style={[styles.editIcon, { backgroundColor: theme.colors.primary }]}>
                  <Ionicons name="pencil" size={16} color="#FFF" />
                </View>
              </Pressable>
              <Text style={[styles.logoHint, { color: theme.colors.textSecondary }]}>
                Toca para cambiar el logo
              </Text>
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

            <View style={styles.form}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                Nombre de la Institución
              </Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.colors.card }]}>
                <Ionicons name="business-outline" size={20} color={theme.colors.primary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: theme.colors.text }]}
                  value={name}
                  onChangeText={setName}
                  placeholder="Nombre oficial"
                  placeholderTextColor={theme.colors.textSecondary}
                  accessibilityLabel="Nombre de la institución"
                />
              </View>

              <Text style={[styles.label, { color: theme.colors.textSecondary, marginTop: 20 }]}>
                Dirección Física
              </Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.colors.card }]}>
                <Ionicons name="location-outline" size={20} color={theme.colors.primary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: theme.colors.text }]}
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Calle, Ciudad, País"
                  placeholderTextColor={theme.colors.textSecondary}
                  accessibilityLabel="Dirección de la institución"
                />
              </View>

              <Pressable
                style={[styles.submitBtn, { backgroundColor: theme.colors.primary, opacity: isSaving ? 0.7 : 1 }]}
                onPress={handleUpdate}
                disabled={isSaving}
                accessibilityRole="button"
                accessibilityLabel="Guardar cambios"
              >
                {isSaving ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.submitBtnText}>Guardar Cambios</Text>
                )}
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 10 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', marginLeft: 10 },
  scrollContent: { padding: 20 },
  logoSection: { alignItems: 'center', marginBottom: 30 },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  logo: { width: 120, height: 120, borderRadius: 40 },
  editIcon: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
  },
  logoHint: { fontSize: 13, marginTop: 12, fontWeight: '500' },
  progressContainer: { marginTop: 12, width: '80%', alignItems: 'center' },
  progressBar: { width: '100%', height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  progressText: { fontSize: 12, marginTop: 4 },
  form: { marginTop: 10 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginLeft: 4 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 60,
    borderRadius: 20,
    paddingHorizontal: 16,
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, fontWeight: '600' },
  submitBtn: {
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
