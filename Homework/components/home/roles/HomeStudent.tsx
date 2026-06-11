import { HomeHeader } from '@/components/home/HomeHeader';
import { useTheme } from '@/hooks/useTheme';
import api from '@/utils/api';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { sharedStyles as s, getDaysLabel, getDueBadgeColor, getGreeting } from './shared';

const quickActions = [
  { id: '1', label: 'Notas', icon: 'stats-chart-outline' as const, color: '#34C759', route: '/grades' },
  { id: '2', label: 'Calendario', icon: 'calendar-outline' as const, color: '#FF9500', route: '/calendar' },
  { id: '3', label: 'Biblioteca', icon: 'library-outline' as const, color: '#007AFF', route: '/library' },
];

export function HomeStudent({ user }: { user: any }) {
  const { theme } = useTheme();
  const [upcomingTasks, setUpcomingTasks] = useState<any[]>([]);
  const [stats, setStats] = useState({ pending: 0, subjects: 0 });

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const { data: projects } = await api.get('/projects');
          const all: any[] = (projects || []);
          setStats({
            pending: all.reduce((acc: number, p: any) => acc + (p._count?.tasks || 0), 0),
            subjects: all.length,
          });
          const now = new Date();
          const tasks = all
            .flatMap((p: any) => (p.tasks || []).map((t: any) => ({ ...t, subject: p.name, subjectColor: p.color })))
            .filter((t: any) => t.dueDate && t.status !== 'DONE' && !(t.submissions?.length > 0) && new Date(t.dueDate) > now)
            .sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
            .slice(0, 5);
          setUpcomingTasks(tasks);
        } catch {
          setStats({ pending: 0, subjects: 0 });
        }
      })();
    }, [])
  );

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
      <HomeHeader user={user} />

      <Animated.View entering={FadeInDown.delay(100)}>
        <View style={[s.bannerCard, { backgroundColor: theme.colors.primary }]}>
          <View style={s.bannerContent}>
            <Text style={s.bannerGreeting}>{getGreeting()}, {user?.fullName?.split(' ')[0]}</Text>
            <Text style={s.bannerSubtitle}>
              {stats.pending} tareas pendientes en {stats.subjects} materias activas
            </Text>
          </View>
          <View style={s.bannerBadge}>
            <Text style={s.badgeNumber}>{stats.pending}</Text>
          </View>
        </View>
      </Animated.View>

      <View style={s.quickGrid}>
        {quickActions.map((action, i) => (
          <Animated.View key={action.id} entering={FadeInRight.delay(200 + i * 50)} style={s.quickItem}>
            <Pressable
              onPress={() => router.push(action.route as any)}
              style={({ pressed }) => [s.quickCard, { backgroundColor: theme.colors.card, opacity: pressed ? 0.7 : 1 }]}
            >
              <Ionicons name={action.icon} size={22} color={action.color} />
              <Text style={[s.quickLabel, { color: theme.colors.text }]}>{action.label}</Text>
            </Pressable>
          </Animated.View>
        ))}
      </View>

      <Animated.View entering={FadeInDown.delay(400)} style={s.section}>
        <View style={s.sectionHeader}>
          <Text style={[s.sectionTitle, { color: theme.colors.text }]}>Tareas Próximas</Text>
          <Pressable onPress={() => router.push('/projects')}>
            <Text style={{ color: theme.colors.primary, fontWeight: '700', fontSize: 13 }}>Ver materias</Text>
          </Pressable>
        </View>

        {upcomingTasks.length === 0 ? (
          <View style={[s.listCard, { backgroundColor: theme.colors.card }]}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#34C759" style={{ marginRight: 10 }} />
            <Text style={[s.listSub, { color: theme.colors.textSecondary }]}>Sin tareas próximas. ¡Al día!</Text>
          </View>
        ) : (
          upcomingTasks.map((task: any, i: number) => (
            <Animated.View key={task.id} entering={FadeInDown.delay(450 + i * 50)}>
              <Pressable
                style={({ pressed }) => [s.listCard, { backgroundColor: theme.colors.card, opacity: pressed ? 0.7 : 1 }]}
                onPress={() => router.push(`/tasks/${task.id}`)}
              >
                <View style={[s.dot, { backgroundColor: theme.colors.primary + '40' }]} />
                <View style={s.listInfo}>
                  <Text style={[s.listTitle, { color: theme.colors.text }]} numberOfLines={1}>{task.title}</Text>
                  <Text style={[s.listSub, { color: theme.colors.textSecondary }]}>
                    {task.subject} · {new Date(task.dueDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                  </Text>
                </View>
                <View style={[s.badge, { backgroundColor: getDueBadgeColor(task.dueDate, theme) }]}>
                  <Text style={s.badgeText}>{getDaysLabel(task.dueDate)}</Text>
                </View>
              </Pressable>
            </Animated.View>
          ))
        )}
      </Animated.View>
    </ScrollView>
  );
}
