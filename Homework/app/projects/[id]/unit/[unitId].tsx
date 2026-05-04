import { TaskItem } from '@/components/home/TaskItem';
import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import { ThemedView } from '@/components/shared/ThemedView';
import { useUnitTasksFromProject } from '@/hooks/api/useProjects';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function UnitTasksScreen() {
  const { id, unitId, unitName } = useLocalSearchParams();
  const { theme } = useTheme();

  const projectId = typeof id === 'string' ? id : Array.isArray(id) ? id[0] : '';
  const unitIdStr = typeof unitId === 'string' ? unitId : Array.isArray(unitId) ? unitId[0] : '';

  // Track focus count to force FlatList re-render after refetch
  const [focusCount, setFocusCount] = useState(0);
  const isMounted = useRef(false);

  const {
    data: tasks,
    isLoading,
    isError,
    error,
    refetch,
  } = useUnitTasksFromProject(projectId, unitIdStr);

  // Refetch when returning from task detail (e.g. after submitting)
  useFocusEffect(
    useCallback(() => {
      if (isMounted.current) {
        // Only refetch on subsequent focuses (not the initial mount)
        refetch().then(() => setFocusCount(c => c + 1));
      } else {
        isMounted.current = true;
      }
    }, [refetch])
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <ThemedView style={styles.container}>
          <BackgroundShapes />
          <View style={{ flex: 1, paddingHorizontal: 20 }}>
            <View style={styles.header}>
              <Pressable onPress={() => router.back()} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
              </Pressable>
              <View style={styles.headerText}>
                <Text style={[styles.title, { color: theme.colors.text }]}>Tareas de la Unidad</Text>
                <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>{unitName || 'Unidad'}</Text>
              </View>
            </View>
            <SkeletonLoader rows={5} variant="list-item" />
          </View>
        </ThemedView>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <ThemedView style={styles.container}>
          <BackgroundShapes />
          <View style={{ flex: 1, paddingHorizontal: 20 }}>
            <View style={styles.header}>
              <Pressable onPress={() => router.back()} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
              </Pressable>
              <View style={styles.headerText}>
                <Text style={[styles.title, { color: theme.colors.text }]}>Tareas de la Unidad</Text>
                <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>{unitName || 'Unidad'}</Text>
              </View>
            </View>
            <ErrorState
              error={error}
              onRetry={() => refetch()}
              onBack={() => router.back()}
            />
          </View>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ThemedView style={styles.container}>
        <BackgroundShapes />

        <View style={{ flex: 1, paddingHorizontal: 20 }}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
            </Pressable>
            <View style={styles.headerText}>
              <Text style={[styles.title, { color: theme.colors.text }]}>Tareas de la Unidad</Text>
              <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>{unitName || 'Unidad'}</Text>
            </View>
          </View>

          <FlatList
            key={focusCount}
            data={tasks ?? []}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40, flexGrow: 1 }}
            renderItem={({ item, index }) => (
              <TaskItem
                task={item}
                index={index}
                onPress={() => router.push(`/tasks/${item.id}`)}
              />
            )}
            ListEmptyComponent={
              <EmptyState
                icon="document-text-outline"
                title="Sin tareas"
                message="No hay tareas en esta unidad todavía."
              />
            }
          />
        </View>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingVertical: 20 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerText: { marginLeft: 12 },
  title: { fontSize: 20, fontWeight: '800' },
  subtitle: { fontSize: 13, fontWeight: '600' },
});
