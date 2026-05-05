import { AnimatedButton } from '@/components/login/AnimatedButton';
import { AnimatedInput } from '@/components/login/AnimatedInput';
import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { ThemedView } from '@/components/shared/ThemedView';
import { useCreateClassroom } from '@/hooks/api/useClassrooms';
import { useUsers } from '@/hooks/api/useUsers';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

export default function CreateClassroomScreen() {
  const { id: institutionId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useTheme();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const createClassroom = useCreateClassroom();


  const handleCreate = useCallback(async () => {
    if (!name.trim()) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Por favor asigna un nombre al aula' });
      return;
    }

    try {
      await createClassroom.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        institutionId,
      });

      Toast.show({ type: 'success', text1: 'Éxito', text2: 'Aula creada correctamente' });
      router.back();
    } catch {
      Toast.show({ type: 'error', text1: 'Error', text2: 'No se pudo crear el aula' });
    }
  }, [name, description, institutionId, createClassroom, router]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ThemedView style={styles.container}>
        <BackgroundShapes />

        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Volver">
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
                accessibilityLabel="Nombre del aula"
                accessibilityHint="Ingresa el nombre del aula"
              />
              <AnimatedInput
                value={description}
                onChangeText={setDescription}
                placeholder="Descripción corta"
                icon="document-text-outline"
                accessibilityLabel="Descripción del aula"
                accessibilityHint="Ingresa una descripción corta del aula"
              />
            </View>


            <View style={styles.buttonContainer}>
              <AnimatedButton
                title="Crear Aula"
                onPress={handleCreate}
                isLoading={createClassroom.isPending}
                disabled={!name.trim()}
                accessibilityLabel="Crear aula"
                accessibilityHint="Toca para crear el aula con la información proporcionada"
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
  formCard: {
    padding: 20,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 20 },
  inputContainer: { marginBottom: 20 },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
    marginLeft: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 15,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
  },
  teacherList: {
    maxHeight: 240,
    marginBottom: 16,
  },
  teacherCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  selectedTeacherCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 2,
    marginBottom: 16,
  },
  teacherIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  teacherInitial: {
    fontSize: 18,
    fontWeight: '700',
  },
  teacherName: {
    fontSize: 15,
    fontWeight: '700',
  },
  teacherEmail: {
    fontSize: 12,
    marginTop: 2,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
  },
  buttonContainer: { paddingBottom: 10, marginTop: 10 },
});
