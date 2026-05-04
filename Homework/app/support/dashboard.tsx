/**
 * Support Staff Dashboard
 *
 * Dashboard for support staff with KPIs, ticket queue,
 * escalated tickets, and performance chart.
 *
 * Validates: Requirements 15.9, 15.10, 15.11
 */

import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { ErrorState, SkeletonLoader } from '@/components/shared';
import { ThemedView } from '@/components/shared/ThemedView';
import { useProfile } from '@/hooks/api/useAuth';
import { useTechnicianStats } from '@/hooks/api/useReviews';
import { useUserTickets } from '@/hooks/api/useTickets';
import { useTheme } from '@/hooks/useTheme';
import type { Ticket, TicketStatus } from '@/types/ticket';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import {
    Dimensions,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const STATUS_COLORS: Record<TicketStatus, string> = {
  OPEN: '#007AFF',
  IN_PROGRESS: '#FF9500',
  RESOLVED: '#34C759',
  CLOSED: '#8E8E93',
};

const STATUS_LABELS: Record<TicketStatus, string> = {
  OPEN: 'Abierto',
  IN_PROGRESS: 'En Progreso',
  RESOLVED: 'Resuelto',
  CLOSED: 'Cerrado',
};

const PRIORITY_COLORS: Record<string, string> = {
  Low: '#34C759',
  Medium: '#FF9500',
  High: '#FF3B30',
  Critical: '#AF52DE',
};

export default function SupportDashboardScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { data: profile } = useProfile();

  const {
    data: ticketsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useUserTickets(profile?.id ?? '');

  const { data: stats } = useTechnicianStats(profile?.id ?? '');

  const allTickets = useMemo(() => {
    if (!ticketsData?.pages) return [];
    return ticketsData.pages.flatMap((page) => page.data);
  }, [ticketsData]);

  // KPI calculations
  const kpis = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const resolvedToday = allTickets.filter((t) => {
      if (t.status !== 'RESOLVED' && t.status !== 'CLOSED') return false;
      const updated = new Date(t.updatedAt);
      updated.setHours(0, 0, 0, 0);
      return updated.getTime() === today.getTime();
    }).length;

    const queueLength = allTickets.filter(
      (t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS'
    ).length;

    // Avg response time: difference between createdAt and updatedAt for resolved tickets
    const resolvedTickets = allTickets.filter(
      (t) => t.status === 'RESOLVED' || t.status === 'CLOSED'
    );
    let avgResponseMinutes = 0;
    if (resolvedTickets.length > 0) {
      const totalMinutes = resolvedTickets.reduce((sum, t) => {
        const created = new Date(t.createdAt).getTime();
        const updated = new Date(t.updatedAt).getTime();
        return sum + (updated - created) / (1000 * 60);
      }, 0);
      avgResponseMinutes = Math.round(totalMinutes / resolvedTickets.length);
    }

    const satisfactionRating = stats?.averageRating ?? 0;

    return { resolvedToday, avgResponseMinutes, queueLength, satisfactionRating };
  }, [allTickets, stats]);

  // Ticket queue: open and in-progress, sorted by priority then date
  const ticketQueue = useMemo(() => {
    const priorityOrder: Record<string, number> = {
      Critical: 0,
      High: 1,
      Medium: 2,
      Low: 3,
    };
    return allTickets
      .filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS')
      .sort((a, b) => {
        const pa = priorityOrder[(a as any).priority] ?? 4;
        const pb = priorityOrder[(b as any).priority] ?? 4;
        if (pa !== pb) return pa - pb;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
  }, [allTickets]);

  // Escalated tickets: high/critical priority
  const escalatedTickets = useMemo(() => {
    return allTickets.filter((t) => {
      const priority = (t as any).priority;
      return (
        (t.status === 'OPEN' || t.status === 'IN_PROGRESS') &&
        (priority === 'High' || priority === 'Critical')
      );
    });
  }, [allTickets]);

  // Performance: tickets resolved per day (last 7 days)
  const performanceData = useMemo(() => {
    const days: { label: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      const count = allTickets.filter((t) => {
        if (t.status !== 'RESOLVED' && t.status !== 'CLOSED') return false;
        const updated = new Date(t.updatedAt).getTime();
        return updated >= date.getTime() && updated < nextDay.getTime();
      }).length;

      days.push({
        label: date.toLocaleDateString('es', { weekday: 'short' }),
        count,
      });
    }
    return days;
  }, [allTickets]);

  const maxPerformance = Math.max(...performanceData.map((d) => d.count), 1);

  const horizontalPadding = SCREEN_WIDTH > 400 ? 24 : 16;

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <ThemedView style={styles.container}>
          <BackgroundShapes />
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
              Panel de Soporte
            </Text>
          </View>
          <View style={{ padding: 20 }}>
            <SkeletonLoader rows={6} variant="card" />
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
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
              Panel de Soporte
            </Text>
          </View>
          <ErrorState error={error as any} onRetry={() => refetch()} />
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ThemedView style={styles.container}>
        <BackgroundShapes />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: horizontalPadding, paddingBottom: 40 }}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
                Panel de Soporte
              </Text>
              <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
                {profile?.fullName ?? 'Soporte'}
              </Text>
            </View>
            <Pressable
              onPress={() => router.push('/support/create-ticket' as any)}
              style={[styles.newTicketBtn, { backgroundColor: theme.colors.primary }]}
            >
              <Ionicons name="add" size={20} color="#FFF" />
            </Pressable>
          </View>

          {/* KPI Row */}
          <Animated.View entering={FadeInDown.duration(400)} style={styles.kpiRow}>
            <KPITile
              icon="checkmark-done"
              label="Resueltos Hoy"
              value={String(kpis.resolvedToday)}
              color="#34C759"
            />
            <KPITile
              icon="timer-outline"
              label="Tiempo Resp."
              value={kpis.avgResponseMinutes > 60
                ? `${Math.round(kpis.avgResponseMinutes / 60)}h`
                : `${kpis.avgResponseMinutes}m`}
              color="#FF9500"
            />
            <KPITile
              icon="layers-outline"
              label="En Cola"
              value={String(kpis.queueLength)}
              color="#007AFF"
            />
            <KPITile
              icon="star"
              label="Satisfacción"
              value={kpis.satisfactionRating > 0 ? kpis.satisfactionRating.toFixed(1) : '—'}
              color="#FFCC00"
            />
          </Animated.View>

          {/* Ticket Queue */}
          <Animated.View entering={FadeInDown.duration(400).delay(100)}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Cola de Tickets ({ticketQueue.length})
            </Text>
            {ticketQueue.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: theme.colors.card }]}>
                <Ionicons name="checkmark-circle-outline" size={32} color={theme.colors.textSecondary} />
                <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                  No hay tickets pendientes
                </Text>
              </View>
            ) : (
              ticketQueue.slice(0, 10).map((ticket) => (
                <TicketRow
                  key={ticket.id}
                  ticket={ticket}
                  onPress={() =>
                    router.push(`/admin/user/${profile?.id}/ticket/${ticket.id}` as any)
                  }
                />
              ))
            )}
          </Animated.View>

          {/* Escalated Tickets */}
          {escalatedTickets.length > 0 && (
            <Animated.View entering={FadeInDown.duration(400).delay(200)}>
              <Text style={[styles.sectionTitle, { color: '#FF3B30' }]}>
                <Ionicons name="warning" size={18} color="#FF3B30" /> Tickets Escalados (
                {escalatedTickets.length})
              </Text>
              {escalatedTickets.map((ticket) => (
                <TicketRow
                  key={ticket.id}
                  ticket={ticket}
                  escalated
                  onPress={() =>
                    router.push(`/admin/user/${profile?.id}/ticket/${ticket.id}` as any)
                  }
                />
              ))}
            </Animated.View>
          )}

          {/* Performance Chart */}
          <Animated.View entering={FadeInDown.duration(400).delay(300)}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Rendimiento (últimos 7 días)
            </Text>
            <View style={[styles.chartCard, { backgroundColor: theme.colors.card }]}>
              <View style={styles.chartBars}>
                {performanceData.map((day, i) => (
                  <View key={i} style={styles.chartBarCol}>
                    <View style={styles.chartBarWrapper}>
                      <View
                        style={[
                          styles.chartBar,
                          {
                            height: `${(day.count / maxPerformance) * 100}%`,
                            backgroundColor: theme.colors.primary,
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.chartLabel, { color: theme.colors.textSecondary }]}>
                      {day.label}
                    </Text>
                    <Text style={[styles.chartValue, { color: theme.colors.text }]}>
                      {day.count}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

function KPITile({
  icon,
  label,
  value,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  color: string;
}) {
  const { theme } = useTheme();
  return (
    <View style={[styles.kpiTile, { backgroundColor: theme.colors.card }]}>
      <View style={[styles.kpiIcon, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={[styles.kpiValue, { color: theme.colors.text }]}>{value}</Text>
      <Text style={[styles.kpiLabel, { color: theme.colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

function TicketRow({
  ticket,
  escalated,
  onPress,
}: {
  ticket: Ticket;
  escalated?: boolean;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  const statusColor = STATUS_COLORS[ticket.status];
  const priority = (ticket as any).priority as string | undefined;
  const priorityColor = priority ? PRIORITY_COLORS[priority] || '#8E8E93' : '#8E8E93';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.ticketRow,
        {
          backgroundColor: theme.colors.card,
          borderLeftColor: escalated ? '#FF3B30' : statusColor,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <View style={styles.ticketRowContent}>
        <View style={styles.ticketRowTop}>
          <Text style={[styles.ticketRowId, { color: theme.colors.textSecondary }]}>
            #{ticket.id.slice(0, 8).toUpperCase()}
          </Text>
          {priority && (
            <View style={[styles.priorityBadge, { backgroundColor: priorityColor + '15' }]}>
              <View style={[styles.priorityDot, { backgroundColor: priorityColor }]} />
              <Text style={[styles.priorityText, { color: priorityColor }]}>{priority}</Text>
            </View>
          )}
        </View>
        <Text style={[styles.ticketRowTitle, { color: theme.colors.text }]} numberOfLines={1}>
          {ticket.title}
        </Text>
        <View style={styles.ticketRowBottom}>
          <Text style={[styles.ticketRowCategory, { color: theme.colors.primary }]}>
            {ticket.category}
          </Text>
          <Text style={[styles.ticketRowDate, { color: theme.colors.textSecondary }]}>
            {new Date(ticket.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.colors.border} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
  },
  headerTitle: { fontSize: 24, fontWeight: '800' },
  headerSubtitle: { fontSize: 14, fontWeight: '600', marginTop: 2 },
  newTicketBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  kpiTile: {
    flex: 1,
    padding: 14,
    borderRadius: 20,
    alignItems: 'center',
  },
  kpiIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  kpiValue: { fontSize: 20, fontWeight: '900' },
  kpiLabel: { fontSize: 10, fontWeight: '700', marginTop: 4, textAlign: 'center' },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 14,
    marginTop: 8,
  },
  emptyCard: {
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  emptyText: { fontSize: 14, fontWeight: '600' },
  ticketRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    marginBottom: 10,
    borderLeftWidth: 4,
  },
  ticketRowContent: { flex: 1 },
  ticketRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  ticketRowId: { fontSize: 11, fontWeight: '700' },
  ticketRowTitle: { fontSize: 15, fontWeight: '700', marginBottom: 6 },
  ticketRowBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketRowCategory: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  ticketRowDate: { fontSize: 11 },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  priorityDot: { width: 6, height: 6, borderRadius: 3 },
  priorityText: { fontSize: 10, fontWeight: '800' },
  chartCard: {
    padding: 20,
    borderRadius: 24,
    marginBottom: 16,
  },
  chartBars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
  },
  chartBarCol: {
    flex: 1,
    alignItems: 'center',
  },
  chartBarWrapper: {
    width: 24,
    height: 80,
    justifyContent: 'flex-end',
  },
  chartBar: {
    width: '100%',
    borderRadius: 6,
    minHeight: 4,
  },
  chartLabel: { fontSize: 10, fontWeight: '700', marginTop: 6 },
  chartValue: { fontSize: 11, fontWeight: '800', marginTop: 2 },
});
