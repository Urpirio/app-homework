import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { ThemedView } from '@/components/shared/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AnimatedInput } from '@/components/login/AnimatedInput';
import { AnimatedButton } from '@/components/login/AnimatedButton';
import api from '@/utils/api';
import Toast from 'react-native-toast-message';

export default function CreateTeacherScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let pass = '';
    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(pass);
  };

  const handleCreate = async () => {
    if (!fullName || !email || !password) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Completa los campos obligatorios' });
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/institutional-user', {
        fullName,
        email,
        password,
        specialty,
        bio,
        role: 'TEACHER',
        institutionId: id
      });
      Toast.show({ type: 'success', text1: 'Éxito', text2: 'Maestro registrado correctamente' });
      router.back();
    } catch (error: any) {
      Toast.show({ 
        type: 'error', 
        text1: 'Error', 
        text2: error.response?.data?.message || 'Error al registrar maestro' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ThemedView style={styles.container}>
        <BackgroundShapes />
        
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Volver">
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Nuevo Maestro</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.formCard}>
            <Text style={[styles.title, { color: theme.colors.text }]}>Perfil del Docente</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              Ingresa la información básica para el acceso del nuevo maestro.
            </Text>

            <View style={styles.inputContainer}>
              <AnimatedInput
                value={fullName}
                onChangeText={setFullName}
                placeholder="Nombre Completo"
                icon="person-outline"
                accessibilityLabel="Nombre completo"
                accessibilityHint="Ingresa nombre y apellidos"
              />
              <AnimatedInput
                value={email}
                onChangeText={setEmail}
                placeholder="Correo Electrónico"
                icon="mail-outline"
                autoCapitalize="none"
                accessibilityLabel="Correo electrónico"
                accessibilityHint="Ingresa el correo institucional"
              />
              <AnimatedInput
                value={specialty}
                onChangeText={setSpecialty}
                placeholder="Especialidad (ej. Matemáticas)"
                icon="school-outline"
                accessibilityLabel="Especialidad"
                accessibilityHint="Ingresa el área de enseñanza"
              />
              <AnimatedInput
                value={bio}
                onChangeText={setBio}
                placeholder="Biografía / Perfil profesional"
                icon="document-text-outline"
                multiline
                accessibilityLabel="Biografía"
                accessibilityHint="Ingresa una breve descripción del perfil"
              />
              
              <View style={styles.passwordRow}>
                <View style={{ flex: 1 }}>
                  <AnimatedInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Contraseña"
                    icon="lock-closed-outline"
                    autoCapitalize="none"
                    accessibilityLabel="Contraseña"
                    accessibilityHint="Crea una contraseña o genera una"
                  />
                </View>
                <Pressable 
                  style={[styles.generateBtn, { backgroundColor: theme.colors.primary }]}
                  onPress={generatePassword}
                  accessibilityLabel="Generar contraseña"
                  accessibilityRole="button"
                >
                  <Ionicons name="refresh" size={24} color="#FFFFFF" />
                </Pressable>
              </View>
            </View>

            <View style={styles.buttonContainer}>
              <AnimatedButton
                title="Registrar Maestro"
                onPress={handleCreate}
                isLoading={loading}
                accessibilityLabel="Botón registrar maestro"
                accessibilityHint="Toca para crear el perfil del maestro"
              />
            </View>
          </View>
        </ScrollView>
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
  formCard: { 
    padding: 24, 
    borderRadius: 32, 
    backgroundColor: 'rgba(255,255,255,0.05)', 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.1)' 
  },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 8 },
  subtitle: { fontSize: 14, marginBottom: 24, lineHeight: 20 },
  inputContainer: { marginBottom: 24 },
  passwordRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  generateBtn: { 
    width: 50, 
    height: 50, 
    borderRadius: 15, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: 10 
  },
  buttonContainer: { marginTop: 10 },
});
