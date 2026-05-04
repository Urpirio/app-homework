import { HomeHeader } from '@/components/home/HomeHeader';
import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { ThemedView } from '@/components/shared/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import api from '@/utils/api';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const quickActions = [
  { id: '2', label: 'Notas', icon: 'stats-chart-outline' as const, color: '#34C759', route: '/grades' },
  { id: '3', label: 'Calendario', icon: 'calendar-outline' as const, color: '#FF9500', route: '/calendar' },
  { id: '4', label: 'Biblioteca', icon: 'library-outline' as const, color: '#007AFF', route: '/library' },
];

function getDaysLabel(dueDate: string): string {
  const diff = Math.ceil((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Mañana';
  return `${diff}d`;
}

function getDueBadgeColor(dueDate: string, theme: any): string {
  const diff = Math.ceil((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diff <= 1) return '#FF3B30';
  if (diff <= 3) return '#FF9500';
  return theme.colors.primaryLight;
}

export default function HomeScreen() {
  const { theme } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [upcomingTasks, setUpcomingTasks] = useState<any[]>([]);
  const [stats, setStats] = useState({ pending: 0, subjects: 0 });

  const fetchData = async () => {
    try {
      const profileRes = await api.get('/auth/profile');
      const profile = profileRes.data;
      setUser(profile);

      // Redirect SUPPORT role to their dashboard
      if (profile.role === 'SUPPORT') {
        router.replace('/support/dashboard');
        return;
      }

      const projectsRes = await api.get('/projects');
      const projects = projectsRes.data || [];

      setStats({
        pending: projects.reduce((acc: number, p: any) => acc + (p._count?.tasks || 0), 0),
        subjects: projects.length,
      });

      // Extract and flatten upcoming tasks — only pending, not overdue, with dueDate
      const now = new Date();
      const allTasks = projects.flatMap((p: any) =>
        (p.tasks || []).map((t: any) => ({
          ...t,
          subject: p.name,
          subjectColor: p.color,
        }))
      );

      const sorted = allTasks
        .filter((t: any) => {
          // Must have a due date
          if (!t.dueDate) return false;
          const due = new Date(t.dueDate);
          // Must not be completed by the backend status
          if (t.status === 'DONE') return false;
          // Must not already have a submission from this student
          if (t.submissions && t.submissions.length > 0) return false;
          // Must not be overdue
          return due > now;
        })
        .sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
        .slice(0, 5);

      setUpcomingTasks(sorted);
    } catch (error) {
      console.error('Error fetching home data:', error);
      setStats({ pending: 0, subjects: 0 });
    } finally {
      setLoading(false);
    }
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

            {upcomingTasks.length === 0 ? (
              <View style={[styles.taskCard, { backgroundColor: theme.colors.card }]}>
                <Ionicons name="checkmark-circle-outline" size={20} color="#34C759" style={{ marginRight: 10 }} />
                <Text style={[styles.taskSub, { color: theme.colors.textSecondary }]}>Sin tareas próximas. ¡Al día!</Text>
              </View>
            ) : upcomingTasks.map((task, index) => (
              <Animated.View key={task.id} entering={FadeInDown.delay(450 + index * 50)}>
                <Pressable
                  style={({ pressed }) => [
                    styles.taskCard, 
                    { backgroundColor: theme.colors.card, opacity: pressed ? 0.7 : 1 }
                  ]}
                  onPress={() => router.push(`/tasks/${task.id}`)}
                >
                  <View style={[styles.taskPriorityDot, { backgroundColor: theme.colors.primary + '40' }]} />
                  <View style={styles.taskInfo}>
                    <Text style={[styles.taskTitle, { color: theme.colors.text }]} numberOfLines={1}>{task.title}</Text>
                    <Text style={[styles.taskSub, { color: theme.colors.textSecondary }]}>
                      {task.subject} • Entrega: {new Date(task.dueDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                    </Text>
                  </View>
                  <View style={[styles.dueBadge, { backgroundColor: getDueBadgeColor(task.dueDate, theme) }]}>
                    <Text style={styles.dueBadgeText}>{getDaysLabel(task.dueDate)}</Text>
                  </View>
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
  dueBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    minWidth: 40,
    alignItems: 'center',
  },
  dueBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
  },
});
