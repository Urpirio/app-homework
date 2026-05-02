import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { HomeHeader } from '@/components/home/HomeHeader';
import { ProjectCard } from '@/components/home/ProjectCard';
import { ThemedView } from '@/components/shared/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { Project } from '@/types/project';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router } from 'expo-router';
import { Pressable } from 'react-native';
import api from '@/utils/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MOCK_PROJECTS: Project[] = [
  {
    id: '1',
    name: 'Rediseño de App Móvil',
    description: 'Renovación completa de la UI/UX',
    progress: 75,
    tasksCount: 20,
    completedTasks: 15,
    lastAccessed: '2024-05-01',
    color: '#007AFF',
  },
  {
    id: '2',
    name: 'Dashboard Administrativo',
    description: 'Panel de control para gestión de datos',
    progress: 40,
    tasksCount: 10,
    completedTasks: 4,
    lastAccessed: '2024-04-30',
    color: '#5856D6',
  },
  {
    id: '3',
    name: 'Campaña de Marketing',
    description: 'Estrategia para el Q3',
    progress: 10,
    tasksCount: 15,
    completedTasks: 1,
    lastAccessed: '2024-04-28',
    color: '#FF9500',
  },
];

export default function HomeScreen() {
  const { theme } = useTheme();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects');
      const mappedProjects = response.data.map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description || '',
        progress: 0, 
        tasksCount: p._count?.tasks || 0,
        completedTasks: 0,
        lastAccessed: new Date(p.updatedAt).toLocaleDateString(),
        color: p.color || theme.colors.primary,
      }));
      setProjects(mappedProjects);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const horizontalPadding = SCREEN_WIDTH > 400 ? theme.spacing.xl : theme.spacing.md;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ThemedView style={styles.container}>
        <BackgroundShapes />
        
        <ScrollView 
          contentContainerStyle={{ paddingHorizontal: horizontalPadding }}
          showsVerticalScrollIndicator={false}
        >
          <HomeHeader />

          <Animated.View entering={FadeInDown.delay(300)} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Proyectos Recientes
              </Text>
              <Pressable onPress={() => router.push('/projects')}>
                <Text style={{ color: theme.colors.primary, fontWeight: '600' }}>Ver todos</Text>
              </Pressable>
            </View>

            {loading ? (
              <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 20 }} />
            ) : projects.length > 0 ? (
              projects.map((project, index) => (
                <ProjectCard key={project.id} project={project} index={index} />
              ))
            ) : (
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                No tienes proyectos todavía. ¡Crea uno nuevo!
              </Text>
            )}
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(600)} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Resumen de Tareas
            </Text>
            
            <View style={[styles.statsGrid]}>
              <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
                <Text style={[styles.statValue, { color: theme.colors.primary }]}>12</Text>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Pendientes</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
                <Text style={[styles.statValue, { color: theme.colors.success }]}>25</Text>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Completadas</Text>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  section: {
    marginTop: 24,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
  },
});
