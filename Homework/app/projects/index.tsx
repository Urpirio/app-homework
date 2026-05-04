import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import { ThemedView } from '@/components/shared/ThemedView';
import { useProjects } from '@/hooks/api/useProjects';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const getGradeColor = (grade: number) => {
  if (grade >= 9) return '#34C759';
  if (grade >= 7) return '#FF9500';
  return '#FF3B30';
};

export default function SubjectsScreen() {
  const { theme } = useTheme();
  const { data: subjects, isLoading, isError, error, refetch } = useProjects();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ThemedView style={styles.container}>
        <BackgroundShapes />
        
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Mis Materias</Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>Ciclo Escolar 2026 - Activo</Text>
        </View>

        {isLoading ? (
          <SkeletonLoader rows={5} variant="list-item" style={styles.listContent} />
        ) : isError ? (
          <ErrorState
            error={error}
            onRetry={() => refetch()}
            style={styles.stateContainer}
          />
        ) : !subjects || subjects.length === 0 ? (
          <EmptyState
            icon="school-outline"
            title="Sin materias"
            message="No tienes materias asignadas en este momento. Contacta a tu institución para más información."
            style={styles.stateContainer}
          />
        ) : (
          <FlatList
            data={subjects}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item, index }) => (
              <Animated.View entering={FadeInDown.delay(index * 100)}>
                <Pressable 
                  onPress={() => router.push(`/projects/${item.id}`)}
                  style={({ pressed }) => [
                    styles.subjectCard, 
                    { backgroundColor: theme.colors.card, opacity: pressed ? 0.8 : 1 }
                  ]}
                >
                  <View style={[styles.iconBox, { backgroundColor: (item.color || theme.colors.primary) + '15' }]}>
                    <Ionicons name="journal" size={24} color={item.color || theme.colors.primary} />
                  </View>
                  
                  <View style={styles.subjectInfo}>
                    <Text style={[styles.subjectName, { color: theme.colors.text }]}>{item.name}</Text>
                    <Text style={[styles.teacherName, { color: theme.colors.textSecondary }]}>
                      {item.tasksCount} tareas · {item.completedTasks} completadas
                    </Text>
                  </View>

                  <View style={styles.progressContainer}>
                    <Text style={[styles.progressText, { color: theme.colors.textSecondary }]}>
                      {item.progress}%
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={theme.colors.border} style={{ marginLeft: 10 }} />
                </Pressable>
              </Animated.View>
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
  header: { paddingHorizontal: 25, paddingVertical: 20 },
  headerTitle: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 14, fontWeight: '600' },
  listContent: { paddingHorizontal: 25, paddingBottom: 40 },
  stateContainer: { flex: 1, paddingHorizontal: 25 },
  subjectCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 16, 
    borderRadius: 24, 
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'transparent'
  },
  iconBox: { 
    width: 52, 
    height: 52, 
    borderRadius: 18, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginRight: 16
  },
  subjectInfo: { flex: 1 },
  subjectName: { fontSize: 16, fontWeight: '800', marginBottom: 2 },
  teacherName: { fontSize: 13, fontWeight: '600' },
  progressContainer: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 45,
    alignItems: 'center',
  },
  progressText: { fontSize: 14, fontWeight: '800' },
});
