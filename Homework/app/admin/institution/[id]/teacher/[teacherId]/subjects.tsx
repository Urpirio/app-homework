import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import { ThemedView } from '@/components/shared/ThemedView';
import { useTeacherSubjects } from '@/hooks/api/useUsers';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import {
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TeacherSubjectsScreen() {
  const { id, teacherId } = useLocalSearchParams<{ id: string; teacherId: string }>();
  const router = useRouter();
  const { theme } = useTheme();

  const {
    data: subjectsData,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
  } = useTeacherSubjects(teacherId ?? '');

  const subjects = useMemo(() => {
    if (!subjectsData?.pages) return [];
    return subjectsData.pages.flatMap((page) => page.data);
  }, [subjectsData]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ThemedView style={styles.container}>
        <BackgroundShapes />

        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Materias Asignadas</Text>
        </View>

        {isLoading ? (
          <SkeletonLoader rows={5} variant="list-item" />
        ) : error ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : subjects.length === 0 ? (
          <EmptyState
            icon="book-outline"
            title="Sin materias"
            message="Este maestro no tiene materias asignadas."
          />
        ) : (
          <FlatList
            data={subjects}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            onEndReached={() => hasNextPage && fetchNextPage()}
            onEndReachedThreshold={0.5}
            renderItem={({ item }) => (
              <Pressable
                onPress={() =>
                  router.push(
                    `/admin/institution/${id}/classroom/${item.classroomId}/subject/${item.id}`
                  )
                }
                style={({ pressed }) => [
                  styles.subjectCard,
                  { backgroundColor: theme.colors.card, opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <View style={[styles.subjectIcon, { backgroundColor: theme.colors.primary + '15' }]}>
                  <Ionicons name="journal" size={24} color={theme.colors.primary} />
                </View>
                <View style={styles.subjectInfo}>
                  <Text style={[styles.subjectName, { color: theme.colors.text }]}>{item.name}</Text>
                  <Text style={[styles.subjectDetail, { color: theme.colors.textSecondary }]}>
                    Aula: {item.classroomName} • {item.studentCount} Estudiantes
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.border} />
              </Pressable>
            )}
          />
        )}
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 10 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', marginLeft: 10 },
  listContent: { padding: 20 },
  subjectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
  },
  subjectIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  subjectInfo: {
    flex: 1,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '700',
  },
  subjectDetail: {
    fontSize: 13,
    marginTop: 2,
  },
});
