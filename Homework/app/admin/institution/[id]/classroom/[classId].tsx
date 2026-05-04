import { CreateScheduleModal } from '@/components/calendar/CreateScheduleModal';
import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import { ThemedView } from '@/components/shared/ThemedView';
import { useClassroom, useClassroomSubjects } from '@/hooks/api/useClassrooms';
import { useDeleteSchedule, useSchedules } from '@/hooks/api/useSchedules';
import { useTheme } from '@/hooks/useTheme';
import type { Schedule } from '@/types/schedule';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
    FlatList,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

type TabKey = 'subjects' | 'students' | 'schedule';

const TABS: { key: TabKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'subjects', label: 'Materias', icon: 'journal-outline' },
  { key: 'students', label: 'Estudiantes', icon: 'people-outline' },
  { key: 'schedule', label: 'Horario', icon: 'calendar-outline' },
];

const DAYS_ORDER = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export default function ClassroomDetailScreen() {
  const { id, classId } = useLocalSearchParams<{ id: string; classId: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<TabKey>('subjects');
  const [scheduleModalVisible, setScheduleModalVisible] = useState(false);

  const {
    data: classroom,
    isLoading: loadingClassroom,
    isError: classroomError,
    error: classroomErr,
    refetch: refetchClassroom,
  } = useClassroom(classId);

  const {
    data: subjects,
    isLoading: loadingSubjects,
    isError: subjectsError,
    error: subjectsErr,
    refetch: refetchSubjects,
  } = useClassroomSubjects(classId);

  const {
    data: allSchedules,
    isLoading: loadingSchedules,
  } = useSchedules();

  const deleteSchedule = useDeleteSchedule();

  // Filter schedules for subjects in this classroom
  const classroomSchedules = useMemo(() => {
    if (!allSchedules || !subjects) return [];
    const subjectIds = new Set(subjects.map((s) => s.id));
    return allSchedules.filter((s) => subjectIds.has(s.projectId));
  }, [allSchedules, subjects]);

  // Group schedules by day for the weekly grid
  const schedulesByDay = useMemo(() => {
    const grouped: Record<string, Schedule[]> = {};
    for (const day of DAYS_ORDER) {
      grouped[day] = [];
    }
    for (const schedule of classroomSchedules) {
      const dayKey = DAYS_ORDER.find(
        (d) => d.toLowerCase() === schedule.day.toLowerCase().trim()
      );
      if (dayKey) {
        grouped[dayKey].push(schedule);
      }
    }
    // Sort each day's schedules by start time
    for (const day of DAYS_ORDER) {
      grouped[day].sort((a, b) => a.startTime.localeCompare(b.startTime));
    }
    return grouped;
  }, [classroomSchedules]);

  const handleDeleteSchedule = async (scheduleId: string) => {
    try {
      await deleteSchedule.mutateAsync(scheduleId);
      Toast.show({ type: 'success', text1: 'Horario eliminado' });
    } catch {
      Toast.show({ type: 'error', text1: 'Error', text2: 'No se pudo eliminar el horario' });
    }
  };

  if (loadingClassroom) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <ThemedView style={styles.container}>
          <SkeletonLoader rows={4} variant="detail" />
        </ThemedView>
      </SafeAreaView>
    );
  }

  if (classroomError) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <ThemedView style={styles.container}>
          <ErrorState error={classroomErr} onRetry={() => refetchClassroom()} onBack={() => router.back()} />
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ThemedView style={styles.container}>
        <BackgroundShapes />

        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Volver">
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: theme.colors.text }]}>{classroom?.name}</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              {classroom?.description || 'Sin descripción'}
            </Text>
          </View>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
            <Ionicons name="people" size={20} color="#007AFF" />
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {classroom?._count?.students ?? 0}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Estudiantes</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
            <Ionicons name="journal" size={20} color="#FF9500" />
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {subjects?.length ?? 0}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Materias</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
            <Ionicons name="calendar" size={20} color="#34C759" />
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {classroomSchedules.length}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Horarios</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabBar}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={[
                  styles.tab,
                  isActive && { borderBottomColor: theme.colors.primary, borderBottomWidth: 2 },
                ]}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={tab.label}
              >
                <Ionicons
                  name={tab.icon}
                  size={18}
                  color={isActive ? theme.colors.primary : theme.colors.textSecondary}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    { color: isActive ? theme.colors.primary : theme.colors.textSecondary },
                  ]}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Tab content */}
        <View style={styles.tabContent}>
          {activeTab === 'subjects' && (
            <SubjectsTab
              subjects={subjects ?? []}
              loading={loadingSubjects}
              error={subjectsError ? subjectsErr : null}
              onRetry={() => refetchSubjects()}
              onAddSubject={() =>
                router.push(`/admin/institution/${id}/classroom/${classId}/add-subject`)
              }
              onSubjectPress={(subjectId: string) =>
                router.push(`/admin/institution/${id}/classroom/${classId}/subject/${subjectId}`)
              }
            />
          )}
          {activeTab === 'students' && (
            <StudentsTab studentCount={classroom?._count?.students ?? 0} />
          )}
          {activeTab === 'schedule' && (
            <ScheduleTab
              schedulesByDay={schedulesByDay}
              loading={loadingSchedules}
              onAddSchedule={() => setScheduleModalVisible(true)}
              onDeleteSchedule={handleDeleteSchedule}
            />
          )}
        </View>

        <CreateScheduleModal
          visible={scheduleModalVisible}
          onClose={() => setScheduleModalVisible(false)}
          subjects={subjects?.map((s) => ({ id: s.id, name: s.name })) ?? []}
          institutionId={id}
        />
      </ThemedView>
    </SafeAreaView>
  );
}

/* ─── Subjects Tab ─── */

interface SubjectsTabProps {
  subjects: any[];
  loading: boolean;
  error: any;
  onRetry: () => void;
  onAddSubject: () => void;
  onSubjectPress: (id: string) => void;
}

function SubjectsTab({ subjects, loading, error, onRetry, onAddSubject, onSubjectPress }: SubjectsTabProps) {
  const { theme } = useTheme();

  if (loading) return <SkeletonLoader rows={3} variant="list-item" />;
  if (error) return <ErrorState error={error} onRetry={onRetry} />;

  return (
    <>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Materias Asignadas</Text>
        <Pressable
          onPress={onAddSubject}
          style={[styles.addBtn, { backgroundColor: theme.colors.primary }]}
          accessibilityRole="button"
          accessibilityLabel="Añadir materia"
        >
          <Ionicons name="add" size={20} color="#FFF" />
          <Text style={styles.addBtnText}>Añadir</Text>
        </Pressable>
      </View>

      {subjects.length === 0 ? (
        <EmptyState
          icon="journal-outline"
          title="No hay materias"
          message="Añade la primera materia a esta aula"
          actionLabel="Añadir Materia"
          onAction={onAddSubject}
        />
      ) : (
        <FlatList
          data={subjects}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <SubjectItem subject={item} onPress={() => onSubjectPress(item.id)} />
          )}
        />
      )}
    </>
  );
}

function SubjectItem({ subject, onPress }: { subject: any; onPress: () => void }) {
  const { theme } = useTheme();

  const getGradeColor = (grade?: number) => {
    if (grade == null) return theme.colors.textSecondary;
    if (grade >= 9) return '#34C759';
    if (grade >= 7) return '#FF9500';
    return '#FF3B30';
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.subjectCard,
        { backgroundColor: theme.colors.card, opacity: pressed ? 0.7 : 1 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Materia ${subject.name}`}
    >
      <View style={[styles.subjectIcon, { backgroundColor: theme.colors.primaryLight }]}>
        <Ionicons name="journal" size={24} color={theme.colors.primary} />
      </View>
      <View style={styles.subjectInfo}>
        <Text style={[styles.subjectName, { color: theme.colors.text }]}>{subject.name}</Text>
        <View style={styles.subjectMeta}>
          {subject.taskCount != null && (
            <Text style={[styles.subjectDetail, { color: theme.colors.textSecondary }]}>
              {subject.taskCount} tareas
            </Text>
          )}
          {subject.studentCount != null && (
            <Text style={[styles.subjectDetail, { color: theme.colors.textSecondary }]}>
              · {subject.studentCount} alumnos
            </Text>
          )}
        </View>
      </View>
      {subject.avgGrade != null && (
        <View style={[styles.gradeBadge, { backgroundColor: getGradeColor(subject.avgGrade) + '15' }]}>
          <Text style={[styles.gradeText, { color: getGradeColor(subject.avgGrade) }]}>
            {Number(subject.avgGrade).toFixed(1)}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

/* ─── Students Tab ─── */

function StudentsTab({ studentCount }: { studentCount: number }) {
  const { theme } = useTheme();

  return (
    <View style={styles.studentsPlaceholder}>
      <Ionicons name="people" size={48} color={theme.colors.textSecondary} />
      <Text style={[styles.studentsCount, { color: theme.colors.text }]}>
        {studentCount} {studentCount === 1 ? 'Estudiante' : 'Estudiantes'}
      </Text>
      <Text style={[styles.studentsHint, { color: theme.colors.textSecondary }]}>
        Gestiona estudiantes desde la pantalla de inscripción
      </Text>
    </View>
  );
}

/* ─── Schedule Tab ─── */

interface ScheduleTabProps {
  schedulesByDay: Record<string, Schedule[]>;
  loading: boolean;
  onAddSchedule: () => void;
  onDeleteSchedule: (id: string) => void;
}

function ScheduleTab({ schedulesByDay, loading, onAddSchedule, onDeleteSchedule }: ScheduleTabProps) {
  const { theme } = useTheme();

  if (loading) return <SkeletonLoader rows={4} variant="list-item" />;

  const hasAnySchedule = DAYS_ORDER.some((day) => schedulesByDay[day]?.length > 0);

  return (
    <>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Horario Semanal</Text>
        <Pressable
          onPress={onAddSchedule}
          style={[styles.addBtn, { backgroundColor: theme.colors.primary }]}
          accessibilityRole="button"
          accessibilityLabel="Agregar horario"
        >
          <Ionicons name="add" size={20} color="#FFF" />
          <Text style={styles.addBtnText}>Agregar</Text>
        </Pressable>
      </View>

      {!hasAnySchedule ? (
        <EmptyState
          icon="calendar-outline"
          title="Sin horarios"
          message="Agrega horarios de clase para esta aula"
          actionLabel="Agregar Horario"
          onAction={onAddSchedule}
        />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {DAYS_ORDER.map((day) => {
            const daySchedules = schedulesByDay[day] ?? [];
            if (daySchedules.length === 0) return null;

            return (
              <View key={day} style={styles.daySection}>
                <Text style={[styles.dayLabel, { color: theme.colors.text }]}>{day}</Text>
                {daySchedules.map((schedule) => (
                  <View
                    key={schedule.id}
                    style={[styles.scheduleEntry, { backgroundColor: theme.colors.card }]}
                  >
                    <View style={[styles.scheduleTimeBar, { backgroundColor: schedule.project?.color ?? theme.colors.primary }]} />
                    <View style={styles.scheduleContent}>
                      <Text style={[styles.scheduleName, { color: theme.colors.text }]}>
                        {schedule.project?.name ?? 'Materia'}
                      </Text>
                      <Text style={[styles.scheduleTime, { color: theme.colors.textSecondary }]}>
                        {schedule.startTime} – {schedule.endTime}
                        {schedule.room ? ` · ${schedule.room}` : ''}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => onDeleteSchedule(schedule.id)}
                      style={styles.deleteBtn}
                      accessibilityRole="button"
                      accessibilityLabel={`Eliminar horario de ${schedule.project?.name ?? 'materia'}`}
                    >
                      <Ionicons name="trash-outline" size={18} color="#FF3B30" />
                    </Pressable>
                  </View>
                ))}
              </View>
            );
          })}
        </ScrollView>
      )}
    </>
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
  headerText: { marginLeft: 10, flex: 1 },
  title: { fontSize: 22, fontWeight: '800' },
  subtitle: { fontSize: 14, opacity: 0.7 },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 16,
    gap: 4,
  },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 11, fontWeight: '600' },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  tabLabel: { fontSize: 13, fontWeight: '700' },
  tabContent: { flex: 1, padding: 20 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  addBtnText: { color: '#FFF', fontWeight: '700', marginLeft: 4, fontSize: 14 },
  subjectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 24,
    marginBottom: 12,
  },
  subjectIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  subjectInfo: { flex: 1 },
  subjectName: { fontSize: 16, fontWeight: '700' },
  subjectMeta: { flexDirection: 'row', marginTop: 2, gap: 4 },
  subjectDetail: { fontSize: 13 },
  gradeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  gradeText: { fontSize: 15, fontWeight: '800' },
  studentsPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingTop: 40,
  },
  studentsCount: { fontSize: 22, fontWeight: '800' },
  studentsHint: { fontSize: 14, textAlign: 'center' },
  daySection: { marginBottom: 20 },
  dayLabel: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  scheduleEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    marginBottom: 8,
    overflow: 'hidden',
  },
  scheduleTimeBar: {
    width: 4,
    alignSelf: 'stretch',
  },
  scheduleContent: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  scheduleName: { fontSize: 15, fontWeight: '700' },
  scheduleTime: { fontSize: 13, marginTop: 2 },
  deleteBtn: {
    padding: 12,
  },
});
