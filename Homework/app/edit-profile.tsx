import { AnimatedButton } from '@/components/login/AnimatedButton';
import { AnimatedInput } from '@/components/login/AnimatedInput';
import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { ThemedView } from '@/components/shared/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { authKeys } from '@/hooks/api/useAuth';
import { useFileUpload } from '@/hooks/api/useUploads';
import api from '@/utils/api';
import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { getFullUrl } from '@/utils/media';


export default function EditProfileScreen() {
  const { theme } = useTheme();
  const queryClient = useQueryClient();

  const [fetching, setFetching] = useState(true);
  const { upload, progress, isUploading } = useFileUpload();
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  // Read-only display
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/auth/profile');
        setFullName(data.fullName ?? '');
        setEmail(data.email ?? '');
        setRole(data.role ?? '');
        setBio(data.bio ?? '');
        setSpecialty(data.specialty ?? '');
        setParentName(data.parentName ?? '');
        setParentPhone(data.parentPhone ?? '');
        setAvatarUri(data.avatarUrl ?? null);
      } catch (e) {
        console.error('Error loading profile:', e);
      } finally {
        setFetching(false);
      }
    })();
  }, []);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Necesitamos acceso a tu galería para cambiar la foto.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) setAvatarUri(result.assets[0].uri);
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert('Campo requerido', 'El nombre completo no puede estar vacío.');
      return;
    }
    try {
      setSaving(true);

      let finalAvatarUrl = avatarUri;

      // Upload new avatar if it's a local file
      if (avatarUri && (avatarUri.startsWith('file://') || avatarUri.startsWith('content://'))) {
        const filename = avatarUri.split('/').pop() ?? 'avatar.jpg';
        const ext = /\.(\w+)$/.exec(filename)?.[1] ?? 'jpg';
        const uploadRes = await upload({
          uri: avatarUri,
          name: filename,
          mimeType: `image/${ext === 'png' ? 'png' : 'jpeg'}`,
        });
        finalAvatarUrl = uploadRes.fileUrl;
      }

      const { data: updatedUser } = await api.patch('/auth/profile', {
        fullName: fullName.trim(),
        bio: bio.trim() || undefined,
        specialty: specialty.trim() || undefined,
        parentName: parentName.trim() || undefined,
        parentPhone: parentPhone.trim() || undefined,
        avatarUrl: finalAvatarUrl ?? undefined,
      });

      queryClient.setQueryData(authKeys.profile, updatedUser);

      Toast.show({ type: 'success', text1: 'Perfil actualizado', text2: 'Los cambios se guardaron correctamente.' });
      router.back();
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? 'No se pudo actualizar el perfil.';
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  const isActuallySaving = saving || isUploading;

  if (fetching) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const displayUri = getFullUrl(avatarUri);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ThemedView style={styles.container}>
        <BackgroundShapes />

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

            {/* Header */}
            <View style={styles.header}>
              <Pressable onPress={() => router.back()} style={styles.iconBtn}>
                <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
              </Pressable>
              <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Editar Perfil</Text>
              <View style={{ width: 40 }} />
            </View>

            {/* Avatar picker */}
            <Animated.View entering={FadeInDown.duration(500)} style={styles.avatarSection}>
              <Pressable onPress={pickImage} style={styles.avatarWrapper}>
                <View style={[styles.avatarRing, { borderColor: theme.colors.primary }]}>
                  {displayUri ? (
                    <Image source={{ uri: displayUri }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatarFallback, { backgroundColor: theme.colors.primaryLight }]}>
                      <Text style={[styles.avatarInitial, { color: theme.colors.primary }]}>
                        {fullName.charAt(0).toUpperCase() || 'U'}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={[styles.cameraBtn, { backgroundColor: theme.colors.primary }]}>
                  <Ionicons name="camera" size={18} color="#FFF" />
                </View>
              </Pressable>
              <Text style={[styles.avatarHint, { color: theme.colors.textSecondary }]}>Toca para cambiar tu foto</Text>
              {isUploading && (
                <View style={styles.progressContainer}>
                  <View style={[styles.progressBar, { backgroundColor: theme.colors.border + '30' }]}>
                    <View style={[styles.progressFill, { backgroundColor: theme.colors.primary, width: `${progress}%` }]} />
                  </View>
                  <Text style={[styles.progressText, { color: theme.colors.textSecondary }]}>Subiendo foto... {progress}%</Text>
                </View>
              )}
            </Animated.View>

            {/* Read-only info */}
            <Animated.View entering={FadeInDown.delay(100)} style={[styles.readOnlyCard, { backgroundColor: theme.colors.card }]}>
              <View style={styles.readOnlyRow}>
                <Ionicons name="mail-outline" size={16} color={theme.colors.textSecondary} />
                <Text style={[styles.readOnlyLabel, { color: theme.colors.textSecondary }]}>Correo</Text>
                <Text style={[styles.readOnlyValue, { color: theme.colors.text }]}>{email}</Text>
              </View>
              <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
              <View style={styles.readOnlyRow}>
                <Ionicons name="shield-outline" size={16} color={theme.colors.textSecondary} />
                <Text style={[styles.readOnlyLabel, { color: theme.colors.textSecondary }]}>Rol</Text>
                <Text style={[styles.readOnlyValue, { color: theme.colors.text }]}>{role}</Text>
              </View>
            </Animated.View>

            {/* Editable fields */}
            <Animated.View entering={FadeInDown.delay(150)} style={styles.form}>

              <FieldGroup label="Nombre Completo" required>
                <AnimatedInput
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Tu nombre completo"
                  icon="person-outline"
                />
              </FieldGroup>

              <FieldGroup label="Biografía" hint="Cuéntanos algo sobre ti">
                <AnimatedInput
                  value={bio}
                  onChangeText={setBio}
                  placeholder="Ej. Estudiante apasionado por la tecnología..."
                  icon="document-text-outline"
                  multiline
                />
              </FieldGroup>

              <FieldGroup label="Especialidad / Área de interés">
                <AnimatedInput
                  value={specialty}
                  onChangeText={setSpecialty}
                  placeholder="Ej. Matemáticas, Programación..."
                  icon="star-outline"
                />
              </FieldGroup>

              <FieldGroup label="Nombre del Tutor / Padre">
                <AnimatedInput
                  value={parentName}
                  onChangeText={setParentName}
                  placeholder="Nombre del tutor o padre"
                  icon="people-outline"
                />
              </FieldGroup>

              <FieldGroup label="Teléfono del Tutor">
                <AnimatedInput
                  value={parentPhone}
                  onChangeText={setParentPhone}
                  placeholder="+54 9 11 1234-5678"
                  icon="call-outline"
                  keyboardType="phone-pad"
                />
              </FieldGroup>

              <View style={styles.saveBtn}>
                <AnimatedButton title="Guardar Cambios" onPress={handleSave} isLoading={isActuallySaving} />
              </View>
            </Animated.View>

          </ScrollView>
        </KeyboardAvoidingView>
      </ThemedView>
    </SafeAreaView>
  );
}

const FieldGroup = ({ label, hint, required, children }: any) => {
  const { theme } = useTheme();
  return (
    <View style={styles.fieldGroup}>
      <View style={styles.fieldLabelRow}>
        <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>
          {label}{required && <Text style={{ color: '#FF3B30' }}> *</Text>}
        </Text>
        {hint && <Text style={[styles.fieldHint, { color: theme.colors.textSecondary }]}>{hint}</Text>}
      </View>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16 },
  iconBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '900' },

  avatarSection: { alignItems: 'center', paddingVertical: 24 },
  avatarWrapper: { position: 'relative', marginBottom: 10 },
  avatarRing: { width: 110, height: 110, borderRadius: 55, borderWidth: 3, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  avatar: { width: '100%', height: '100%' },
  avatarFallback: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { fontSize: 42, fontWeight: '900' },
  cameraBtn: { position: 'absolute', bottom: 0, right: 0, width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#FFF' },
  avatarHint: { fontSize: 12, fontWeight: '500' },
  progressContainer: { marginTop: 12, width: '80%', alignItems: 'center' },
  progressBar: { width: '100%', height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  progressText: { fontSize: 12, marginTop: 4 },

  readOnlyCard: { borderRadius: 18, paddingHorizontal: 16, paddingVertical: 4, marginBottom: 20 },
  readOnlyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  readOnlyLabel: { fontSize: 13, fontWeight: '600', width: 50 },
  readOnlyValue: { flex: 1, fontSize: 14, fontWeight: '700' },
  divider: { height: 1, marginHorizontal: 4 },

  form: { gap: 4 },
  fieldGroup: { marginBottom: 16 },
  fieldLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8, paddingHorizontal: 4 },
  fieldLabel: { fontSize: 14, fontWeight: '700' },
  fieldHint: { fontSize: 11, fontWeight: '500' },
  saveBtn: { marginTop: 12 },
});
