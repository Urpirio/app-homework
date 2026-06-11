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
  { id: '1', label: 'Usuarios', icon: 'people-outline' as const, color: '#007AFF', route: '/admin/users' },
  { id: '2', label: 'Aulas', icon: 'school-outline' as const, color: '#34C759', route: '/admin/classrooms' },
  { id: '3', label: 'Analytics', icon: 'bar-chart-outline' as const, color: '#FF9500', route: '/admin/analytics' },
];

type InstitutionStats = {
  studentsCount: number;
  teachersCount: number;
  classroomsCount: number;
  averageGrade: number;
  attendanceRate: number;
};

export function HomeSchoolAdmin({ user }: { user: any }) {
  const { theme } = useTheme();
  const [stats, setStats] = useState<InstitutionStats | null>(null);
  const [kpis, setKpis] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      const institutionId = user?.institutionId;
      if (!institutionId) return;
      (async () => {
        try {
          const [statsRes, analyticsRes] = await Promise.all([
            api.get(`/institutions/${institutionId}/stats`),
            api.get(`/institutions/${institutionId}/analytics`),
          ]);
          setStats(statsRes.data);
          const analytics = analyticsRes.data;
          setKpis([
            { label: 'Nota media', value: analytics?.averageGrade?.toFixed(1) ?? '—', icon: 'school-outline', color: '#5856D6' },
            { label: 'Asistencia', value: analytics?.attendanceRate ? `${analytics.attendanceRate.toFixed(0)}%` : '—', icon: 'calendar-outline', color: '#34C759' },
            { label: 'Tareas entregadas', value: analytics?.submissionsCount ?? '—', icon: 'document-text-outline', color: '#FF9500' },
            { label: 'Libros prestados', value: analytics?.loansCount ?? '—', icon: 'library-outline', color: '#007AFF' },
          ]);
        } catch {
          setStats(null);
        }
      })();
    }, [user?.institutionId])
  );

  const totalUsers = (stats?.studentsCount ?? 0) + (stats?.teachersCount ?? 0);

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
      <HomeHeader user={user} />

      <Animated.View entering={FadeInDown.delay(100)}>
        <View style={[s.bannerCard, { backgroundColor: '#34C759' }]}>
          <View style={s.bannerContent}>
            <Text style={s.bannerGreeting}>{getGreeting()}, {user?.fullName?.split(' ')[0]}</Text>
            <Text style={s.bannerSubtitle}>
              {stats?.studentsCount ?? '—'} alumnos · {stats?.teachersCount ?? '—'} docentes · {stats?.classroomsCount ?? '—'} aulas
            </Text>
          </View>
          <View style={s.bannerBadge}>
            <Text style={s.badgeNumber}>{totalUsers}</Text>
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
          <Text style={[s.sectionTitle, { color: theme.colors.text }]}>Indicadores de la Institución</Text>
          <Pressable onPress={() => router.push('/admin/analytics' as any)}>
            <Text style={{ color: '#34C759', fontWeight: '700', fontSize: 13 }}>Ver más</Text>
          </Pressable>
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {kpis.map((kpi, i) => (
            <Animated.View key={kpi.label} entering={FadeInDown.delay(450 + i * 60)} style={{ width: '47%' }}>
              <View style={[s.listCard, { backgroundColor: theme.colors.card, flexDirection: 'column', alignItems: 'flex-start', gap: 6 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name={kpi.icon} size={18} color={kpi.color} />
                  <Text style={[s.listSub, { color: theme.colors.textSecondary }]}>{kpi.label}</Text>
                </View>
                <Text style={[s.sectionTitle, { color: theme.colors.text }]}>{kpi.value}</Text>
              </View>
            </Animated.View>
          ))}
        </View>
      </Animated.View>
    </ScrollView>
  );
}
