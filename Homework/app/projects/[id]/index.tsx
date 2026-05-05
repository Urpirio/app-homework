import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import { ThemedView } from '@/components/shared/ThemedView';
import { useProfile } from '@/hooks/api/useAuth';
import { useCreateUnit, useSubject, useSubjectUnits, useUpdateUnit, useDeleteUnit } from '@/hooks/api/useProjects';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTheme();
  const { data: profile } = useProfile();
  const isTeacher = profile?.role === 'TEACHER' || profile?.role === 'SUPER_ADMIN' || profile?.role === 'SCHOOL_ADMIN';

  const [showCreateUnit, setShowCreateUnit] = useState(false);
  const [unitName, setUnitName] = useState('');
  const [unitDesc, setUnitDesc] = useState('');

  const createUnit = useCreateUnit(id ?? '');

  const {
    data: project,
    isLoading: projectLoading,
    isError: projectError,
    error: projectErr,
    refetch: refetchProject,
  } = useSubject(id ?? '');

  const {
    data: units,
    isLoading: unitsLoading,
    isError: unitsError,
    error: unitsErr,
    refetch: refetchUnits,
  } = useSubjectUnits(id ?? '');

  const isLoading = projectLoading || unitsLoading;
  const isError = projectError || unitsError;
  const error = projectErr || unitsErr;

  const teachers = (project?.members ?? [])
    .filter((m: any) => m.role !== 'student')
    .map((m: any) => ({ id: m.user.id, name: m.user.fullName }));

  const students = (project?.members ?? [])
    .filter((m: any) => m.role === 'student')
    .map((m: any) => ({ id: m.user.id, name: m.user.fullName }));

  const unitList = (units ?? []).map((unit: any) => {
    const totalTasks = unit.tasks?.length ?? 0;
    // A task is "completed" by the student if they have a submission for it
    const completedTasks = unit.tasks?.filter(
      (t: any) => t.submissions && t.submissions.length > 0
    ).length ?? 0;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      id: unit.id,
      name: unit.name,
      description: unit.description ?? '',
      tasksCount: totalTasks,
      completedTasks,
      progress,
    };
  });

  const handleRefetch = () => {
    refetchProject();
    refetchUnits();
  };

  const handleCreateUnit = async () => {
    if (!unitName.trim()) {
      Alert.alert('Campo requerido', 'El nombre de la unidad es obligatorio.');
      return;
    }
    try {
      await createUnit.mutateAsync({
        name: unitName.trim(),
        description: unitDesc.trim() || undefined,
        order: unitList.length + 1,
      });
      setShowCreateUnit(false);
      setUnitName('');
      setUnitDesc('');
      Toast.show({ type: 'success', text1: 'Unidad creada' });
    } catch {
      Toast.show({ type: 'error', text1: 'Error al crear unidad' });
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ThemedView style={styles.container}>
        <BackgroundShapes />

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={{ paddingHorizontal: 20 }}>
            <View style={styles.header}>
              <Pressable onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
              </Pressable>

              <View style={styles.headerRight}>
                {isTeacher && (
                  <Pressable
                    onPress={() => router.push(`/projects/${id}/attendance`)}
                    style={[styles.attendanceButton, { backgroundColor: '#34C75915', marginRight: 8 }]}
                  >
                    <Ionicons name="people-outline" size={20} color="#34C759" />
                  </Pressable>
                )}
                <Pressable
                  onPress={() =>
                    router.push(
                      `/chat/${id}?type=project&name=${encodeURIComponent(project?.name || '')}`
                    )
                  }
                  style={[styles.chatButton, { backgroundColor: theme.colors.primaryLight }]}
                >
                  <Ionicons name="chatbubbles" size={20} color={theme.colors.primary} />
                  <Text style={[styles.chatLabel, { color: theme.colors.primary }]}>
                    Chat Grupal
                  </Text>
                </Pressable>
              </View>
            </View>

            {isLoading ? (
              <SkeletonLoader rows={4} variant="card" style={{ marginTop: 20 }} />
            ) : isError ? (
              <ErrorState
                error={error!}
                onRetry={handleRefetch}
                style={styles.stateContainer}
              />
            ) : !project ? (
              <ErrorState
                error={new Error('No se encontró la materia solicitada.')}
                onRetry={handleRefetch}
                style={styles.stateContainer}
              />
            ) : (
              <Animated.View entering={FadeInDown.duration(800)}>
                <View style={[styles.colorLabel, { backgroundColor: project.color || theme.colors.primary }]} />
                <Text style={[styles.title, { color: theme.colors.text }]}>
                  {project.name}
                </Text>

                <View style={styles.teachersSection}>
                  <Text style={[styles.sectionSubtitle, { color: theme.colors.textSecondary }]}>
                    Maestro(s)
                  </Text>
                  {teachers.length === 0 ? (
                    <Text style={[styles.noDataText, { color: theme.colors.textSecondary }]}>
                      Sin maestros asignados
                    </Text>
                  ) : (
                    teachers.map((teacher: any) => (
                      <View
                        key={teacher.id}
                        style={[styles.teacherCard, { backgroundColor: theme.colors.card }]}
                      >
                        <View
                          style={[
                            styles.teacherAvatar,
                            { backgroundColor: theme.colors.primaryLight },
                          ]}
                        >
                          <Text style={[styles.avatarText, { color: theme.colors.primary }]}>
                            {teacher.name?.charAt(0)}
                          </Text>
                        </View>
                        <View style={styles.teacherInfo}>
                          <Text style={[styles.teacherName, { color: theme.colors.text }]}>
                            {teacher.name}
                          </Text>
                          <Text
                            style={[styles.teacherRole, { color: theme.colors.textSecondary }]}
                          >
                            Docente Titular
                          </Text>
                        </View>
                      </View>
                    ))
                  )}
                </View>

                <View style={styles.studentsSection}>
                  <View style={styles.sectionHeader}>
                    <View style={styles.facepileContainer}>
                      {students.slice(0, 4).map((student: any, index: number) => (
                        <View
                          key={student.id}
                          style={[
                            styles.miniAvatar,
                            {
                              marginLeft: index === 0 ? 0 : -12,
                              zIndex: 10 - index,
                              backgroundColor: theme.colors.primaryLight,
                              borderColor: theme.colors.background,
                            },
                          ]}
                        >
                          <Text
                            style={[styles.miniAvatarText, { color: theme.colors.primary }]}
                          >
                            {student.name?.charAt(0)}
                          </Text>
                        </View>
                      ))}
                      {students.length > 4 && (
                        <View
                          style={[
                            styles.miniAvatar,
                            {
                              marginLeft: -12,
                              backgroundColor: theme.colors.border,
                              borderColor: theme.colors.background,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.miniAvatarText,
                              { color: theme.colors.textSecondary },
                            ]}
                          >
                            +{students.length - 4}
                          </Text>
                        </View>
                      )}
                    </View>

                    <Pressable
                      onPress={() =>
                        router.push({
                          pathname: '/projects/[id]/students',
                          params: { id: id!, name: project?.name },
                        })
                      }
                      style={styles.viewAllBtn}
                    >
                      <Text style={[styles.viewAllText, { color: theme.colors.primary }]}>
                        Ver lista de alumnos
                      </Text>
                      <Ionicons name="chevron-forward" size={14} color={theme.colors.primary} />
                    </Pressable>
                  </View>
                </View>

                <View style={styles.unitsSection}>
                  <View style={styles.unitsSectionHeader}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                      Unidades
                    </Text>
                    {isTeacher && (
                      <Pressable
                        onPress={() => setShowCreateUnit(true)}
                        style={[styles.addBtn, { backgroundColor: theme.colors.primary }]}
                      >
                        <Ionicons name="add" size={16} color="#FFF" />
                      </Pressable>
                    )}
                  </View>
                  {unitList.length === 0 ? (
                    <EmptyState
                      icon="layers-outline"
                      title="Sin unidades"
                      message="Esta materia aún no tiene unidades de aprendizaje."
                      style={styles.emptyUnits}
                    />
                  ) : (
                    unitList.map((unit: any, index: number) => (
                      <Animated.View key={unit.id} entering={FadeInDown.delay(index * 100)}>
                        <Pressable
                          onPress={() =>
                            router.push({
                              pathname: `/projects/${id}/unit/${unit.id}` as any,
                              params: { unitName: unit.name },
                            })
                          }
                          style={[styles.unitCard, { backgroundColor: theme.colors.card }]}
                        >
                          <View style={styles.unitInfo}>
                            <Text style={[styles.unitName, { color: theme.colors.text }]}>
                              {unit.name}
                            </Text>
                            <Text
                              style={[styles.unitDesc, { color: theme.colors.textSecondary }]}
                            >
                              {unit.description}
                            </Text>
                            <View style={styles.unitMeta}>
                              <Ionicons
                                name="list-outline"
                                size={14}
                                color={theme.colors.primary}
                              />
                              <Text
                                style={[styles.unitTasksCount, { color: theme.colors.primary }]}
                              >
                                {unit.tasksCount} Tareas · {unit.completedTasks} entregadas
                              </Text>
                            </View>
                          </View>
                          <View style={styles.unitAction}>
                            <View
                              style={[
                                styles.progressCircle,
                                { borderColor: theme.colors.border },
                              ]}
                            >
                              <Text
                                style={[styles.progressPercent, { color: theme.colors.text }]}
                              >
                                {unit.progress}%
                              </Text>
                            </View>
                            <Ionicons
                              name="chevron-forward"
                              size={20}
                              color={theme.colors.border}
                            />
                          </View>
                        </Pressable>
                      </Animated.View>
                    ))
                  )}
                </View>
                <View style={{ height: 40 }} />
              </Animated.View>
            )}
          </View>
        </ScrollView>

        {/* Create Unit Modal */}
        <Modal visible={showCreateUnit} transparent animationType="slide" onRequestClose={() => setShowCreateUnit(false)}>
          <Pressable style={styles.modalOverlay} onPress={() => setShowCreateUnit(false)}>
            <Pressable style={[styles.modalCard, { backgroundColor: theme.colors.card }]} onPress={() => {}}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Nueva Unidad</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }]}
                placeholder="Nombre de la unidad *"
                placeholderTextColor={theme.colors.textSecondary}
                value={unitName}
                onChangeText={setUnitName}
              />
              <TextInput
                style={[styles.modalInput, styles.modalTextArea, { backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }]}
                placeholder="Descripción (opcional)"
                placeholderTextColor={theme.colors.textSecondary}
                value={unitDesc}
                onChangeText={setUnitDesc}
                multiline
              />
              <View style={styles.modalBtns}>
                <Pressable onPress={() => setShowCreateUnit(false)} style={[styles.modalCancelBtn, { borderColor: theme.colors.border }]}>
                  <Text style={[styles.modalCancelText, { color: theme.colors.textSecondary }]}>Cancelar</Text>
                </Pressable>
                <Pressable
                  onPress={handleCreateUnit}
                  disabled={createUnit.isPending}
                  style={[styles.modalConfirmBtn, { backgroundColor: theme.colors.primary }]}
                >
                  <Text style={styles.modalConfirmText}>{createUnit.isPending ? 'Creando...' : 'Crear'}</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
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
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  attendanceButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatLabel: { fontSize: 13, fontWeight: '700' },
  colorLabel: { width: 50, height: 5, borderRadius: 3, marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '900', marginBottom: 24, letterSpacing: -0.5 },
  stateContainer: { flex: 1, paddingTop: 40 },
  teachersSection: { marginBottom: 24 },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  noDataText: { fontSize: 13, fontStyle: 'italic' },
  teacherCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 18,
    marginBottom: 8,
  },
  teacherAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarText: { fontSize: 18, fontWeight: '700' },
  teacherInfo: { marginLeft: 12 },
  teacherName: { fontSize: 15, fontWeight: '700' },
  teacherRole: { fontSize: 12, fontWeight: '500' },
  studentsSection: { marginBottom: 32 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewAllText: { fontSize: 12, fontWeight: '700' },
  facepileContainer: { flexDirection: 'row', alignItems: 'center' },
  miniAvatar: {
    width: 32,
    height: 32,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniAvatarText: { fontSize: 11, fontWeight: '800' },
  unitsSection: { marginBottom: 40 },
  unitsSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionTitle: { fontSize: 20, fontWeight: '900' },
  addBtn: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  emptyUnits: { paddingVertical: 20 },
  unitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 24,
    marginBottom: 12,
  },
  unitInfo: { flex: 1 },
  unitName: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  unitDesc: { fontSize: 13, lineHeight: 18, marginBottom: 10 },
  unitMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  unitTasksCount: { fontSize: 12, fontWeight: '700' },
  unitAction: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  progressCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressPercent: { fontSize: 11, fontWeight: '800' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, gap: 12 },
  modalTitle: { fontSize: 20, fontWeight: '900', marginBottom: 4 },
  modalInput: { borderWidth: 1, borderRadius: 14, padding: 14, fontSize: 15 },
  modalTextArea: { minHeight: 80, textAlignVertical: 'top' },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 4 },
  modalCancelBtn: { flex: 1, borderWidth: 1, borderRadius: 14, padding: 14, alignItems: 'center' },
  modalCancelText: { fontSize: 15, fontWeight: '700' },
  modalConfirmBtn: { flex: 2, borderRadius: 14, padding: 14, alignItems: 'center' },
  modalConfirmText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
  unitTeacherActions: { flexDirection: 'row', gap: 10, marginRight: 10 },
  unitActionBtn: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
});
