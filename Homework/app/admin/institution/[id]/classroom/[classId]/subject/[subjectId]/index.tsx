import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import { ThemedView } from '@/components/shared/ThemedView';
import {
    useDeleteSubject,
    useSubject,
    useSubjectStats,
    useSubjectTasks,
} from '@/hooks/api/useProjects';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

type TaskFilter = 'all' | 'TODO' | 'IN_PROGRESS' | 'DONE';
type TaskTypeFilter = 'all' | 'ASSIGNMENT' | 'EXAM' | 'NOTE' | 'QUIZ';

export default function SubjectDetailScreen() {
  const { id, classId, subjectId } = useLocalSearchParams<{
    id: string;
    classId: string;
    subjectId: string;
  }>();
  const router = useRouter();
  const { theme } = useTheme();

  const [statusFilter, setStatusFilter] = useState<TaskFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TaskTypeFilter>('all');
  const [unitFilter, setUnitFilter] = useState<string>('all');

  const {
    data: subject,
    isLoading: loadingSubject,
    isError: subjectError,
    error: subjectErr,
    refetch: refetchSubject,
  } = useSubject(subjectId);

  const {
    data: stats,
    isLoading: loadingStats,
  } = useSubjectStats(subjectId);

  const {
    data: tasks,
    isLoading: loadingTasks,
    isError: tasksError,
    refetch: refetchTasks,
  } = useSubjectTasks(subjectId);

  const deleteSubject = useDeleteSubject();

  const isLoading = loadingSubject || loadingStats || loadingTasks;

  // Extract units from subject data or tasks
  const units = useMemo(() => {
    if (!subject?.units) return [];
    return subject.units;
  }, [subject]);

  // Filter tasks by status, type, and unit
  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    const taskList = Array.isArray(tasks) ? tasks : tasks.data ?? [];
    return taskList.filter((task: any) => {
      if (statusFilter !== 'all' && task.status !== statusFilter) return false;
      if (typeFilter !== 'all' && task.type !== typeFilter) return false;
      if (unitFilter !== 'all' && task.unitId !== unitFilter) return false;
      return true;
    });
  }, [tasks, statusFilter, typeFilter, unitFilter]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Eliminar Materia',
      '¿Estás seguro de que deseas eliminar esta materia? Se eliminarán todas las tareas, entregas y unidades asociadas. Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSubject.mutateAsync(subjectId);
              Toast.show({
                type: 'success',
                text1: 'Materia eliminada',
                text2: 'La materia se ha eliminado correctamente',
              });
              router.back();
            } catch {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'No se pudo eliminar la materia',
              });
            }
          },
        },
      ]
    );
  }, [subjectId, deleteSubject, router]);

  const refetchAll = useCallback(() => {
    refetchSubject();
    refetchTasks();
  }, [refetchSubject, refetchTasks]);

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <ThemedView style={styles.container}>
          <BackgroundShapes />
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
            </Pressable>
            <View style={styles.headerText}>
              <Text style={[styles.title, { color: theme.colors.text }]}>Cargando...</Text>
            </View>
          </View>
          <SkeletonLoader rows={6} variant="detail" style={{ paddingHorizontal: 20 }} />
        </ThemedView>
      </SafeAreaView>
    );
  }

  // Error state
  if (subjectError) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <ThemedView style={styles.container}>
          <BackgroundShapes />
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
            </Pressable>
            <View style={styles.headerText}>
              <Text style={[styles.title, { color: theme.colors.text }]}>Error</Text>
            </View>
          </View>
          <ErrorState
            error={subjectErr ?? new Error('Error al cargar la materia')}
            onRetry={refetchAll}
            onBack={() => router.back()}
          />
        </ThemedView>
      </SafeAreaView>
    );
  }

  // Empty state (no subject data)
  if (!subject) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <ThemedView style={styles.container}>
          <BackgroundShapes />
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
            </Pressable>
          </View>
          <EmptyState
            icon="journal-outline"
            title="Materia no encontrada"
            message="No se encontró la información de esta materia."
            actionLabel="Volver"
            onAction={() => router.back()}
          />
        </ThemedView>
      </SafeAreaView>
    );
  }

  const classroomName = subject.classroom?.name ?? '';
  const teachers = subject.teachers ?? (subject.user ? [subject.user] : []);
  const primaryTeacherName = teachers.length > 0 ? teachers[0].fullName : '';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ThemedView style={styles.container}>
        <BackgroundShapes />

        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: theme.colors.text }]}>{subject.name}</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              {[primaryTeacherName, classroomName].filter(Boolean).join(' · ') || 'Gestión de Materia'}
            </Text>
          </View>
          <Pressable
            onPress={() =>
              router.push(
                `/admin/institution/${id}/classroom/${classId}/subject/${subjectId}/edit`
              )
            }
            style={[styles.editBtn, { backgroundColor: theme.colors.primaryLight }]}
          >
            <Ionicons name="create-outline" size={20} color={theme.colors.primary} />
          </Pressable>
          <Pressable
            onPress={handleDelete}
            style={[styles.deleteBtn, { backgroundColor: '#FF3B3015' }]}
          >
            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Teachers Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Maestros Asignados
            </Text>
            <View style={styles.teacherGrid}>
              {teachers.map((teacher: any) => (
                <View
                  key={teacher.id}
                  style={[styles.teacherBadge, { backgroundColor: theme.colors.card }]}
                >
                  <Ionicons name="person" size={16} color={theme.colors.primary} />
                  <Text style={[styles.teacherName, { color: theme.colors.text }]}>
                    {teacher.fullName}
                  </Text>
                </View>
              ))}
              {teachers.length === 0 && (
                <Text style={[styles.noTeacher, { color: theme.colors.textSecondary }]}>
                  Sin maestros asignados
                </Text>
              )}
            </View>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={[styles.statBox, { backgroundColor: theme.colors.card }]}>
              <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                {stats?.avgGrade != null ? Number(stats.avgGrade).toFixed(1) : '—'}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Promedio Gral.
              </Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: theme.colors.card }]}>
              <Text style={[styles.statValue, { color: '#5856D6' }]}>
                {stats?.submittedTasks ?? stats?.totalSubmissions ?? '—'}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Entregas
              </Text>
            </View>
            <Pressable
              onPress={() =>
                router.push(
                  `/admin/institution/${id}/classroom/${classId}/subject/${subjectId}/tasks`
                )
              }
              style={[styles.statBox, { backgroundColor: theme.colors.card }]}
            >
              <Text style={[styles.statValue, { color: '#FF9500' }]}>
                {stats?.totalTasks ?? '—'}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Tareas
              </Text>
            </Pressable>
            <View style={[styles.statBox, { backgroundColor: theme.colors.card }]}>
              <Text style={[styles.statValue, { color: '#34C759' }]}>
                {stats?.studentCount ?? stats?.totalStudents ?? '—'}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Alumnos
              </Text>
            </View>
          </View>

          {/* Units Section */}
          {units.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Unidades</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.unitRow}>
                  {units.map((unit: any) => {
                    const taskCount = unit._count?.tasks ?? unit.taskCount ?? 0;
                    const completionPct =
                      unit.completionPercentage != null
                        ? Math.round(unit.completionPercentage)
                        : null;
                    return (
                      <Pressable
                        key={unit.id}
                        onPress={() =>
                          router.push(`/projects/${subjectId}/unit/${unit.id}`)
                        }
                        style={[styles.unitCard, { backgroundColor: theme.colors.card }]}
                      >
                        <Ionicons name="folder-outline" size={24} color={theme.colors.primary} />
                        <Text
                          style={[styles.unitName, { color: theme.colors.text }]}
                          numberOfLines={2}
                        >
                          {unit.name}
                        </Text>
                        <Text style={[styles.unitMeta, { color: theme.colors.textSecondary }]}>
                          {taskCount} tarea{taskCount !== 1 ? 's' : ''}
                        </Text>
                        {completionPct != null && (
                          <View style={styles.completionRow}>
                            <View
                              style={[
                                styles.completionBar,
                                { backgroundColor: theme.colors.border + '30' },
                              ]}
                            >
                              <View
                                style={[
                                  styles.completionFill,
                                  {
                                    backgroundColor: theme.colors.primary,
                                    width: `${completionPct}%`,
                                  },
                                ]}
                              />
                            </View>
                            <Text
                              style={[
                                styles.completionText,
                                { color: theme.colors.textSecondary },
                              ]}
                            >
                              {completionPct}%
                            </Text>
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          )}

          {/* Recent Submissions */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Actividad Reciente
            </Text>
            {subject.recentSubmissions && subject.recentSubmissions.length > 0 ? (
              subject.recentSubmissions.map((sub: any) => (
                <View
                  key={sub.id}
                  style={[styles.submissionCard, { backgroundColor: theme.colors.card }]}
                >
                  <View style={styles.subInfo}>
                    <Text style={[styles.studentName, { color: theme.colors.text }]}>
                      {sub.studentName ?? sub.student?.fullName ?? 'Alumno'}
                    </Text>
                    <Text style={[styles.taskName, { color: theme.colors.textSecondary }]}>
                      {sub.taskName ?? sub.task?.title ?? ''}
                    </Text>
                  </View>
                  {sub.status === 'GRADED' || sub.status === 'Graded' ? (
                    <View
                      style={[
                        styles.gradeBadge,
                        { backgroundColor: theme.colors.success + '15' },
                      ]}
                    >
                      <Text style={[styles.gradeText, { color: theme.colors.success }]}>
                        {sub.grade ?? '—'}
                      </Text>
                    </View>
                  ) : (
                    <View
                      style={[
                        styles.pendingBadge,
                        { backgroundColor: theme.colors.border + '30' },
                      ]}
                    >
                      <Text style={[styles.pendingText, { color: theme.colors.textSecondary }]}>
                        Pendiente
                      </Text>
                    </View>
                  )}
                </View>
              ))
            ) : (
              <Text style={[styles.noActivity, { color: theme.colors.textSecondary }]}>
                No hay actividad reciente
              </Text>
            )}
          </View>

          {/* Task Listing with Filters */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Tareas</Text>

            {/* Filter chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterScroll}
            >
              <View style={styles.filterRow}>
                {/* Status filters */}
                {(['all', 'TODO', 'IN_PROGRESS', 'DONE'] as TaskFilter[]).map((f) => {
                  const labels: Record<TaskFilter, string> = {
                    all: 'Todos',
                    TODO: 'Pendiente',
                    IN_PROGRESS: 'En Progreso',
                    DONE: 'Completada',
                  };
                  const active = statusFilter === f;
                  return (
                    <Pressable
                      key={f}
                      onPress={() => setStatusFilter(f)}
                      style={[
                        styles.filterChip,
                        {
                          backgroundColor: active
                            ? theme.colors.primary
                            : theme.colors.card,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          { color: active ? '#FFF' : theme.colors.text },
                        ]}
                      >
                        {labels[f]}
                      </Text>
                    </Pressable>
                  );
                })}

                {/* Type filters */}
                {(['ASSIGNMENT', 'EXAM', 'QUIZ'] as TaskTypeFilter[]).map((f) => {
                  const labels: Record<string, string> = {
                    ASSIGNMENT: 'Tarea',
                    EXAM: 'Examen',
                    QUIZ: 'Quiz',
                  };
                  const active = typeFilter === f;
                  return (
                    <Pressable
                      key={f}
                      onPress={() => setTypeFilter(active ? 'all' : f)}
                      style={[
                        styles.filterChip,
                        {
                          backgroundColor: active
                            ? '#5856D6'
                            : theme.colors.card,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          { color: active ? '#FFF' : theme.colors.text },
                        ]}
                      >
                        {labels[f]}
                      </Text>
                    </Pressable>
                  );
                })}

                {/* Unit filter */}
                {units.length > 0 &&
                  units.map((unit: any) => {
                    const active = unitFilter === unit.id;
                    return (
                      <Pressable
                        key={`unit-${unit.id}`}
                        onPress={() => setUnitFilter(active ? 'all' : unit.id)}
                        style={[
                          styles.filterChip,
                          {
                            backgroundColor: active
                              ? '#FF9500'
                              : theme.colors.card,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.filterChipText,
                            { color: active ? '#FFF' : theme.colors.text },
                          ]}
                        >
                          {unit.name}
                        </Text>
                      </Pressable>
                    );
                  })}
              </View>
            </ScrollView>

            {tasksError ? (
              <ErrorState
                error={new Error('Error al cargar las tareas')}
                onRetry={() => refetchTasks()}
              />
            ) : filteredTasks.length === 0 ? (
              <View style={styles.emptyTasks}>
                <Ionicons
                  name="clipboard-outline"
                  size={40}
                  color={theme.colors.textSecondary}
                />
                <Text style={[styles.emptyTasksText, { color: theme.colors.textSecondary }]}>
                  No hay tareas con los filtros seleccionados
                </Text>
              </View>
            ) : (
              filteredTasks.map((task: any) => (
                <Pressable
                  key={task.id}
                  onPress={() =>
                    router.push(
                      `/admin/institution/${id}/classroom/${classId}/subject/${subjectId}/task/${task.id}`
                    )
                  }
                  style={({ pressed }) => [
                    styles.taskCard,
                    {
                      backgroundColor: theme.colors.card,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <View
                    style={[styles.taskIcon, { backgroundColor: theme.colors.primaryLight }]}
                  >
                    <Ionicons name="clipboard" size={22} color={theme.colors.primary} />
                  </View>
                  <View style={styles.taskInfo}>
                    <Text style={[styles.taskTitle, { color: theme.colors.text }]}>
                      {task.title}
                    </Text>
                    {task.dueDate && (
                      <Text style={[styles.taskDeadline, { color: theme.colors.textSecondary }]}>
                        Fecha límite: {new Date(task.dueDate).toLocaleDateString()}
                      </Text>
                    )}
                    <View style={styles.taskBadges}>
                      <StatusBadge status={task.status} theme={theme} />
                      {task.type && <TypeBadge type={task.type} theme={theme} />}
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={theme.colors.border} />
                </Pressable>
              ))
            )}
          </View>

          {/* Report Button */}
          <Pressable
            style={[styles.reportBtn, { borderColor: theme.colors.primary }]}
            onPress={() => {}}
          >
            <Ionicons name="document-text-outline" size={20} color={theme.colors.primary} />
            <Text style={[styles.reportBtnText, { color: theme.colors.primary }]}>
              Ver Reporte Detallado
            </Text>
          </Pressable>
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

function StatusBadge({ status, theme }: { status: string; theme: any }) {
  const config: Record<string, { label: string; color: string }> = {
    TODO: { label: 'Pendiente', color: '#FF9500' },
    IN_PROGRESS: { label: 'En Progreso', color: '#5856D6' },
    DONE: { label: 'Completada', color: '#34C759' },
  };
  const { label, color } = config[status] ?? { label: status, color: theme.colors.textSecondary };
  return (
    <View style={[styles.badge, { backgroundColor: color + '15' }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

function TypeBadge({ type, theme }: { type: string; theme: any }) {
  const config: Record<string, { label: string; color: string }> = {
    ASSIGNMENT: { label: 'Tarea', color: '#007AFF' },
    EXAM: { label: 'Examen', color: '#FF3B30' },
    NOTE: { label: 'Nota', color: '#8E8E93' },
    QUIZ: { label: 'Quiz', color: '#AF52DE' },
  };
  const { label, color } = config[type] ?? { label: type, color: theme.colors.textSecondary };
  return (
    <View style={[styles.badge, { backgroundColor: color + '15' }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
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
  headerText: {
    marginLeft: 10,
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  editBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  teacherGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  teacherBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  teacherName: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
  },
  noTeacher: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    minWidth: '20%',
    padding: 16,
    borderRadius: 20,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  // Unit cards
  unitRow: {
    flexDirection: 'row',
    gap: 12,
    paddingRight: 20,
  },
  unitCard: {
    width: 140,
    padding: 16,
    borderRadius: 20,
    alignItems: 'center',
    gap: 6,
  },
  unitName: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  unitMeta: {
    fontSize: 12,
    fontWeight: '500',
  },
  completionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: '100%',
    marginTop: 4,
  },
  completionBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  completionFill: {
    height: '100%',
    borderRadius: 2,
  },
  completionText: {
    fontSize: 10,
    fontWeight: '600',
  },
  // Submissions
  submissionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    marginBottom: 10,
  },
  subInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 15,
    fontWeight: '700',
  },
  taskName: {
    fontSize: 13,
    marginTop: 2,
  },
  gradeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  gradeText: {
    fontWeight: '800',
    fontSize: 14,
  },
  pendingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pendingText: {
    fontSize: 11,
    fontWeight: '700',
  },
  noActivity: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 16,
  },
  // Filters
  filterScroll: {
    marginBottom: 16,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  // Tasks
  emptyTasks: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  emptyTasksText: {
    fontSize: 14,
    textAlign: 'center',
  },
  taskCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 20,
    marginBottom: 10,
    alignItems: 'center',
  },
  taskIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  taskDeadline: {
    fontSize: 12,
    marginTop: 2,
  },
  taskBadges: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  reportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 18,
    borderWidth: 2,
    marginTop: 10,
  },
  reportBtnText: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
});
