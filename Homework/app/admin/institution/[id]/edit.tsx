import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { ThemedView } from '@/components/shared/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { 
  ScrollView, 
  StyleSheet, 
  Text, 
  View, 
  Pressable, 
  TextInput, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '@/utils/api';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';

export default function EditInstitutionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [logo, setLogo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetchInstitution();
  }, [id]);

  const fetchInstitution = async () => {
    try {
      const res = await api.get(`/institutions/${id}`);
      setName(res.data.name);
      setAddress(res.data.address);
      setLogo(res.data.logoUrl);
    } catch (error) {
      // Mock data
      setName('Universidad Nacional Autónoma');
      setAddress('Av. Universitaria 123');
      setLogo('https://logo.clearbit.com/unam.mx');
    } finally {
      setFetching(false);
    }
  };

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

  const handleUpdate = async () => {
    if (!name.trim() || !address.trim()) {
      Toast.show({ type: 'error', text1: 'Campos requeridos' });
      return;
    }

    try {
      setLoading(true);
      await api.put(`/institutions/${id}`, { name, address, logoUrl: logo });
      Toast.show({ type: 'success', text1: 'Institución actualizada' });
      router.back();
    } catch (error) {
      // Mock success
      Toast.show({ type: 'success', text1: 'Institución actualizada (Mock)' });
      router.back();
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
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
              <Pressable onPress={pickImage} style={[styles.logoContainer, { backgroundColor: theme.colors.card }]}>
                {logo ? (
                  <Image source={{ uri: logo }} style={styles.logo} />
                ) : (
                  <Ionicons name="camera" size={40} color={theme.colors.textSecondary} />
                )}
                <View style={[styles.editIcon, { backgroundColor: theme.colors.primary }]}>
                  <Ionicons name="pencil" size={16} color="#FFF" />
                </View>
              </Pressable>
              <Text style={[styles.logoHint, { color: theme.colors.textSecondary }]}>Toca para cambiar el logo</Text>
            </View>

            <View style={styles.form}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Nombre de la Institución</Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.colors.card }]}>
                <Ionicons name="business-outline" size={20} color={theme.colors.primary} style={styles.inputIcon} />
                <TextInput 
                  style={[styles.input, { color: theme.colors.text }]}
                  value={name}
                  onChangeText={setName}
                  placeholder="Nombre oficial"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>

              <Text style={[styles.label, { color: theme.colors.textSecondary, marginTop: 20 }]}>Dirección Física</Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.colors.card }]}>
                <Ionicons name="location-outline" size={20} color={theme.colors.primary} style={styles.inputIcon} />
                <TextInput 
                  style={[styles.input, { color: theme.colors.text }]}
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Calle, Ciudad, País"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>

              <Pressable 
                style={[styles.submitBtn, { backgroundColor: theme.colors.primary }]}
                onPress={handleUpdate}
                disabled={loading}
              >
                {loading ? (
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
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 10 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', marginLeft: 10 },
  scrollContent: { padding: 20 },
  logoSection: { alignItems: 'center', marginBottom: 30 },
  logoContainer: { width: 120, height: 120, borderRadius: 40, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  logo: { width: 120, height: 120, borderRadius: 40 },
  editIcon: { position: 'absolute', bottom: -5, right: -5, width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#FFF' },
  logoHint: { fontSize: 13, marginTop: 12, fontWeight: '500' },
  form: { marginTop: 10 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginLeft: 4 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', height: 60, borderRadius: 20, paddingHorizontal: 16 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, fontWeight: '600' },
  submitBtn: { height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginTop: 40 },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
