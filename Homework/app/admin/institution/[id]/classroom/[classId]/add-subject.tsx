import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { ThemedView } from '@/components/shared/ThemedView';
import { useCreateSubjectInClassroom } from '@/hooks/api/useClassrooms';
import { useUsers } from '@/hooks/api/useUsers';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

export default function AddSubjectScreen() {
  const { id: institutionId, classId } = useLocalSearchParams<{
    id: string;
    classId: string;
  }>();
  const router = useRouter();
  const { theme } = useTheme();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [gradingCriteria, setGradingCriteria] = useState('');
  const [teacherSearch, setTeacherSearch] = useState('');
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>([]);

  const createSubject = useCreateSubjectInClassroom(classId);

  const {
    data: teacherPages,
    isLoading: fetchingTeachers,
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

  const toggleTeacher = useCallback((teacherId: string) => {
    setSelectedTeacherIds((prev) => {
      if (prev.includes(teacherId)) {
        return prev.filter((tid) => tid !== teacherId);
      }
      if (prev.length >= 3) {
        Toast.show({
          type: 'info',
          text1: 'Límite alcanzado',
          text2: 'Puedes asignar un máximo de 3 maestros por materia',
        });
        return prev;
      }
      return [...prev, teacherId];
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!name.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Campo requerido',
        text2: 'Por favor ingresa el nombre de la materia',
      });
      return;
    }

    if (selectedTeacherIds.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'Maestro requerido',
        text2: 'Por favor selecciona al menos un maestro',
      });
      return;
    }

    try {
      await createSubject.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        gradingCriteria: gradingCriteria.trim() || undefined,
        teacherIds: selectedTeacherIds,
      });

      Toast.show({
        type: 'success',
        text1: 'Materia creada',
        text2: 'La materia se ha registrado correctamente',
      });

      router.back();
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudo crear la materia',
      });
    }
  }, [name, description, gradingCriteria, selectedTeacherIds, createSubject, router]);

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
    >
      <ThemedView style={styles.container}>
        <BackgroundShapes />

        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Volver"
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Nueva Materia
          </Text>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={styles.content}>
            {/* Subject name */}
            <View style={styles.inputSection}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                Nombre de la Materia
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  { backgroundColor: theme.colors.card },
                ]}
              >
                <Ionicons
                  name="journal-outline"
                  size={20}
                  color={theme.colors.primary}
                />
                <TextInput
                  style={[styles.input, { color: theme.colors.text }]}
                  placeholder="Ej. Matemáticas Avanzadas"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={name}
                  onChangeText={setName}
                  accessibilityLabel="Nombre de la materia"
                />
              </View>
            </View>

            {/* Description */}
            <View style={styles.inputSection}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                Descripción (opcional)
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: theme.colors.card,
                    height: 80,
                    alignItems: 'flex-start',
                    paddingTop: 14,
                  },
                ]}
              >
                <Ionicons
                  name="document-text-outline"
                  size={20}
                  color={theme.colors.primary}
                  style={{ marginTop: 2 }}
                />
                <TextInput
                  style={[
                    styles.input,
                    { color: theme.colors.text, textAlignVertical: 'top' },
                  ]}
                  placeholder="Descripción de la materia"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  accessibilityLabel="Descripción de la materia"
                />
              </View>
            </View>

            {/* Grading criteria */}
            <View style={styles.inputSection}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                Criterios de Evaluación (opcional)
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  { backgroundColor: theme.colors.card },
                ]}
              >
                <Ionicons
                  name="clipboard-outline"
                  size={20}
                  color={theme.colors.primary}
                />
                <TextInput
                  style={[styles.input, { color: theme.colors.text }]}
                  placeholder="Ej. Exámenes 40%, Tareas 30%, Participación 30%"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={gradingCriteria}
                  onChangeText={setGradingCriteria}
                  accessibilityLabel="Criterios de evaluación"
                />
              </View>
            </View>

            {/* Teacher assignment */}
            <View style={styles.teacherSection}>
              <View style={styles.labelRow}>
                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                  Asignar Maestros
                </Text>
                <Text style={[styles.count, { color: theme.colors.primary }]}>
                  {selectedTeacherIds.length}/3
                </Text>
              </View>
              <View
                style={[styles.searchBar, { backgroundColor: theme.colors.card }]}
              >
                <Ionicons
                  name="search"
                  size={18}
                  color={theme.colors.textSecondary}
                />
                <TextInput
                  style={[styles.searchInput, { color: theme.colors.text }]}
                  placeholder="Buscar maestro..."
                  placeholderTextColor={theme.colors.textSecondary}
                  value={teacherSearch}
                  onChangeText={setTeacherSearch}
                  accessibilityLabel="Buscar maestro"
                />
              </View>

              {fetchingTeachers ? (
                <ActivityIndicator
                  size="small"
                  color={theme.colors.primary}
                  style={{ marginTop: 20 }}
                />
              ) : (
                <FlatList
                  data={teachers}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => {
                    const isSelected = selectedTeacherIds.includes(item.id);
                    return (
                      <Pressable
                        onPress={() => toggleTeacher(item.id)}
                        style={[
                          styles.teacherCard,
                          {
                            backgroundColor: theme.colors.card,
                            borderColor: isSelected
                              ? theme.colors.primary
                              : 'transparent',
                            borderWidth: 2,
                          },
                        ]}
                        accessibilityRole="button"
                        accessibilityState={{ selected: isSelected }}
                        accessibilityLabel={`${isSelected ? 'Quitar' : 'Seleccionar'} ${item.fullName}`}
                      >
                        <View
                          style={[
                            styles.teacherIcon,
                            { backgroundColor: theme.colors.primaryLight },
                          ]}
                        >
                          <Text
                            style={[
                              styles.teacherInitial,
                              { color: theme.colors.primary },
                            ]}
                          >
                            {item.fullName?.charAt(0) ?? '?'}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[
                              styles.teacherName,
                              { color: theme.colors.text },
                            ]}
                          >
                            {item.fullName}
                          </Text>
                          <Text
                            style={[
                              styles.teacherSpecialty,
                              { color: theme.colors.textSecondary },
                            ]}
                          >
                            {(item as any).specialty || item.email || 'Maestro Activo'}
                          </Text>
                        </View>
                        <Ionicons
                          name={
                            isSelected ? 'checkmark-circle' : 'ellipse-outline'
                          }
                          size={24}
                          color={
                            isSelected
                              ? theme.colors.primary
                              : theme.colors.border
                          }
                        />
                      </Pressable>
                    );
                  }}
                  style={styles.teacherList}
                  contentContainerStyle={{ paddingBottom: 20 }}
                  onEndReached={() => {
                    if (hasNextPage) fetchNextPage();
                  }}
                  onEndReachedThreshold={0.5}
                  ListEmptyComponent={
                    <Text
                      style={[
                        styles.emptyText,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      No se encontraron maestros
                    </Text>
                  }
                />
              )}
            </View>
          </View>

          <View
            style={[styles.footer, { backgroundColor: theme.colors.background }]}
          >
            <Pressable
              style={[
                styles.submitBtn,
                {
                  backgroundColor: theme.colors.primary,
                  opacity: createSubject.isPending ? 0.6 : 1,
                },
              ]}
              onPress={handleSubmit}
              disabled={createSubject.isPending}
              accessibilityRole="button"
              accessibilityLabel="Guardar materia"
            >
              {createSubject.isPending ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.submitBtnText}>Guardar Materia</Text>
              )}
            </Pressable>
          </View>
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
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', marginLeft: 10 },
  content: { flex: 1, paddingHorizontal: 20 },
  inputSection: { marginBottom: 16 },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingRight: 4,
  },
  count: { fontSize: 13, fontWeight: '700' },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    paddingHorizontal: 16,
    height: 56,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '600',
  },
  teacherSection: { flex: 1 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 15,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 12,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14 },
  teacherList: { flex: 1 },
  teacherCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 20,
    marginBottom: 10,
  },
  teacherIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  teacherInitial: { fontSize: 18, fontWeight: '700' },
  teacherName: { fontSize: 15, fontWeight: '700' },
  teacherSpecialty: { fontSize: 12, marginTop: 2 },
  emptyText: { textAlign: 'center', marginTop: 40, fontSize: 14 },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  submitBtn: {
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
