/**
 * Teacher Dashboard — Sub-screen accessible from Home quick action.
 * Shows: subjects overview, pending submissions, upcoming deadlines.
 * All data comes from GET /projects (already working).
 */

import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { EmptyState } from '@/components/shared/EmptyState';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import { ThemedView } from '@/components/shared/ThemedView';
import { useProjects } from '@/hooks/api/useProjects';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TeacherDashboard() {
  const { theme } = useTheme();
  const { data: projects, isLoading, refetch } = useProjects();

  const subjects = projects ?? [];

  // Collect all pending submissions across subjects
  const pendingSubmissions = useMemo(() => {
    const subs: any[] = [];
    for (const p of subjects) {
      const raw = p as any;
      for (const t of (raw.tasks ?? [])) {
        for (const s of (t.submissions ?? [])) {
          if (s.status === 'SUBMITTED') {
            subs.push({ ...s, taskTitle: t.title, taskId: t.id, subject: raw.name });
          }
        }
      }
    }
    return subs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [subjects]);

  // Upcoming deadlines
  const deadlines = useMemo(() => {
    const now = new Date();
    const all: any[] = [];
    for (const p of subjects) {
      const raw = p as any;
      for (const t of (raw.tasks ?? [])) {
        if (t.dueDate && new Date(t.dueDate) > now && t.status !== 'DONE') {
          all.push({ ...t, subject: raw.name, projectId: raw.id });
        }
      }
    }
    return all.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).slice(0, 8);
  }, [subjects]);

  const totalStudents = useMemo(() => {
    const ids = new Set<string>();
    for (const p of subjects) {
      for (const m of ((p as any).members ?? [])) {
        if (m.role === 'student') ids.add(m.userId);
      }
    }
    return ids.size;
  }, [subjects]);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <ThemedView style={styles.container}>
          <BackgroundShapes />
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
            </Pressable>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Dashboard</Text>
            <View style={{ width: 40 }} />
          </View>
          <SkeletonLoader rows={5} variant="card" style={{ padding: 20 }} />
        </ThemedView>
      </SafeAreaView>
    );
  }


  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ThemedView style={styles.container}>
        <BackgroundShapes />

        {/* Header — simple back + title */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Dashboard</Text>
          <Pressable onPress={() => refetch()} style={styles.backBtn}>
            <Ionicons name="refresh-outline" size={22} color={theme.colors.primary} />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* Stats */}
          <Animated.View entering={FadeInDown.duration(400)} style={styles.statsRow}>
            <View style={[styles.stat, { backgroundColor: theme.colors.card }]}>
              <Ionicons name="journal-outline" size={20} color="#5856D6" />
              <Text style={[styles.statValue, { color: theme.colors.text }]}>{subjects.length}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Materias</Text>
            </View>
            <View style={[styles.stat, { backgroundColor: theme.colors.card }]}>
              <Ionicons name="people-outline" size={20} color="#007AFF" />
              <Text style={[styles.statValue, { color: theme.colors.text }]}>{totalStudents}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Estudiantes</Text>
            </View>
            <View style={[styles.stat, { backgroundColor: theme.colors.card }]}>
              <Ionicons name="document-text-outline" size={20} color="#FF9500" />
              <Text style={[styles.statValue, { color: theme.colors.text }]}>{pendingSubmissions.length}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Por calificar</Text>
            </View>
          </Animated.View>

          {/* Subjects */}
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Mis Materias</Text>
          {subjects.length === 0 ? (
            <EmptyState icon="book-outline" title="Sin materias" message="No tienes materias asignadas." />
          ) : (
            <FlatList
              data={subjects}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ gap: 10, paddingRight: 20, marginBottom: 20 }}
              renderItem={({ item, index }) => (
                <Animated.View entering={FadeInDown.delay(index * 60)}>
                  <Pressable
                    onPress={() => router.push(`/projects/${item.id}` as any)}
                    style={({ pressed }) => [styles.subjectCard, { backgroundColor: theme.colors.card, opacity: pressed ? 0.7 : 1 }]}
                  >
                    <View style={[styles.subjectDot, { backgroundColor: item.color || theme.colors.primary }]} />
                    <Text style={[styles.subjectName, { color: theme.colors.text }]} numberOfLines={1}>{item.name}</Text>
                    <Text style={[styles.subjectMeta, { color: theme.colors.textSecondary }]}>
                      {item.tasksCount} tareas · {item.progress}%
                    </Text>
                  </Pressable>
                </Animated.View>
              )}
            />
          )}

          {/* Pending Submissions */}
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Entregas por Calificar</Text>
          {pendingSubmissions.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: theme.colors.card }]}>
              <Ionicons name="checkmark-circle-outline" size={28} color="#34C759" />
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>Todo calificado</Text>
            </View>
          ) : (
            pendingSubmissions.slice(0, 10).map((sub: any, index: number) => (
              <Animated.View key={sub.id} entering={FadeInDown.delay(index * 40)}>
                <Pressable
                  onPress={() => router.push({ pathname: '/tasks/[taskId]/submissions', params: { taskId: sub.taskId } } as any)}
                  style={({ pressed }) => [styles.subRow, { backgroundColor: theme.colors.card, opacity: pressed ? 0.7 : 1 }]}
                >
                  <View style={[styles.subAvatar, { backgroundColor: '#FF950018' }]}>
                    <Ionicons name="person-outline" size={16} color="#FF9500" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.subName, { color: theme.colors.text }]} numberOfLines={1}>
                      {sub.student?.fullName ?? 'Estudiante'}
                    </Text>
                    <Text style={[styles.subTask, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                      {sub.taskTitle} · {sub.subject}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={theme.colors.border} />
                </Pressable>
              </Animated.View>
            ))
          )}

          {/* Upcoming Deadlines */}
          <Text style={[styles.sectionTitle, { color: theme.colors.text, marginTop: 16 }]}>Próximas Fechas Límite</Text>
          {deadlines.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: theme.colors.card }]}>
              <Ionicons name="calendar-outline" size={28} color={theme.colors.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>Sin fechas próximas</Text>
            </View>
          ) : (
            deadlines.map((task: any, index: number) => {
              const diff = Math.ceil((new Date(task.dueDate).getTime() - Date.now()) / 86400000);
              const dateLabel = diff === 0 ? 'Hoy' : diff === 1 ? 'Mañana' : `${diff}d`;
              const urgent = diff <= 2;
              return (
                <Animated.View key={task.id} entering={FadeInDown.delay(index * 40)}>
                  <Pressable
                    onPress={() => router.push(`/tasks/${task.id}` as any)}
                    style={({ pressed }) => [styles.subRow, { backgroundColor: theme.colors.card, opacity: pressed ? 0.7 : 1 }]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.subName, { color: theme.colors.text }]} numberOfLines={1}>{task.title}</Text>
                      <Text style={[styles.subTask, { color: theme.colors.textSecondary }]}>{task.subject}</Text>
                    </View>
                    <View style={[styles.dateBadge, { backgroundColor: urgent ? '#FF3B3020' : theme.colors.primaryLight }]}>
                      <Text style={[styles.dateBadgeText, { color: urgent ? '#FF3B30' : theme.colors.primary }]}>{dateLabel}</Text>
                    </View>
                  </Pressable>
                </Animated.View>
              );
            })
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '900' },
  scroll: { paddingHorizontal: 20 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  stat: { flex: 1, padding: 14, borderRadius: 18, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 20, fontWeight: '900' },
  statLabel: { fontSize: 10, fontWeight: '700' },
  sectionTitle: { fontSize: 18, fontWeight: '900', marginBottom: 12 },
  subjectCard: { width: 160, padding: 14, borderRadius: 18 },
  subjectDot: { width: 8, height: 8, borderRadius: 4, marginBottom: 8 },
  subjectName: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  subjectMeta: { fontSize: 11, fontWeight: '600' },
  emptyCard: { padding: 24, borderRadius: 18, alignItems: 'center', gap: 8, marginBottom: 16 },
  emptyText: { fontSize: 13, fontWeight: '600' },
  subRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 16, marginBottom: 8, gap: 12 },
  subAvatar: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  subName: { fontSize: 14, fontWeight: '700' },
  subTask: { fontSize: 12, marginTop: 2 },
  dateBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  dateBadgeText: { fontSize: 12, fontWeight: '800' },
});
