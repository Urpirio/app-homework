import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import { ThemedView } from '@/components/shared/ThemedView';
import { useSubjectTasks } from '@/hooks/api/useProjects';
import { useTheme } from '@/hooks/useTheme';
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

type StatusFilter = 'all' | 'TODO' | 'IN_PROGRESS' | 'DONE';

const STATUS_LABELS: Record<StatusFilter, string> = {
  all: 'Todos',
  TODO: 'Pendiente',
  IN_PROGRESS: 'En Progreso',
  DONE: 'Completada',
};

export default function TaskListScreen() {
  const { id, classId, subjectId } = useLocalSearchParams<{
    id: string;
    classId: string;
    subjectId: string;
  }>();
  const router = useRouter();
  const { theme } = useTheme();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const {
    data: tasksData,
    isLoading,
    isError,
    error,
    refetch,
  } = useSubjectTasks(subjectId);

  const tasks = useMemo(() => {
    if (!tasksData) return [];
    const list = Array.isArray(tasksData) ? tasksData : tasksData.data ?? [];
    if (statusFilter === 'all') return list;
    return list.filter((t: any) => t.status === statusFilter);
  }, [tasksData, statusFilter]);

  const renderTask = ({ item }: { item: any }) => {
    const submissions = item.submissions ?? item._count?.submissions ?? 0;
    const total = item.total ?? item.studentCount ?? 0;
    const progressPct = total > 0 ? (submissions / total) * 100 : 0;

    return (
      <Pressable
        onPress={() =>
          router.push(
            `/admin/institution/${id}/classroom/${classId}/subject/${subjectId}/task/${item.id}`
          )
        }
        style={({ pressed }) => [
          styles.taskCard,
          { backgroundColor: theme.colors.card, opacity: pressed ? 0.7 : 1 },
        ]}
      >
        <View style={[styles.taskIcon, { backgroundColor: theme.colors.primaryLight }]}>
          <Ionicons name="clipboard" size={24} color={theme.colors.primary} />
        </View>
        <View style={styles.taskInfo}>
          <Text style={[styles.taskTitle, { color: theme.colors.text }]}>{item.title}</Text>
          {item.dueDate && (
            <Text style={[styles.taskDeadline, { color: theme.colors.textSecondary }]}>
              Fecha límite: {new Date(item.dueDate).toLocaleDateString()}
            </Text>
          )}
          {total > 0 && (
            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { backgroundColor: theme.colors.border + '30' }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: theme.colors.primary,
                      width: `${Math.min(progressPct, 100)}%`,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.progressText, { color: theme.colors.textSecondary }]}>
                {submissions}/{total} entregas
              </Text>
            </View>
          )}
          {item.status && (
            <View style={styles.badgeRow}>
              <StatusBadge status={item.status} theme={theme} />
              {item.type && <TypeBadge type={item.type} theme={theme} />}
            </View>
          )}
        </View>
        <Ionicons name="chevron-forward" size={20} color={theme.colors.border} />
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ThemedView style={styles.container}>
        <BackgroundShapes />

        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </Pressable>
          <Text style={[styles.title, { color: theme.colors.text }]}>Listado de Tareas</Text>
        </View>

        {/* Status filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContent}
        >
          {(Object.keys(STATUS_LABELS) as StatusFilter[]).map((f) => {
            const active = statusFilter === f;
            return (
              <Pressable
                key={f}
                onPress={() => setStatusFilter(f)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: active ? theme.colors.primary : theme.colors.card,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: active ? '#FFF' : theme.colors.text },
                  ]}
                >
                  {STATUS_LABELS[f]}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {isLoading ? (
          <SkeletonLoader rows={5} variant="list-item" style={styles.listContent} />
        ) : isError ? (
          <ErrorState
            error={error ?? new Error('Error al cargar las tareas')}
            onRetry={() => refetch()}
            onBack={() => router.back()}
          />
        ) : tasks.length === 0 ? (
          <EmptyState
            icon="clipboard-outline"
            title="Sin tareas"
            message={
              statusFilter === 'all'
                ? 'Esta materia aún no tiene tareas asignadas.'
                : `No hay tareas con estado "${STATUS_LABELS[statusFilter]}".`
            }
          />
        ) : (
          <FlatList
            data={tasks}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={renderTask}
          />
        )}
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
  title: {
    fontSize: 20,
    fontWeight: '800',
    marginLeft: 10,
  },
  filterScroll: {
    maxHeight: 50,
  },
  filterContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  listContent: {
    padding: 20,
  },
  taskCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 24,
    marginBottom: 16,
    alignItems: 'center',
  },
  taskIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  taskDeadline: {
    fontSize: 12,
    marginTop: 2,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 10,
  },
  progressBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '600',
    minWidth: 70,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
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
});
