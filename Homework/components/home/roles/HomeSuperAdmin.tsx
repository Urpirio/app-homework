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
  { id: '1', label: 'Instituciones', icon: 'business-outline' as const, color: '#FF3B30', route: '/admin/institutions' },
  { id: '2', label: 'Usuarios', icon: 'people-outline' as const, color: '#007AFF', route: '/admin/users' },
  { id: '3', label: 'Analytics', icon: 'bar-chart-outline' as const, color: '#FF9500', route: '/admin/analytics' },
];

export function HomeSuperAdmin({ user }: { user: any }) {
  const { theme } = useTheme();
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const { data } = await api.get('/institutions');
          const list: any[] = data || [];
          setInstitutions(list.slice(0, 5));
          const total = list.reduce(
            (acc, inst) => acc + (inst._count?.users ?? inst.studentsCount ?? 0),
            0
          );
          setTotalUsers(total);
        } catch {
          setInstitutions([]);
        }
      })();
    }, [])
  );

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
      <HomeHeader user={user} />

      <Animated.View entering={FadeInDown.delay(100)}>
        <View style={[s.bannerCard, { backgroundColor: '#FF3B30' }]}>
          <View style={s.bannerContent}>
            <Text style={s.bannerGreeting}>{getGreeting()}, {user?.fullName?.split(' ')[0]}</Text>
            <Text style={s.bannerSubtitle}>
              {institutions.length} instituciones · {totalUsers} usuarios registrados
            </Text>
          </View>
          <View style={s.bannerBadge}>
            <Text style={s.badgeNumber}>{institutions.length}</Text>
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
          <Text style={[s.sectionTitle, { color: theme.colors.text }]}>Instituciones</Text>
          <Pressable onPress={() => router.push('/admin/institutions' as any)}>
            <Text style={{ color: '#FF3B30', fontWeight: '700', fontSize: 13 }}>Ver todas</Text>
          </Pressable>
        </View>

        {institutions.length === 0 ? (
          <View style={[s.listCard, { backgroundColor: theme.colors.card }]}>
            <Ionicons name="business-outline" size={20} color={theme.colors.textSecondary} style={{ marginRight: 10 }} />
            <Text style={[s.listSub, { color: theme.colors.textSecondary }]}>No hay instituciones registradas</Text>
          </View>
        ) : (
          institutions.map((inst: any, i: number) => (
            <Animated.View key={inst.id} entering={FadeInDown.delay(450 + i * 50)}>
              <Pressable
                style={({ pressed }) => [s.listCard, { backgroundColor: theme.colors.card, opacity: pressed ? 0.7 : 1 }]}
                onPress={() => router.push(`/admin/institution/${inst.id}` as any)}
              >
                <View style={[s.dot, { backgroundColor: '#FF3B3040' }]} />
                <View style={s.listInfo}>
                  <Text style={[s.listTitle, { color: theme.colors.text }]} numberOfLines={1}>{inst.name}</Text>
                  <Text style={[s.listSub, { color: theme.colors.textSecondary }]}>
                    {inst._count?.users ?? inst.studentsCount ?? 0} usuarios · {inst._count?.classrooms ?? inst.classroomsCount ?? 0} aulas
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
              </Pressable>
            </Animated.View>
          ))
        )}
      </Animated.View>
    </ScrollView>
  );
}
