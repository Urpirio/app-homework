import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { ErrorState } from '@/components/shared/ErrorState';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import { ThemedView } from '@/components/shared/ThemedView';
import { useSubject, useUpdateSubject } from '@/hooks/api/useProjects';
import { useInstitutionTeachers } from '@/hooks/api/useUsers';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

export default function EditSubjectScreen() {
  const { id: institutionId, classId, subjectId } = useLocalSearchParams<{
    id: string;
    classId: string;
    subjectId: string;
  }>();
  const router = useRouter();
  const { theme } = useTheme();

  const [name, setName] = useState('');
  const [search, setSearch] = useState('');
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>([]);

  const {
    data: subject,
    isLoading: loadingSubject,
    isError: subjectError,
    error: subjectErr,
    refetch: refetchSubject,
  } = useSubject(subjectId);

  const {
    data: teachers = [],
    isLoading: loadingTeachers,
  } = useInstitutionTeachers(institutionId);

  const updateSubject = useUpdateSubject();

  // Pre-populate form when subject data loads
  useEffect(() => {
    if (subject) {
      setName(subject.name ?? '');
      const teacherIds = subject.teachers
        ? subject.teachers.map((t: any) => t.id)
        : subject.user
          ? [subject.user.id]
          : [];
      setSelectedTeacherIds(teacherIds);
    }
  }, [subject]);

  const filteredTeachers = useMemo(
    () =>
      teachers.filter((t) =>
        t.fullName?.toLowerCase().includes(search.toLowerCase())
      ),
    [teachers, search]
  );

  const toggleTeacher = useCallback(
    (teacherId: string) => {
      if (selectedTeacherIds.includes(teacherId)) {
        setSelectedTeacherIds((prev) => prev.filter((tid) => tid !== teacherId));
      } else {
        if (selectedTeacherIds.length >= 3) {
          Toast.show({
            type: 'info',
            text1: 'Límite alcanzado',
            text2: 'Puedes asignar un máximo de 3 maestros por materia',
          });
          return;
        }
        setSelectedTeacherIds((prev) => [...prev, teacherId]);
      }
    },
    [selectedTeacherIds]
  );

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
      await updateSubject.mutateAsync({
        id: subjectId,
        name,
        teacherIds: selectedTeacherIds,
      });

      Toast.show({
        type: 'success',
        text1: 'Materia actualizada',
        text2: 'Los cambios se han guardado correctamente',
      });

      router.back();
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudieron guardar los cambios',
      });
    }
  }, [name, selectedTeacherIds, subjectId, updateSubject, router]);

  const isInitialLoading = loadingSubject || loadingTeachers;

  if (isInitialLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <ThemedView style={styles.container}>
          <BackgroundShapes />
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
            </Pressable>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Editar Materia</Text>
          </View>
          <SkeletonLoader rows={5} variant="detail" style={{ paddingHorizontal: 20 }} />
        </ThemedView>
      </SafeAreaView>
    );
  }

  if (subjectError) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <ThemedView style={styles.container}>
          <BackgroundShapes />
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
            </Pressable>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Editar Materia</Text>
          </View>
          <ErrorState
            error={subjectErr ?? new Error('Error al cargar la materia')}
            onRetry={() => refetchSubject()}
            onBack={() => router.back()}
          />
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
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Editar Materia</Text>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={styles.content}>
            <View style={styles.inputSection}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                Nombre de la Materia
              </Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.colors.card }]}>
                <Ionicons name="journal-outline" size={20} color={theme.colors.primary} />
                <TextInput
                  style={[styles.input, { color: theme.colors.text }]}
                  placeholder="Ej. Matemáticas Avanzadas"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={name}
                  onChangeText={setName}
                />
              </View>
            </View>

            <View style={styles.teacherSection}>
              <View style={styles.labelRow}>
                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                  Modificar Maestros
                </Text>
                <Text style={[styles.count, { color: theme.colors.primary }]}>
                  {selectedTeacherIds.length}/3
                </Text>
              </View>
              <View style={[styles.searchBar, { backgroundColor: theme.colors.card }]}>
                <Ionicons name="search" size={18} color={theme.colors.textSecondary} />
                <TextInput
                  style={[styles.searchInput, { color: theme.colors.text }]}
                  placeholder="Buscar maestro..."
                  placeholderTextColor={theme.colors.textSecondary}
                  value={search}
                  onChangeText={setSearch}
                />
              </View>

              <FlatList
                data={filteredTeachers}
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
                          borderColor: isSelected ? theme.colors.primary : 'transparent',
                          borderWidth: 2,
                        },
                      ]}
                    >
                      <View
                        style={[styles.teacherIcon, { backgroundColor: theme.colors.primaryLight }]}
                      >
                        <Text style={[styles.teacherInitial, { color: theme.colors.primary }]}>
                          {item.fullName?.charAt(0) ?? '?'}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.teacherNameText, { color: theme.colors.text }]}>
                          {item.fullName}
                        </Text>
                        <Text
                          style={[styles.teacherSpecialty, { color: theme.colors.textSecondary }]}
                        >
                          {item.specialty || 'Maestro Activo'}
                        </Text>
                      </View>
                      <Ionicons
                        name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                        size={24}
                        color={isSelected ? theme.colors.primary : theme.colors.border}
                      />
                    </Pressable>
                  );
                }}
                style={styles.teacherList}
                contentContainerStyle={{ paddingBottom: 20 }}
              />
            </View>
          </View>

          <View style={[styles.footer, { backgroundColor: theme.colors.background }]}>
            <Pressable
              style={[styles.submitBtn, { backgroundColor: theme.colors.primary }]}
              onPress={handleSubmit}
              disabled={updateSubject.isPending}
            >
              {updateSubject.isPending ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.submitBtnText}>Guardar Cambios</Text>
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
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginLeft: 10,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  inputSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
    marginLeft: 4,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingRight: 4,
  },
  count: {
    fontSize: 13,
    fontWeight: '700',
  },
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
  teacherSection: {
    flex: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 15,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
  },
  teacherList: {
    flex: 1,
  },
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
  teacherInitial: {
    fontSize: 18,
    fontWeight: '700',
  },
  teacherNameText: {
    fontSize: 15,
    fontWeight: '700',
  },
  teacherSpecialty: {
    fontSize: 12,
    marginTop: 2,
  },
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
  submitBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
