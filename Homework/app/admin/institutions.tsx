import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { InstitutionModal } from '@/components/login/InstitutionModal';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import { ThemedView } from '@/components/shared/ThemedView';
import { useInstitutions } from '@/hooks/api/useInstitutions';
import { useTheme } from '@/hooks/useTheme';
import type { Institution } from '@/types/institution';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
    FlatList,
    Image,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function InstitutionsListScreen() {
  const { theme } = useTheme();
  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  const {
    data: institutions,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useInstitutions(search || undefined);

  const filtered = useMemo(() => {
    if (!institutions) return [];
    if (!search.trim()) return institutions;
    const q = search.toLowerCase();
    return institutions.filter(
      (inst) =>
        inst.name.toLowerCase().includes(q) ||
        inst.address?.toLowerCase().includes(q)
    );
  }, [institutions, search]);

  const renderInstitution = useCallback(
    ({ item }: { item: Institution }) => (
      <Pressable
        style={[styles.card, { backgroundColor: theme.colors.card }]}
        onPress={() => router.push(`/admin/institution/${item.id}`)}
        accessibilityRole="button"
        accessibilityLabel={`Institución ${item.name}`}
      >
        <View
          style={[
            styles.logoContainer,
            { backgroundColor: theme.colors.primaryLight },
          ]}
        >
          {item.logoUrl ? (
            <Image source={{ uri: item.logoUrl }} style={styles.logo} />
          ) : (
            <Ionicons name="business" size={24} color={theme.colors.primary} />
          )}
        </View>
        <View style={styles.info}>
          <Text style={[styles.name, { color: theme.colors.text }]}>
            {item.name}
          </Text>
          <Text
            style={[styles.address, { color: theme.colors.textSecondary }]}
            numberOfLines={1}
          >
            {item.address || 'Sin dirección registrada'}
          </Text>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Ionicons
                name="people"
                size={14}
                color={theme.colors.textSecondary}
              />
              <Text
                style={[styles.statText, { color: theme.colors.textSecondary }]}
              >
                {item._count?.users ?? 0} Usuarios
              </Text>
            </View>
            <View style={styles.stat}>
              <Ionicons
                name="school"
                size={14}
                color={theme.colors.textSecondary}
              />
              <Text
                style={[styles.statText, { color: theme.colors.textSecondary }]}
              >
                {item._count?.projects ?? 0} Aulas
              </Text>
            </View>
          </View>
        </View>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={theme.colors.border}
        />
      </Pressable>
    ),
    [theme]
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
    >
      <ThemedView style={styles.container}>
        <BackgroundShapes />

        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </Pressable>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Instituciones
          </Text>
        </View>

        <View style={styles.searchContainer}>
          <View
            style={[styles.searchBar, { backgroundColor: theme.colors.card }]}
          >
            <Ionicons
              name="search"
              size={20}
              color={theme.colors.textSecondary}
            />
            <TextInput
              style={[styles.searchInput, { color: theme.colors.text }]}
              placeholder="Buscar institución..."
              placeholderTextColor={theme.colors.textSecondary}
              value={search}
              onChangeText={setSearch}
              accessibilityLabel="Buscar institución"
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch('')}>
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={theme.colors.textSecondary}
                />
              </Pressable>
            )}
          </View>
        </View>

        {isLoading ? (
          <View style={styles.list}>
            <SkeletonLoader rows={5} variant="card" />
          </View>
        ) : isError ? (
          <ErrorState error={error!} onRetry={() => refetch()} />
        ) : (
          <FlatList
            data={filtered}
            renderItem={renderInstitution}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={() => refetch()}
                tintColor={theme.colors.primary}
              />
            }
            ListEmptyComponent={
              <EmptyState
                icon="business-outline"
                title="Sin instituciones"
                message={
                  search
                    ? 'No se encontraron instituciones con ese criterio.'
                    : 'No hay instituciones registradas.'
                }
              />
            }
          />
        )}

        <Pressable
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          onPress={() => setModalVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Crear nueva institución"
        >
          <Ionicons name="add" size={30} color="#FFFFFF" />
        </Pressable>

        <InstitutionModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onSuccess={() => refetch()}
        />
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    justifyContent: 'space-between',
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '800', flex: 1, marginLeft: 10 },
  searchContainer: { paddingHorizontal: 20, marginBottom: 20 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    height: 50,
    borderRadius: 15,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16 },
  list: { paddingHorizontal: 20, paddingBottom: 40 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 24,
    marginBottom: 12,
  },
  logoContainer: {
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  logo: { width: 60, height: 60, borderRadius: 20 },
  info: { flex: 1 },
  name: { fontSize: 18, fontWeight: '700' },
  address: { fontSize: 13, marginTop: 2, opacity: 0.7 },
  statsRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 11, fontWeight: '600' },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});
