import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { ErrorState, SkeletonLoader } from '@/components/shared';
import { ThemedView } from '@/components/shared/ThemedView';
import { useProfile } from '@/hooks/api/useAuth';
import { useTechnicianStats } from '@/hooks/api/useReviews';
import { useSelfAssignTicket, useTickets, useUpdateTicket } from '@/hooks/api/useTickets';
import { useTheme } from '@/hooks/useTheme';
import type { TicketStatus } from '@/types/ticket';
import { onNewMessage } from '@/utils/socket';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';


const STATUS_COLORS: Record<TicketStatus, string> = {
  OPEN: '#007AFF', IN_PROGRESS: '#FF9500', RESOLVED: '#34C759', CLOSED: '#8E8E93',
};
const STATUS_LABELS: Record<TicketStatus, string> = {
  OPEN: 'Abierto', IN_PROGRESS: 'En Proceso', RESOLVED: 'Resuelto', CLOSED: 'Cerrado',
};
const CATEGORY_LABELS: Record<string, string> = {
  Technical: 'Técnico', Academic: 'Académico', Account: 'Cuenta', General: 'General',
};

type TabType = 'queue' | 'unassigned' | 'resolved';
type FilterStatus = 'ALL' | TicketStatus;

export default function SupportDashboardScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { data: profile } = useProfile();
  const [activeTab, setActiveTab] = useState<TabType>('queue');
  const [search, setSearch] = useState('');
  const selfAssign = useSelfAssignTicket();
  const updateTicket = useUpdateTicket();
  const { data: stats } = useTechnicianStats(profile?.id ?? '');
  const { data: ticketsData, isLoading, isError, error, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useTickets();

  useFocusEffect(useCallback(() => { refetch(); }, [refetch]));

  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useFocusEffect(useCallback(() => {
    const handler = () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      refreshTimer.current = setTimeout(() => refetch(), 2000);
    };
    onNewMessage(handler);
    return () => { if (refreshTimer.current) clearTimeout(refreshTimer.current); };
  }, [refetch]));

  const allTickets = useMemo(() => {
    if (!ticketsData?.pages) return [];
    return ticketsData.pages.flatMap((p: any) => Array.isArray(p) ? p : (p.data ?? [])).filter((t: any) => t?.id);
  }, [ticketsData]);

  const kpis = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const resolvedToday = allTickets.filter((t: any) => {
      if (t.status !== 'RESOLVED' && t.status !== 'CLOSED') return false;
      const u = new Date(t.updatedAt); u.setHours(0, 0, 0, 0);
      return u.getTime() === today.getTime();
    }).length;
    const queueLength = allTickets.filter((t: any) => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length;
    const unassigned = allTickets.filter((t: any) => !t.assignedToId && t.status === 'OPEN').length;
    const resolved = allTickets.filter((t: any) => t.status === 'RESOLVED' || t.status === 'CLOSED');
    const avgMin = resolved.length > 0
      ? Math.round(resolved.reduce((s: number, t: any) => s + (new Date(t.updatedAt).getTime() - new Date(t.createdAt).getTime()) / 60000, 0) / resolved.length)
      : 0;
    return { resolvedToday, queueLength, unassigned, avgMin, satisfaction: stats?.averageRating ?? 0 };
  }, [allTickets, stats]);

  const filteredTickets = useMemo(() => {
    let base: any[] = activeTab === 'queue'
      ? allTickets.filter((t: any) => t.status === 'OPEN' || t.status === 'IN_PROGRESS')
      : activeTab === 'unassigned'
        ? allTickets.filter((t: any) => !t.assignedToId && t.status === 'OPEN')
        : allTickets.filter((t: any) => t.status === 'RESOLVED' || t.status === 'CLOSED');
    if (search.trim()) {
      const q = search.toLowerCase();
      base = base.filter((t: any) => t.title?.toLowerCase().includes(q) || t.id?.toLowerCase().includes(q));
    }
    return base;
  }, [allTickets, activeTab, search]);

  const handleSelfAssign = async (ticketId: string) => {
    try {
      await selfAssign.mutateAsync(ticketId);
      Toast.show({ type: 'success', text1: 'Ticket asignado', text2: 'El ticket fue asignado a ti.' });
    } catch { Toast.show({ type: 'error', text1: 'Error al asignar ticket' }); }
  };

  const handleQuickStatus = async (ticketId: string, status: string) => {
    try {
      await updateTicket.mutateAsync({ ticketId, payload: { status } });
      Toast.show({ type: 'success', text1: 'Estado actualizado' });
    } catch { Toast.show({ type: 'error', text1: 'Error al actualizar' }); }
  };

  const renderTicket = ({ item: ticket, index }: { item: any; index: number }) => {
    const isAssignedToMe = ticket.assignedToId === profile?.id;
    const isUnassigned = !ticket.assignedToId;
    const statusColor = STATUS_COLORS[ticket.status as TicketStatus] ?? '#8E8E93';
    return (
      <Animated.View entering={FadeInDown.delay(index * 40)}>
        <Pressable
          onPress={() => router.push(`/support/review/${ticket.id}` as any)}
          style={({ pressed }) => [styles.ticketCard, { backgroundColor: theme.colors.card, borderLeftColor: statusColor, opacity: pressed ? 0.8 : 1 }]}
        >
          <View style={styles.ticketTop}>
            <Text style={[styles.ticketId, { color: theme.colors.textSecondary }]}>#{ticket.id.slice(0, 8).toUpperCase()}</Text>
            <View style={[styles.statusPill, { backgroundColor: statusColor + '20' }]}>
              <Text style={[styles.statusPillText, { color: statusColor }]}>{STATUS_LABELS[ticket.status as TicketStatus] ?? ticket.status}</Text>
            </View>
          </View>
          <Text style={[styles.ticketTitle, { color: theme.colors.text }]} numberOfLines={2}>{ticket.title}</Text>
          <View style={styles.ticketMeta}>
            <View style={[styles.categoryPill, { backgroundColor: theme.colors.primaryLight }]}>
              <Text style={[styles.categoryText, { color: theme.colors.primary }]}>{CATEGORY_LABELS[ticket.category] ?? ticket.category}</Text>
            </View>
            <Text style={[styles.ticketDate, { color: theme.colors.textSecondary }]}>
              {new Date(ticket.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
            </Text>
          </View>
          {ticket.createdBy?.fullName && (
            <Text style={[styles.createdBy, { color: theme.colors.textSecondary }]}>De: {ticket.createdBy.fullName}</Text>
          )}
          <View style={styles.ticketActions}>
            {isUnassigned && (
              <Pressable onPress={() => handleSelfAssign(ticket.id)} style={[styles.actionBtn, { backgroundColor: theme.colors.primary }]}>
                <Ionicons name="person-add-outline" size={13} color="#FFF" />
                <Text style={styles.actionBtnText}>Asignarme</Text>
              </Pressable>
            )}
            {isAssignedToMe && ticket.status === 'OPEN' && (
              <Pressable onPress={() => handleQuickStatus(ticket.id, 'IN_PROGRESS')} style={[styles.actionBtn, { backgroundColor: '#FF9500' }]}>
                <Ionicons name="play-outline" size={13} color="#FFF" />
                <Text style={styles.actionBtnText}>Iniciar</Text>
              </Pressable>
            )}
            {isAssignedToMe && ticket.status === 'IN_PROGRESS' && (
              <Pressable onPress={() => handleQuickStatus(ticket.id, 'RESOLVED')} style={[styles.actionBtn, { backgroundColor: '#34C759' }]}>
                <Ionicons name="checkmark-outline" size={13} color="#FFF" />
                <Text style={styles.actionBtnText}>Resolver</Text>
              </Pressable>
            )}
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <ThemedView style={styles.container}>
          <BackgroundShapes />
          <View style={{ padding: 20 }}><SkeletonLoader rows={5} variant="card" /></View>
        </ThemedView>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <ThemedView style={styles.container}>
          <BackgroundShapes />
          <ErrorState error={error as any} onRetry={() => refetch()} />
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ThemedView style={styles.container}>
        <BackgroundShapes />

        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.push('/profile')} style={styles.avatarBtn}>
            <View style={[styles.avatarCircle, { backgroundColor: theme.colors.primaryLight }]}>
              <Text style={[styles.avatarInitial, { color: theme.colors.primary }]}>{profile?.fullName?.charAt(0) ?? 'S'}</Text>
            </View>
          </Pressable>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Panel de Soporte</Text>
            <Text style={[styles.headerSub, { color: theme.colors.textSecondary }]}>{profile?.fullName}</Text>
          </View>
          <Pressable onPress={() => refetch()} style={[styles.iconBtn, { backgroundColor: theme.colors.card }]}>
            <Ionicons name="refresh-outline" size={20} color={theme.colors.primary} />
          </Pressable>
        </View>

        {/* KPIs */}
        <View style={styles.kpiRow}>
          <KPITile icon="layers-outline" label="En cola" value={String(kpis.queueLength)} color="#007AFF" theme={theme} />
          <KPITile icon="alert-circle-outline" label="Sin asignar" value={String(kpis.unassigned)} color="#FF3B30" theme={theme} />
          <KPITile icon="checkmark-done" label="Resueltos hoy" value={String(kpis.resolvedToday)} color="#34C759" theme={theme} />
        </View>

        {/* Search */}
        <View style={styles.searchRow}>
          <View style={[styles.searchBox, { backgroundColor: theme.colors.card }]}>
            <Ionicons name="search-outline" size={16} color={theme.colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: theme.colors.text }]}
              placeholder="Buscar ticket..."
              placeholderTextColor={theme.colors.textSecondary}
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={16} color={theme.colors.textSecondary} />
              </Pressable>
            )}
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabRow}>
          {([
            { key: 'queue' as TabType, label: 'Cola', count: kpis.queueLength },
            { key: 'unassigned' as TabType, label: 'Sin asignar', count: kpis.unassigned },
            { key: 'resolved' as TabType, label: 'Resueltos', count: null },
          ]).map(tab => (
            <Pressable key={tab.key} onPress={() => setActiveTab(tab.key)} style={[styles.tab, activeTab === tab.key && { borderBottomColor: theme.colors.primary, borderBottomWidth: 2 }]}>
              <Text style={[styles.tabText, { color: activeTab === tab.key ? theme.colors.primary : theme.colors.textSecondary }]}>{tab.label}</Text>
              {tab.count !== null && tab.count > 0 && (
                <View style={[styles.tabBadge, { backgroundColor: tab.key === 'unassigned' ? '#FF3B30' : theme.colors.primary }]}>
                  <Text style={styles.tabBadgeText}>{tab.count}</Text>
                </View>
              )}
            </Pressable>
          ))}
        </View>

        {/* List */}
        <FlatList
          data={filteredTickets}
          keyExtractor={(item: any) => item.id}
          renderItem={renderTicket}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={() => hasNextPage && !isFetchingNextPage && fetchNextPage()}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="checkmark-circle-outline" size={40} color={theme.colors.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                {search ? 'Sin resultados' : 'No hay tickets aquí'}
              </Text>
            </View>
          }
          ListFooterComponent={isFetchingNextPage ? <ActivityIndicator color={theme.colors.primary} style={{ paddingVertical: 16 }} /> : null}
        />
      </ThemedView>
    </SafeAreaView>
  );
}

function KPITile({ icon, label, value, color, theme }: any) {
  return (
    <View style={[styles.kpiTile, { backgroundColor: theme.colors.card }]}>
      <View style={[styles.kpiIcon, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon} size={15} color={color} />
      </View>
      <Text style={[styles.kpiValue, { color: theme.colors.text }]}>{value}</Text>
      <Text style={[styles.kpiLabel, { color: theme.colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14 },
  headerTitle: { fontSize: 18, fontWeight: '900' },
  headerSub: { fontSize: 12, fontWeight: '600', marginTop: 1 },
  avatarBtn: {},
  avatarCircle: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { fontSize: 16, fontWeight: '900' },
  iconBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  kpiRow: { flexDirection: 'row', gap: 6, paddingHorizontal: 20, marginBottom: 12 },
  kpiTile: { flex: 1, padding: 10, borderRadius: 14, alignItems: 'center' },
  kpiIcon: { width: 28, height: 28, borderRadius: 9, justifyContent: 'center', alignItems: 'center', marginBottom: 5 },
  kpiValue: { fontSize: 15, fontWeight: '900' },
  kpiLabel: { fontSize: 9, fontWeight: '700', marginTop: 2, textAlign: 'center' },
  searchRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 8 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 14, gap: 8 },
  searchInput: { flex: 1, fontSize: 14 },
  tabRow: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 10, gap: 4 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, gap: 5 },
  tabText: { fontSize: 12, fontWeight: '700' },
  tabBadge: { width: 17, height: 17, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  tabBadgeText: { color: '#FFF', fontSize: 9, fontWeight: '800' },
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  ticketCard: { borderRadius: 18, padding: 14, marginBottom: 10, borderLeftWidth: 4 },
  ticketTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  ticketId: { fontSize: 11, fontWeight: '700' },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusPillText: { fontSize: 11, fontWeight: '800' },
  ticketTitle: { fontSize: 14, fontWeight: '700', marginBottom: 8, lineHeight: 20 },
  ticketMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  categoryPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  categoryText: { fontSize: 11, fontWeight: '700' },
  ticketDate: { fontSize: 11 },
  createdBy: { fontSize: 11, marginBottom: 10 },
  ticketActions: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  actionBtnText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  empty: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyText: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
});
