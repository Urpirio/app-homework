import { HomeHeader } from '@/components/home/HomeHeader';
import { useTheme } from '@/hooks/useTheme';
import api from '@/utils/api';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { sharedStyles as s, getGreeting } from './shared';

const quickActions = [
  { id: '1', label: 'Dashboard', icon: 'grid-outline' as const, color: '#5856D6', route: '/teacher/dashboard' },
  { id: '2', label: 'Materias', icon: 'journal-outline' as const, color: '#34C759', route: '/projects' },
  { id: '3', label: 'Calendario', icon: 'calendar-outline' as const, color: '#FF9500', route: '/calendar' },
];

export function HomeTeacher({ user }: { user: any }) {
  const { theme } = useTheme();
  const [pendingSubmissions, setPendingSubmissions] = useState<any[]>([]);
  const [stats, setStats] = useState({ pending: 0, subjects: 0 });

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const { data: projects } = await api.get('/projects');
          const all: any[] = projects || [];
          const submissions: any[] = [];
          for (const p of all) {
            for (const t of p.tasks || []) {
              for (const sub of t.submissions || []) {
                if (sub.status === 'SUBMITTED') {
                  submissions.push({ ...sub, taskTitle: t.title, taskId: t.id, subject: p.name, subjectColor: p.color });
                }
              }
            }
          }
          submissions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setStats({ pending: submissions.length, subjects: all.length });
          setPendingSubmissions(submissions.slice(0, 5));
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
        <View style={[s.bannerCard, { backgroundColor: '#5856D6' }]}>
          <View style={s.bannerContent}>
            <Text style={s.bannerGreeting}>{getGreeting()}, {user?.fullName?.split(' ')[0]}</Text>
            <Text style={s.bannerSubtitle}>
              {stats.subjects} materias activas · {stats.pending} entregas por calificar
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
          <Text style={[s.sectionTitle, { color: theme.colors.text }]}>Entregas por Calificar</Text>
          <Pressable onPress={() => router.push('/projects')}>
            <Text style={{ color: '#5856D6', fontWeight: '700', fontSize: 13 }}>Ver materias</Text>
          </Pressable>
        </View>

        {pendingSubmissions.length === 0 ? (
          <View style={[s.listCard, { backgroundColor: theme.colors.card }]}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#34C759" style={{ marginRight: 10 }} />
            <Text style={[s.listSub, { color: theme.colors.textSecondary }]}>Sin entregas pendientes de calificar</Text>
          </View>
        ) : (
          pendingSubmissions.map((sub: any, i: number) => (
            <Animated.View key={sub.id} entering={FadeInDown.delay(450 + i * 50)}>
              <Pressable
                style={({ pressed }) => [s.listCard, { backgroundColor: theme.colors.card, opacity: pressed ? 0.7 : 1 }]}
                onPress={() => router.push({ pathname: '/tasks/[taskId]/submissions', params: { taskId: sub.taskId } } as any)}
              >
                <View style={[s.dot, { backgroundColor: '#FF950040' }]} />
                <View style={s.listInfo}>
                  <Text style={[s.listTitle, { color: theme.colors.text }]} numberOfLines={1}>
                    {sub.student?.fullName ?? 'Estudiante'}
                  </Text>
                  <Text style={[s.listSub, { color: theme.colors.textSecondary }]}>
                    {sub.taskTitle} · {sub.subject}
                  </Text>
                </View>
                <View style={[s.badge, { backgroundColor: '#FF9500' }]}>
                  <Text style={s.badgeText}>Calificar</Text>
                </View>
              </Pressable>
            </Animated.View>
          ))
        )}
      </Animated.View>
    </ScrollView>
  );
}
