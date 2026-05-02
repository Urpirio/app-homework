import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { AnimatedButton } from '@/components/login/AnimatedButton';
import { AnimatedInput } from '@/components/login/AnimatedInput';
import { ThemedView } from '@/components/shared/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { 
  ScrollView, 
  StyleSheet, 
  Text, 
  View, 
  Dimensions, 
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import { useEffect } from 'react';  
import { ActivityIndicator } from 'react-native';
import api from '@/utils/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function EditProfileScreen() {
  const { theme } = useTheme();

  // State for user data
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/auth/profile');
        const user = response.data;
        setName(user.fullName || '');
        setEmail(user.email || '');
        setRole(user.role || '');
        setImage(user.avatarUrl || null);
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setFetching(false);
      }
    };
    fetchProfile();
  }, []);

  const horizontalPadding = SCREEN_WIDTH > 400 ? theme.spacing.xl : theme.spacing.md;

  const pickImage = async () => {
    // Request permission
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

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      await api.patch('/auth/profile', {
        fullName: name,
        email,
        role,
        avatarUrl: image
      });
      Alert.alert('Éxito', 'Perfil actualizado con éxito');
      router.back();
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'No se pudo actualizar el perfil');
    } finally {
      setIsLoading(false);
    }
  };

  if (fetching) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ThemedView style={styles.container}>
        <BackgroundShapes />
        
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={{ paddingHorizontal: horizontalPadding }}>
              <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                  <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </Pressable>
                <Text style={[styles.title, { color: theme.colors.text }]}>Editar Perfil</Text>
                <View style={{ width: 40 }} />
              </View>

              <Animated.View entering={FadeInDown.duration(800)} style={styles.avatarSection}>
                <Pressable onPress={pickImage} style={styles.avatarWrapper}>
                  <View style={[styles.avatarContainer, { backgroundColor: theme.colors.primaryLight }]}>
                    {image ? (
                      <Image source={{ uri: image }} style={styles.avatarImage} />
                    ) : (
                      <Text style={[styles.avatarText, { color: theme.colors.primary }]}>JD</Text>
                    )}
                  </View>
                  <View style={[styles.changeAvatarBtn, { backgroundColor: theme.colors.primary }]}>
                    <Ionicons name="camera" size={20} color="#FFFFFF" />
                  </View>
                </Pressable>
                <Text style={[styles.avatarHint, { color: theme.colors.textSecondary }]}>
                  Toca para cambiar tu foto
                </Text>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(200)} style={styles.formSection}>
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Nombre Completo</Text>
                  <AnimatedInput
                    value={name}
                    onChangeText={setName}
                    placeholder="Tu nombre"
                    icon="person-outline"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Correo Electrónico</Text>
                  <AnimatedInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Tu correo"
                    icon="mail-outline"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Cargo / Rol</Text>
                  <AnimatedInput
                    value={role}
                    onChangeText={setRole}
                    placeholder="Tu cargo"
                    icon="briefcase-outline"
                  />
                </View>

                <View style={styles.buttonWrapper}>
                  <AnimatedButton 
                    title="Guardar Cambios" 
                    onPress={handleSave}
                    isLoading={isLoading}
                  />
                </View>
              </Animated.View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
  },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '800' },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: { fontSize: 44, fontWeight: '800' },
  changeAvatarBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  avatarHint: { fontSize: 13, fontWeight: '500' },
  formSection: {
    paddingBottom: 40,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
    marginLeft: 4,
  },
  buttonWrapper: {
    marginTop: 20,
  },
});
