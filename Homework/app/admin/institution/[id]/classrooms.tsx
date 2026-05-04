import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import { ThemedView } from '@/components/shared/ThemedView';
import { useInstitutionClassrooms } from '@/hooks/api/useClassrooms';
import { useTheme } from '@/hooks/useTheme';
import type { Classroom } from '@/types/classroom';
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

export default function ClassroomListScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const [search, setSearch] = useState('');

  const {
    data: classrooms,
    isLoading,
    isError,
    error,
    refetch,
  } = useInstitutionClassrooms(id);

  const filteredClassrooms = useMemo(() => {
    if (!classrooms) return [];
    if (!search.trim()) return classrooms;
    const q = search.toLowerCase();
    return classrooms.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q)
    );
  }, [classrooms, search]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ThemedView style={styles.container}>
        <BackgroundShapes />

        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Volver">
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </Pressable>
          <Text style={[styles.title, { color: theme.colors.text }]}>Listado de Aulas</Text>
          <Pressable
            onPress={() => router.push(`/admin/institution/${id}/create-classroom`)}
            style={[styles.createBtn, { backgroundColor: theme.colors.primary }]}
            accessibilityRole="button"
            accessibilityLabel="Crear aula"
          >
            <Ionicons name="add" size={20} color="#FFF" />
          </Pressable>
        </View>

        <View style={[styles.searchContainer, { backgroundColor: theme.colors.card }]}>
          <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
          <TextInput
            placeholder="Buscar aula..."
            placeholderTextColor={theme.colors.textSecondary}
            style={[styles.searchInput, { color: theme.colors.text }]}
            value={search}
            onChangeText={setSearch}
            accessibilityLabel="Buscar aula"
          />
        </View>

        {isLoading ? (
          <SkeletonLoader rows={5} variant="list-item" style={styles.skeletonContainer} />
        ) : isError ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : filteredClassrooms.length === 0 ? (
          <EmptyState
            icon="book-outline"
            title="No se encontraron aulas"
            message={search ? 'Intenta con otro término de búsqueda' : 'Crea la primera aula para esta institución'}
            actionLabel={!search ? 'Crear Aula' : undefined}
            onAction={!search ? () => router.push(`/admin/institution/${id}/create-classroom`) : undefined}
          />
        ) : (
          <FlatList
            data={filteredClassrooms}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <ClassroomCard
                classroom={item}
                onPress={() => router.push(`/admin/institution/${id}/classroom/${item.id}`)}
              />
            )}
          />
        )}
      </ThemedView>
    </SafeAreaView>
  );
}

function ClassroomCard({ classroom, onPress }: { classroom: Classroom; onPress: () => void }) {
  const { theme } = useTheme();
  const studentCount = classroom._count?.students ?? 0;
  const subjectCount = classroom._count?.projects ?? 0;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.classroomCard,
        { backgroundColor: theme.colors.card, opacity: pressed ? 0.7 : 1 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Aula ${classroom.name}`}
    >
      <View style={[styles.avatar, { backgroundColor: '#FF9500' + '20' }]}>
        <Ionicons name="book" size={24} color="#FF9500" />
      </View>
      <View style={styles.info}>
        <Text style={[styles.name, { color: theme.colors.text }]}>{classroom.name}</Text>
        <Text style={[styles.description, { color: theme.colors.textSecondary }]} numberOfLines={1}>
          {classroom.description || 'Sin descripción'}
        </Text>
        <View style={styles.countsRow}>
          <View style={styles.countBadge}>
            <Ionicons name="people-outline" size={14} color={theme.colors.textSecondary} />
            <Text style={[styles.countText, { color: theme.colors.textSecondary }]}>
              {studentCount} {studentCount === 1 ? 'estudiante' : 'estudiantes'}
            </Text>
          </View>
          <View style={styles.countBadge}>
            <Ionicons name="journal-outline" size={14} color={theme.colors.textSecondary} />
            <Text style={[styles.countText, { color: theme.colors.textSecondary }]}>
              {subjectCount} {subjectCount === 1 ? 'materia' : 'materias'}
            </Text>
          </View>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={theme.colors.border} />
    </Pressable>
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
  title: { fontSize: 20, fontWeight: '800', marginLeft: 10, flex: 1 },
  createBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
  skeletonContainer: { paddingHorizontal: 20 },
  listContent: { paddingHorizontal: 20, paddingBottom: 20 },
  classroomCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700' },
  description: { fontSize: 13, marginTop: 2 },
  countsRow: {
    flexDirection: 'row',
    marginTop: 6,
    gap: 12,
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  countText: { fontSize: 12, fontWeight: '500' },
});
