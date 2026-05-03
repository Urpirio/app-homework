import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { ThemedView } from '@/components/shared/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AnimatedInput } from '@/components/login/AnimatedInput';
import { AnimatedButton } from '@/components/login/AnimatedButton';
import api from '@/utils/api';
import Toast from 'react-native-toast-message';

export default function CreateClassroomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  // Eliminado fetchTeachers por cambio de requerimiento (múltiples maestros por aula)

  const handleCreate = async () => {
    if (!name) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Por favor asigna un nombre al aula' });
      return;
    }

    setLoading(true);
    try {
      await api.post('/projects', {
        name,
        description,
        color: '#007AFF',
        institutionId: id
      });

      Toast.show({ type: 'success', text1: 'Éxito', text2: 'Aula creada correctamente' });
      router.back();
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'No se pudo crear el aula' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ThemedView style={styles.container}>
        <BackgroundShapes />
        
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Crear Nueva Aula</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.formCard}>
            <Text style={[styles.title, { color: theme.colors.text }]}>Información del Aula</Text>
            
            <View style={styles.inputContainer}>
              <AnimatedInput
                value={name}
                onChangeText={setName}
                placeholder="Nombre del Aula"
                icon="business-outline"
              />
              <AnimatedInput
                value={description}
                onChangeText={setDescription}
                placeholder="Descripción corta"
                icon="document-text-outline"
              />
            </View>

            {/* Eliminado selector de maestros por cambio de requerimiento */}

            <View style={styles.buttonContainer}>
              <AnimatedButton
                title="Crear Aula"
                onPress={handleCreate}
                loading={loading}
                disabled={!name}
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
  header: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', marginLeft: 10 },
  scrollContent: { padding: 20 },
  formCard: { padding: 20, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 20 },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 12 },
  teacherList: { marginBottom: 24 },
  teacherCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 12, 
    borderRadius: 16, 
    borderWidth: 2, 
    marginBottom: 8 
  },
  teacherInfo: { flex: 1 },
  teacherName: { fontSize: 16, fontWeight: '700' },
  teacherEmail: { fontSize: 12, marginTop: 2 },
  buttonContainer: { paddingBottom: 10 },
});
