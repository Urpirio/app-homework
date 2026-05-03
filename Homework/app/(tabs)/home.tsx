import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { HomeHeader } from '@/components/home/HomeHeader';
import { ThemedView } from '@/components/shared/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import React, { useState, useCallback } from 'react';
import { ScrollView, StyleSheet, Text, View, Dimensions, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '@/utils/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const quickActions = [
  { id: '2', label: 'Notas', icon: 'stats-chart-outline' as const, color: '#34C759', route: '/grades' },
  { id: '3', label: 'Calendario', icon: 'calendar-outline' as const, color: '#FF9500', route: '/calendar' },
  { id: '4', label: 'Biblioteca', icon: 'library-outline' as const, color: '#007AFF', route: '/library' },
];

export default function HomeScreen() {
  const { theme } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [upcomingTasks, setUpcomingTasks] = useState<any[]>([]);
  const [stats, setStats] = useState({ pending: 0, subjects: 0 });

  const fetchData = async () => {
    try {
      const profileRes = await api.get('/auth/profile');
      setUser(profileRes.data);

      const projectsRes = await api.get('/projects');
      const projects = projectsRes.data || [];

      setStats({
        pending: projects.reduce((acc: number, p: any) => acc + (p._count?.tasks || 0), 0),
        subjects: projects.length,
      });
    } catch (error) {
      console.error('Error fetching home data:', error);
      setStats({ pending: 3, subjects: 4 });
    } finally {
      setLoading(false);
    }

    setUpcomingTasks([
      { id: 't1', title: 'Ensayo de Historia Universal', subject: 'Historia', dueDate: 'Hoy, 11:59 PM', priority: 'urgent' },
      { id: 't2', title: 'Ejercicios Cap. 7 - Álgebra', subject: 'Matemáticas', dueDate: 'Mañana', priority: 'high' },
      { id: 't3', title: 'Lectura: El Quijote', subject: 'Lengua', dueDate: 'Vie, 10:00 AM', priority: 'normal' },
    ]);
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#FF3B30';
      case 'high': return '#FF9500';
      default: return '#34C759';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ThemedView style={styles.container}>
        <BackgroundShapes />
        
        <ScrollView 
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 30 }}
          showsVerticalScrollIndicator={false}
        >
          <HomeHeader user={user} />

          {/* Banner Consolidado */}
          <Animated.View entering={FadeInDown.delay(100)}>
            <View style={[styles.bannerCard, { backgroundColor: theme.colors.primary }]}>  
              <View style={styles.bannerContent}>
                <Text style={styles.bannerGreeting}>{getGreeting()}, {user?.fullName?.split(' ')[0]}</Text>
                <Text style={styles.bannerSubtitle}>
                  Tienes {stats.pending} tareas pendientes en {stats.subjects} materias activas.
                </Text>
              </View>
              <View style={styles.bannerBadge}>
                <Text style={styles.badgeNumber}>{stats.pending}</Text>
              </View>
            </View>
          </Animated.View>

          {/* Quick Actions - Más compactos */}
          <View style={styles.quickGrid}>
            {quickActions.map((action, index) => (
              <Animated.View key={action.id} entering={FadeInRight.delay(200 + index * 50)} style={styles.quickItem}>
                <Pressable 
                  onPress={() => router.push(action.route as any)}
                  style={({ pressed }) => [
                    styles.quickCard, 
                    { backgroundColor: theme.colors.card, opacity: pressed ? 0.7 : 1 }
                  ]}
                >
                  <Ionicons name={action.icon} size={22} color={action.color} />
                  <Text style={[styles.quickLabel, { color: theme.colors.text }]}>{action.label}</Text>
                </Pressable>
              </Animated.View>
            ))}
          </View>

          {/* Próximas Entregas - El foco principal */}
          <Animated.View entering={FadeInDown.delay(400)} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Tareas Próximas</Text>
              <Pressable onPress={() => router.push('/projects')}>
                <Text style={{ color: theme.colors.primary, fontWeight: '700', fontSize: 13 }}>Ver materias</Text>
              </Pressable>
            </View>

            {upcomingTasks.map((task, index) => (
              <Animated.View key={task.id} entering={FadeInDown.delay(450 + index * 50)}>
                <Pressable
                  style={({ pressed }) => [
                    styles.taskCard, 
                    { backgroundColor: theme.colors.card, opacity: pressed ? 0.7 : 1 }
                  ]}
                  onPress={() => router.push(`/tasks/${task.id}`)}
                >
                  <View style={[styles.taskPriorityDot, { backgroundColor: getPriorityColor(task.priority) }]} />
                  <View style={styles.taskInfo}>
                    <Text style={[styles.taskTitle, { color: theme.colors.text }]} numberOfLines={1}>{task.title}</Text>
                    <Text style={[styles.taskSub, { color: theme.colors.textSecondary }]}>{task.subject} • {task.dueDate}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={theme.colors.border} />
                </Pressable>
              </Animated.View>
            ))}
          </Animated.View>

        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  bannerCard: {
    borderRadius: 24,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  bannerContent: { flex: 1 },
  bannerGreeting: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 4,
  },
  bannerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '500',
  },
  bannerBadge: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 15,
  },
  badgeNumber: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '900',
  },

  quickGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  quickItem: { width: '31%' },
  quickCard: {
    alignItems: 'center',
    paddingVertical: 15,
    borderRadius: 20,
    gap: 8,
  },
  quickLabel: {
    fontSize: 10,
    fontWeight: '700',
  },

  section: { marginTop: 10 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
  },

  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    marginBottom: 10,
  },
  taskPriorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 15,
  },
  taskInfo: { flex: 1 },
  taskTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  taskSub: {
    fontSize: 11,
    fontWeight: '500',
  },
});
