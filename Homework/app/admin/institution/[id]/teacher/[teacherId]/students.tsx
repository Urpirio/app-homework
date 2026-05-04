import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import { ThemedView } from '@/components/shared/ThemedView';
import { useTeacherStudents } from '@/hooks/api/useUsers';
import { useTheme } from '@/hooks/useTheme';
import { deduplicateStudents } from '@/utils/gradingStats';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TeacherStudentsScreen() {
  const { id, teacherId } = useLocalSearchParams<{ id: string; teacherId: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const [search, setSearch] = useState('');

  const {
    data: studentsData,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
  } = useTeacherStudents(teacherId ?? '');

  const students = useMemo(() => {
    if (!studentsData?.pages) return [];
    const all = studentsData.pages.flatMap((page) => page.data);
    // Property 7: Ensure no duplicate student IDs
    return deduplicateStudents(all);
  }, [studentsData]);

  const filteredStudents = useMemo(() => {
    if (!search) return students;
    const q = search.toLowerCase();
    return students.filter(
      (s) =>
        s.fullName.toLowerCase().includes(q) ||
        s.classroomName.toLowerCase().includes(q)
    );
  }, [students, search]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ThemedView style={styles.container}>
        <BackgroundShapes />

        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Alumnos del Maestro</Text>
        </View>

        <View style={[styles.searchContainer, { backgroundColor: theme.colors.card }]}>
          <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
          <TextInput
            placeholder="Buscar por nombre o aula..."
            placeholderTextColor={theme.colors.textSecondary}
            style={[styles.searchInput, { color: theme.colors.text }]}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {isLoading ? (
          <SkeletonLoader rows={5} variant="list-item" />
        ) : error ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : (
          <FlatList
            data={filteredStudents}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            onEndReached={() => hasNextPage && fetchNextPage()}
            onEndReachedThreshold={0.5}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => router.push(`/admin/institution/${id}/student/${item.id}`)}
                style={({ pressed }) => [
                  styles.studentCard,
                  { backgroundColor: theme.colors.card, opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <View style={[styles.avatar, { backgroundColor: theme.colors.primary + '15' }]}>
                  <Text style={[styles.avatarText, { color: theme.colors.primary }]}>
                    {item.fullName.charAt(0)}
                  </Text>
                </View>
                <View style={styles.studentInfo}>
                  <Text style={[styles.studentName, { color: theme.colors.text }]}>{item.fullName}</Text>
                  <Text style={[styles.studentClass, { color: theme.colors.textSecondary }]}>
                    {item.classroomName} • {item.email}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.border} />
              </Pressable>
            )}
            ListEmptyComponent={
              <EmptyState
                icon="people-outline"
                title="Sin alumnos"
                message={search ? 'No se encontraron alumnos con ese criterio.' : 'Este maestro no tiene alumnos asignados.'}
              />
            }
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    paddingHorizontal: 15,
    height: 50,
    borderRadius: 15,
    marginBottom: 20,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16 },
  listContent: { paddingHorizontal: 20, paddingBottom: 20 },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 20,
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '700',
  },
  studentClass: {
    fontSize: 12,
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 50,
  },
});
