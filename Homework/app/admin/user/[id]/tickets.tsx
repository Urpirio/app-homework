/**
 * User Tickets Screen
 *
 * Displays a user's ticket history using React Query hooks.
 * Supports search/filter by status, category, and priority.
 *
 * Validates: Requirements 15.4, 15.5
 */

import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { EmptyState, ErrorState, SkeletonLoader } from '@/components/shared';
import { ThemedView } from '@/components/shared/ThemedView';
import { useUserTickets } from '@/hooks/api/useTickets';
import { useTheme } from '@/hooks/useTheme';
import type { Ticket, TicketStatus } from '@/types/ticket';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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

const STATUS_ICONS: Record<TicketStatus, keyof typeof Ionicons.glyphMap> = {
  OPEN: 'radio-button-on',
  IN_PROGRESS: 'time',
  RESOLVED: 'checkmark-circle',
  CLOSED: 'lock-closed',
};

export default function UserTicketsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'ALL'>('ALL');

  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useUserTickets(id!);

  const allTickets = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.data);
  }, [data]);

  const filteredTickets = useMemo(() => {
    let result = allTickets;
    if (statusFilter !== 'ALL') {
      result = result.filter((t) => t.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q)
      );
    }
    return result;
  }, [allTickets, search, statusFilter]);

  const renderTicket = ({ item }: { item: Ticket }) => {
    const statusColor = STATUS_COLORS[item.status] || '#8E8E93';
    return (
      <Pressable
        onPress={() => router.push(`/admin/user/${id}/ticket/${item.id}`)}
        style={({ pressed }) => [
          styles.ticketCard,
          {
            backgroundColor: theme.colors.card,
            borderWidth: 1,
            borderColor: theme.colors.border + '30',
            opacity: pressed ? 0.8 : 1,
          },
        ]}
      >
        <View style={[styles.ticketIcon, { backgroundColor: statusColor + '15' }]}>
          <Ionicons name={STATUS_ICONS[item.status]} size={24} color={statusColor} />
        </View>
        <View style={styles.ticketInfo}>
          <View style={styles.ticketHeader}>
            <Text style={[styles.ticketCategory, { color: theme.colors.primary }]}>
              {item.category}
            </Text>
            <Text style={[styles.ticketDate, { color: theme.colors.textSecondary }]}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
          <Text style={[styles.ticketTitle, { color: theme.colors.text }]} numberOfLines={2}>
            {item.title}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '10' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {STATUS_LABELS[item.status]}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ThemedView style={styles.container}>
        <BackgroundShapes />

        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Historial de Tickets
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View
            style={[
              styles.searchBar,
              {
                backgroundColor: theme.colors.card,
                borderWidth: 1,
                borderColor: theme.colors.border + '30',
              },
            ]}
          >
            <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: theme.colors.text }]}
              placeholder="Buscar por título o categoría..."
              placeholderTextColor={theme.colors.textSecondary}
              value={search}
              onChangeText={setSearch}
            />
          </View>
        </View>

        {/* Status Filter */}
        <View style={styles.filterRow}>
          {(['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const).map((s) => {
            const selected = statusFilter === s;
            return (
              <Pressable
                key={s}
                onPress={() => setStatusFilter(s)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: selected ? theme.colors.primary : theme.colors.card,
                    borderColor: selected ? theme.colors.primary : theme.colors.border + '40',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: selected ? '#FFF' : theme.colors.textSecondary },
                  ]}
                >
                  {s === 'ALL' ? 'Todos' : STATUS_LABELS[s]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {isLoading ? (
          <View style={styles.loaderContainer}>
            <SkeletonLoader rows={5} variant="list-item" />
          </View>
        ) : isError ? (
          <ErrorState error={error as any} onRetry={() => refetch()} />
        ) : (
          <FlatList
            data={filteredTickets}
            renderItem={renderTicket}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            onEndReached={() => {
              if (hasNextPage && !isFetchingNextPage) fetchNextPage();
            }}
            onEndReachedThreshold={0.5}
            ListEmptyComponent={
              <EmptyState
                icon="document-text-outline"
                title="Sin tickets"
                message="No hay tickets registrados."
              />
            }
          />
        )}
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 10 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', marginLeft: 10 },
  searchContainer: { paddingHorizontal: 20, marginBottom: 10 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    height: 50,
    borderRadius: 15,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16 },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 10,
    gap: 6,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  filterChipText: { fontSize: 12, fontWeight: '700' },
  loaderContainer: { padding: 20 },
  list: { padding: 20, paddingBottom: 40 },
  ticketCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 24,
    marginBottom: 12,
    gap: 16,
  },
  ticketIcon: {
    width: 50,
    height: 50,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ticketInfo: { flex: 1 },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  ticketCategory: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  ticketDate: { fontSize: 11 },
  ticketTitle: { fontSize: 16, fontWeight: '700', marginBottom: 10 },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: { fontSize: 10, fontWeight: '800' },
});
