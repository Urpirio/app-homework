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
  const [teacherSearch, setTeacherSearch] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);

  const createClassroom = useCreateClassroom();

  // Fetch teachers for this institution
  const {
    data: teacherPages,
    isLoading: loadingTeachers,
    fetchNextPage,
    hasNextPage,
  } = useUsers({
    institutionId,
    role: 'TEACHER' as any,
    search: teacherSearch || undefined,
  });

  const teachers = useMemo(() => {
    if (!teacherPages?.pages) return [];
    return teacherPages.pages.flatMap((page) => page.data);
  }, [teacherPages]);

  const selectedTeacher = useMemo(
    () => teachers.find((t) => t.id === selectedTeacherId),
    [teachers, selectedTeacherId]
  );

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
        teacherId: selectedTeacherId,
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

            {/* Teacher assignment - searchable dropdown */}
            <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>
              Asignar Maestro (opcional)
            </Text>

            {selectedTeacher ? (
              <View style={[styles.selectedTeacherCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.primary }]}>
                <View style={[styles.teacherIcon, { backgroundColor: theme.colors.primaryLight }]}>
                  <Text style={[styles.teacherInitial, { color: theme.colors.primary }]}>
                    {selectedTeacher.fullName?.charAt(0) ?? '?'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.teacherName, { color: theme.colors.text }]}>
                    {selectedTeacher.fullName}
                  </Text>
                  <Text style={[styles.teacherEmail, { color: theme.colors.textSecondary }]}>
                    {selectedTeacher.email}
                  </Text>
                </View>
                <Pressable
                  onPress={() => setSelectedTeacherId(null)}
                  accessibilityRole="button"
                  accessibilityLabel="Quitar maestro"
                >
                  <Ionicons name="close-circle" size={24} color={theme.colors.textSecondary} />
                </Pressable>
              </View>
            ) : (
              <>
                <View style={[styles.searchBar, { backgroundColor: theme.colors.card }]}>
                  <Ionicons name="search" size={18} color={theme.colors.textSecondary} />
                  <TextInput
                    style={[styles.searchInput, { color: theme.colors.text }]}
                    placeholder="Buscar maestro..."
                    placeholderTextColor={theme.colors.textSecondary}
                    value={teacherSearch}
                    onChangeText={setTeacherSearch}
                    accessibilityLabel="Buscar maestro"
                  />
                </View>

                {loadingTeachers ? (
                  <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginTop: 12 }} />
                ) : (
                  <FlatList
                    data={teachers}
                    keyExtractor={(item) => item.id}
                    scrollEnabled={false}
                    style={styles.teacherList}
                    renderItem={({ item }) => (
                      <Pressable
                        onPress={() => setSelectedTeacherId(item.id)}
                        style={[styles.teacherCard, { backgroundColor: theme.colors.card }]}
                        accessibilityRole="button"
                        accessibilityLabel={`Seleccionar ${item.fullName}`}
                      >
                        <View style={[styles.teacherIcon, { backgroundColor: theme.colors.primaryLight }]}>
                          <Text style={[styles.teacherInitial, { color: theme.colors.primary }]}>
                            {item.fullName?.charAt(0) ?? '?'}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.teacherName, { color: theme.colors.text }]}>
                            {item.fullName}
                          </Text>
                          <Text style={[styles.teacherEmail, { color: theme.colors.textSecondary }]}>
                            {item.email}
                          </Text>
                        </View>
                        <Ionicons name="add-circle-outline" size={22} color={theme.colors.primary} />
                      </Pressable>
                    )}
                    onEndReached={() => {
                      if (hasNextPage) fetchNextPage();
                    }}
                    onEndReachedThreshold={0.5}
                    ListEmptyComponent={
                      <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                        No se encontraron maestros
                      </Text>
                    }
                  />
                )}
              </>
            )}

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
