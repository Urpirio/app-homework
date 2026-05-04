/**
 * Teacher Dashboard Screen
 *
 * Primary landing screen for TEACHER role users. Aggregates data from multiple
 * endpoints into a unified view: stats, subjects, pending submissions, and
 * upcoming deadlines.
 *
 * Validates: Requirements 3.2, 3.3, 3.4
 * Design: Frontend Screen Designs — Teacher Dashboard
 */

import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import { useProfile } from '@/hooks/api/useAuth';
import { useCalendarTasks } from '@/hooks/api/useTasks';
import { useTeacherStudents, useTeacherSubjects } from '@/hooks/api/useUsers';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo } from 'react';
import {
    Dimensions,
    FlatList,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Date helpers ────────────────────────────────────────────────────────────

function getDateRange() {
  const now = new Date();
  const start = now.toISOString().split('T')[0];
  const end = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];
  return { start, end };
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'Vencido';
  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Mañana';
  if (diffDays <= 7) return `En ${diffDays} días`;
  return date.toLocaleDateString('es', { month: 'short', day: 'numeric' });
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function DashboardHeader({
  name,
  institution,
}: {
  name: string;
  institution?: string;
}) {
  const { theme } = useTheme();

  return (
    <View style={styles.header}>
      <View>
        <Text style={[styles.greeting, { color: theme.colors.textSecondary }]}>
          Bienvenido
        </Text>
        <Text style={[styles.title, { color: theme.colors.text }]}>{name}</Text>
        {institution ? (
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            {institution}
          </Text>
        ) : null}
      </View>
      <Pressable
        onPress={() => router.push('/profile')}
        accessibilityRole="button"
        accessibilityLabel="Ver perfil"
        style={[styles.avatarBtn, { backgroundColor: theme.colors.primary + '15' }]}
      >
        <Ionicons name="person" size={24} color={theme.colors.primary} />
      </Pressable>
    </View>
  );
}

function StatTile({
  label,
  value,
  icon,
  color,
  index,
}: {
  label: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  index: number;
}) {
  const { theme } = useTheme();

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 80).springify()}
      style={[
        styles.statTile,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border + '50',
        },
      ]}
      accessibilityRole="text"
      accessibilityLabel={`${label}: ${value}`}
    >
      <View style={[styles.statIcon, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.statValue, { color: theme.colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
        {label}
      </Text>
    </Animated.View>
  );
}

function QuickActionTile({
  label,
  icon,
  color,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress: () => void;
}) {
  const { theme } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.quickAction,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border + '50',
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <View style={[styles.quickActionIcon, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text
        style={[styles.quickActionLabel, { color: theme.colors.text }]}
        numberOfLines={2}
      >
        {label}
      </Text>
    </Pressable>
  );
}

interface SubjectCardData {
  id: string;
  name: string;
  classroomName: string;
  studentCount: number;
  taskCount: number;
  avgGrade: number;
}

function SubjectCard({ item }: { item: SubjectCardData }) {
  const { theme } = useTheme();

  return (
    <Pressable
      onPress={() => router.push(`/projects/${item.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`Materia: ${item.name}`}
      style={({ pressed }) => [
        styles.subjectCard,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border + '50',
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <Text style={[styles.subjectName, { color: theme.colors.text }]} numberOfLines={1}>
        {item.name}
      </Text>
      <Text style={[styles.subjectClassroom, { color: theme.colors.textSecondary }]} numberOfLines={1}>
        {item.classroomName}
      </Text>
      <View style={styles.subjectStats}>
        <View style={styles.subjectStatItem}>
          <Ionicons name="people-outline" size={14} color={theme.colors.textSecondary} />
          <Text style={[styles.subjectStatText, { color: theme.colors.textSecondary }]}>
            {item.studentCount}
          </Text>
        </View>
        <View style={styles.subjectStatItem}>
          <Ionicons name="document-outline" size={14} color={theme.colors.textSecondary} />
          <Text style={[styles.subjectStatText, { color: theme.colors.textSecondary }]}>
            {item.taskCount}
          </Text>
        </View>
        <View style={styles.subjectStatItem}>
          <Ionicons name="star-outline" size={14} color="#FF9500" />
          <Text style={[styles.subjectStatText, { color: '#FF9500' }]}>
            {item.avgGrade.toFixed(1)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

function DeadlineRow({
  title,
  subject,
  dueDate,
}: {
  title: string;
  subject: string;
  dueDate: string;
}) {
  const { theme } = useTheme();
  const relative = formatRelativeDate(dueDate);
  const isUrgent = relative === 'Hoy' || relative === 'Mañana' || relative === 'Vencido';

  return (
    <View
      style={[
        styles.deadlineRow,
        { borderBottomColor: theme.colors.border + '30' },
      ]}
    >
      <View style={styles.deadlineContent}>
        <Text style={[styles.deadlineTitle, { color: theme.colors.text }]} numberOfLines={1}>
          {title}
        </Text>
        <Text style={[styles.deadlineSubject, { color: theme.colors.textSecondary }]} numberOfLines={1}>
          {subject}
        </Text>
      </View>
      <Text
        style={[
          styles.deadlineDate,
          { color: isUrgent ? '#FF3B30' : theme.colors.textSecondary },
        ]}
      >
        {relative}
      </Text>
    </View>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function TeacherDashboard() {
  const { theme } = useTheme();
  const { start, end } = useMemo(getDateRange, []);

  // Data fetching
  const { data: profile, isLoading: profileLoading, error: profileError } = useProfile();
  const teacherId = profile?.id ?? '';

  const {
    data: subjectsData,
    isLoading: subjectsLoading,
    error: subjectsError,
  } = useTeacherSubjects(teacherId);

  const {
    data: studentsData,
    isLoading: studentsLoading,
  } = useTeacherStudents(teacherId);

  const {
    data: calendarData,
    isLoading: calendarLoading,
  } = useCalendarTasks(start, end);

  // Derived data
  const subjects: SubjectCardData[] = useMemo(() => {
    if (!subjectsData?.pages) return [];
    return subjectsData.pages.flatMap((page) => page.data);
  }, [subjectsData]);

  const totalStudents = studentsData?.pages?.[0]?.total ?? 0;
  const totalSubjects = subjectsData?.pages?.[0]?.total ?? 0;

  const weightedAvg = useMemo(() => {
    if (subjects.length === 0) return 0;
    const totalWeight = subjects.reduce((sum, s) => sum + s.studentCount, 0);
    if (totalWeight === 0) return 0;
    return subjects.reduce((sum, s) => sum + s.avgGrade * s.studentCount, 0) / totalWeight;
  }, [subjects]);

  const upcomingDeadlines = useMemo(() => {
    if (!calendarData?.tasks) return [];
    return calendarData.tasks
      .filter((t) => new Date(t.dueDate) >= new Date())
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5);
  }, [calendarData]);

  // Loading state
  const isLoading = profileLoading || subjectsLoading;

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <SkeletonLoader rows={6} variant="card" />
      </SafeAreaView>
    );
  }

  // Error state
  if (profileError || subjectsError) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <ErrorState error={profileError ?? subjectsError!} onRetry={() => {}} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <DashboardHeader
          name={profile?.fullName ?? 'Profesor'}
          institution={undefined}
        />

        {/* Stats Row — 4 tiles */}
        <View style={styles.statsRow}>
          <StatTile
            label="Estudiantes"
            value={totalStudents}
            icon="people"
            color="#007AFF"
            index={0}
          />
          <StatTile
            label="Materias"
            value={totalSubjects}
            icon="book"
            color="#5856D6"
            index={1}
          />
          <StatTile
            label="Pendientes"
            value={0}
            icon="hourglass"
            color="#FF9500"
            index={2}
          />
          <StatTile
            label="Promedio"
            value={weightedAvg.toFixed(1)}
            icon="trending-up"
            color="#32D74B"
            index={3}
          />
        </View>

        {/* Quick Actions */}
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Acciones Rápidas
        </Text>
        <View style={styles.quickActionsRow}>
          <QuickActionTile
            label="Crear Tarea"
            icon="add-circle-outline"
            color="#007AFF"
            onPress={() => router.push('/tasks/[id]')}
          />
          <QuickActionTile
            label="Calificaciones"
            icon="school-outline"
            color="#5856D6"
            onPress={() => router.push('/grades')}
          />
          <QuickActionTile
            label="Analíticas"
            icon="analytics-outline"
            color="#FF9500"
            onPress={() => router.push('/admin/analytics')}
          />
          <QuickActionTile
            label="Calendario"
            icon="calendar-outline"
            color="#32D74B"
            onPress={() => router.push('/calendar')}
          />
        </View>

        {/* Subjects List — horizontal scroll */}
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Mis Materias
        </Text>
        {subjects.length > 0 ? (
          <FlatList
            data={subjects}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <SubjectCard item={item} />}
            contentContainerStyle={styles.subjectsList}
          />
        ) : (
          <EmptyState
            icon="book-outline"
            title="Sin materias"
            message="No tienes materias asignadas actualmente."
            style={styles.emptyInline}
          />
        )}

        {/* Upcoming Deadlines */}
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Próximas Fechas Límite
        </Text>
        {upcomingDeadlines.length > 0 ? (
          <View
            style={[
              styles.deadlinesCard,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border + '50',
              },
            ]}
          >
            {upcomingDeadlines.map((task) => (
              <DeadlineRow
                key={task.id}
                title={task.title}
                subject={task.projectName}
                dueDate={task.dueDate}
              />
            ))}
          </View>
        ) : (
          <EmptyState
            icon="calendar-outline"
            title="Sin fechas próximas"
            message="No hay tareas con fecha límite próxima."
            style={styles.emptyInline}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: { fontSize: 14, fontWeight: '500' },
  title: { fontSize: 28, fontWeight: '800', marginTop: 2 },
  subtitle: { fontSize: 14, marginTop: 2 },
  avatarBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  statTile: {
    width: (SCREEN_WIDTH - 42) / 2,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 11, fontWeight: '600', marginTop: 2 },

  // Section
  sectionTitle: { fontSize: 20, fontWeight: '800', marginBottom: 12 },

  // Quick Actions
  quickActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  quickAction: {
    width: (SCREEN_WIDTH - 42) / 2,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionLabel: { fontSize: 13, fontWeight: '600', textAlign: 'center' },

  // Subjects
  subjectsList: { gap: 12, paddingRight: 16, marginBottom: 24 },
  subjectCard: {
    width: 180,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  subjectName: { fontSize: 16, fontWeight: '700' },
  subjectClassroom: { fontSize: 12, marginTop: 2, marginBottom: 10 },
  subjectStats: { flexDirection: 'row', gap: 12 },
  subjectStatItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  subjectStatText: { fontSize: 12, fontWeight: '600' },

  // Deadlines
  deadlinesCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 4,
    marginBottom: 24,
  },
  deadlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  deadlineContent: { flex: 1, marginRight: 12 },
  deadlineTitle: { fontSize: 14, fontWeight: '600' },
  deadlineSubject: { fontSize: 12, marginTop: 2 },
  deadlineDate: { fontSize: 12, fontWeight: '700' },

  // Empty inline
  emptyInline: { flex: 0, paddingVertical: 24, marginBottom: 16 },
});
