/**
 * User Directory Screen
 *
 * Displays paginated user list from GET /users with useInfiniteQuery (20 per page).
 * Supports role filtering, institution filtering (SUPER_ADMIN only), search,
 * user creation, bulk enrollment, and CSV import.
 *
 * Validates: Requirements 6.1, 6.2, 6.6, 6.7, 6.8
 */

import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { UserRegistrationModal } from '@/components/login/UserRegistrationModal';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import { ThemedView } from '@/components/shared/ThemedView';
import { useProfile } from '@/hooks/api/useAuth';
import { useInstitutions } from '@/hooks/api/useInstitutions';
import { useUsers } from '@/hooks/api/useUsers';
import { useTheme } from '@/hooks/useTheme';
import { InstitutionContext } from '@/providers/InstitutionContext';
import { UserRole } from '@/types/auth';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useContext, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BulkEnrollmentModal } from '@/components/admin/BulkEnrollmentModal';
import { CSVImportModal } from '@/components/admin/CSVImportModal';

const ROLE_FILTERS = [
  { key: 'ALL', label: 'Todos' },
  { key: 'STUDENT', label: 'Alumnos' },
  { key: 'TEACHER', label: 'Maestros' },
  { key: 'SUPPORT', label: 'Soporte' },
  { key: 'SCHOOL_ADMIN', label: 'Admins' },
] as const;

type RoleFilterKey = (typeof ROLE_FILTERS)[number]['key'];

/**
 * Role-specific navigation routing per design document (Property 16).
 * Routes STUDENT -> student detail, TEACHER -> teacher detail,
 * SUPPORT -> support detail, others -> generic user detail.
 */
function navigateToUserDetail(user: {
  id: string;
  role: string;
  institutionId?: string | null;
}) {
  const base = `/admin/institution/${user.institutionId}`;
  switch (user.role) {
    case 'STUDENT':
      router.push(`${base}/student/${user.id}` as any);
      break;
    case 'TEACHER':
      router.push(`${base}/teacher/${user.id}` as any);
      break;
    case 'SUPPORT':
      router.push(`${base}/support/${user.id}` as any);
      break;
    default:
      router.push(`/admin/user/${user.id}` as any);
      break;
  }
}

function getRoleColor(role: string) {
  switch (role) {
    case 'TEACHER':
      return '#5856D6';
    case 'SCHOOL_ADMIN':
      return '#FF3B30';
    case 'SUPER_ADMIN':
      return '#AF52DE';
    case 'SUPPORT':
      return '#FF9500';
    default:
      return '#007AFF';
  }
}

export default function UserDirectoryScreen() {
  const { theme } = useTheme();
  const { data: profile } = useProfile();
  const { institutionId: contextInstitutionId } = useContext(InstitutionContext);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilterKey>('ALL');
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<string | null>(null);
  const [showInstitutionPicker, setShowInstitutionPicker] = useState(false);
  const [regModalVisible, setRegModalVisible] = useState(false);
  const [csvModalVisible, setCsvModalVisible] = useState(false);
  const [enrollModalVisible, setEnrollModalVisible] = useState(false);
  const [fabMenuVisible, setFabMenuVisible] = useState(false);

  const isSuperAdmin = profile?.role === UserRole.SUPER_ADMIN;

  // Determine the effective institution ID for filtering
  const effectiveInstitutionId = isSuperAdmin
    ? selectedInstitutionId || contextInstitutionId
    : profile?.institutionId || null;

  // Build query params for useUsers hook
  const queryParams = useMemo(
    () => ({
      ...(roleFilter !== 'ALL' ? { role: roleFilter as UserRole } : {}),
      ...(effectiveInstitutionId ? { institutionId: effectiveInstitutionId } : {}),
      ...(search.trim() ? { search: search.trim() } : {}),
    }),
    [roleFilter, effectiveInstitutionId, search]
  );

  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useUsers(queryParams);

  // Fetch institutions for SUPER_ADMIN dropdown
  const { data: institutions } = useInstitutions();

  // Flatten paginated data
  const users = useMemo(
    () => data?.pages.flatMap((page) => page.data) ?? [],
    [data]
  );

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleUserCreated = useCallback(() => {
    refetch();
  }, [refetch]);

  const renderUser = useCallback(
    ({ item }: { item: any }) => (
      <Pressable
        style={[styles.userCard, { backgroundColor: theme.colors.card }]}
        onPress={() =>
          navigateToUserDetail({
            id: item.id,
            role: item.role,
            institutionId: item.institutionId || effectiveInstitutionId,
          })
        }
        accessibilityRole="button"
        accessibilityLabel={`${item.fullName}, ${item.role}`}
      >
        <View
          style={[styles.avatar, { backgroundColor: theme.colors.primaryLight }]}
        >
          {item.avatarUrl ? (
            <Image source={{ uri: item.avatarUrl }} style={styles.avatarImg} />
          ) : (
            <Text style={[styles.avatarText, { color: theme.colors.primary }]}>
              {item.fullName?.charAt(0) || '?'}
            </Text>
          )}
        </View>
        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: theme.colors.text }]}>
            {item.fullName}
          </Text>
          <Text style={[styles.userEmail, { color: theme.colors.textSecondary }]}>
            {item.email}
          </Text>
          <View
            style={[
              styles.roleBadge,
              { backgroundColor: getRoleColor(item.role) + '20' },
            ]}
          >
            <Text style={[styles.roleText, { color: getRoleColor(item.role) }]}>
              {item.role}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={theme.colors.border} />
      </Pressable>
    ),
    [theme, effectiveInstitutionId]
  );

  const renderFooter = useCallback(() => {
    if (!isFetchingNextPage) return null;
    return (
      <ActivityIndicator
        size="small"
        color={theme.colors.primary}
        style={styles.footerLoader}
      />
    );
  }, [isFetchingNextPage, theme]);

  const renderContent = () => {
    if (isLoading) {
      return <SkeletonLoader rows={6} variant="list-item" />;
    }

    if (isError) {
      return (
        <ErrorState
          error={error as any}
          onRetry={() => refetch()}
          style={styles.stateContainer}
        />
      );
    }

    if (users.length === 0) {
      return (
        <EmptyState
          icon="people-outline"
          title="No se encontraron usuarios"
          message={
            search
              ? 'Intenta con otros terminos de busqueda.'
              : 'Aun no hay usuarios registrados.'
          }
          actionLabel="Registrar usuario"
          onAction={() => setRegModalVisible(true)}
          style={styles.stateContainer}
        />
      );
    }

    return (
      <FlatList
        data={users}
        renderItem={renderUser}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.3}
        ListFooterComponent={renderFooter}
      />
    );
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
    >
      <ThemedView style={styles.container}>
        <BackgroundShapes />

        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </Pressable>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Directorio
          </Text>
        </View>

        {/* Search bar */}
        <View style={styles.searchContainer}>
          <View style={[styles.searchBar, { backgroundColor: theme.colors.card }]}>
            <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: theme.colors.text }]}
              placeholder="Buscar por nombre o correo..."
              placeholderTextColor={theme.colors.textSecondary}
              value={search}
              onChangeText={setSearch}
              accessibilityLabel="Search users"
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

        {/* Institution dropdown (SUPER_ADMIN only) */}
        {isSuperAdmin && (
          <View style={styles.institutionPickerContainer}>
            <Pressable
              style={[styles.institutionPicker, { backgroundColor: theme.colors.card }]}
              onPress={() => setShowInstitutionPicker(!showInstitutionPicker)}
              accessibilityRole="button"
              accessibilityLabel="Select institution"
            >
              <Ionicons
                name="business-outline"
                size={18}
                color={theme.colors.textSecondary}
              />
              <Text
                style={[styles.institutionPickerText, { color: theme.colors.text }]}
                numberOfLines={1}
              >
                {selectedInstitutionId
                  ? institutions?.find((i) => i.id === selectedInstitutionId)?.name ||
                    'Institucion'
                  : 'Todas las instituciones'}
              </Text>
              <Ionicons
                name={showInstitutionPicker ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={theme.colors.textSecondary}
              />
            </Pressable>

            {showInstitutionPicker && (
              <View
                style={[styles.institutionDropdown, { backgroundColor: theme.colors.card }]}
              >
                <Pressable
                  style={[
                    styles.institutionOption,
                    !selectedInstitutionId && {
                      backgroundColor: theme.colors.primaryLight,
                    },
                  ]}
                  onPress={() => {
                    setSelectedInstitutionId(null);
                    setShowInstitutionPicker(false);
                  }}
                >
                  <Text style={[styles.institutionOptionText, { color: theme.colors.text }]}>
                    Todas las instituciones
                  </Text>
                </Pressable>
                {institutions?.map((inst) => (
                  <Pressable
                    key={inst.id}
                    style={[
                      styles.institutionOption,
                      selectedInstitutionId === inst.id && {
                        backgroundColor: theme.colors.primaryLight,
                      },
                    ]}
                    onPress={() => {
                      setSelectedInstitutionId(inst.id);
                      setShowInstitutionPicker(false);
                    }}
                  >
                    <Text
                      style={[styles.institutionOptionText, { color: theme.colors.text }]}
                      numberOfLines={1}
                    >
                      {inst.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Role filter chips */}
        <View style={styles.filterRow}>
          {ROLE_FILTERS.map((rf) => (
            <FilterChip
              key={rf.key}
              label={rf.label}
              active={roleFilter === rf.key}
              onPress={() => setRoleFilter(rf.key)}
            />
          ))}
        </View>

        {/* User list */}
        {renderContent()}

        {/* FAB with menu */}
        {fabMenuVisible && (
          <Pressable style={styles.fabOverlay} onPress={() => setFabMenuVisible(false)}>
            <View style={[styles.fabMenu, { backgroundColor: theme.colors.card }]}>
              <Pressable
                style={styles.fabMenuItem}
                onPress={() => {
                  setFabMenuVisible(false);
                  setRegModalVisible(true);
                }}
              >
                <Ionicons name="person-add-outline" size={20} color={theme.colors.text} />
                <Text style={[styles.fabMenuText, { color: theme.colors.text }]}>
                  Registrar usuario
                </Text>
              </Pressable>
              <Pressable
                style={styles.fabMenuItem}
                onPress={() => {
                  setFabMenuVisible(false);
                  setEnrollModalVisible(true);
                }}
              >
                <Ionicons name="school-outline" size={20} color={theme.colors.text} />
                <Text style={[styles.fabMenuText, { color: theme.colors.text }]}>
                  Inscripcion masiva
                </Text>
              </Pressable>
              <Pressable
                style={styles.fabMenuItem}
                onPress={() => {
                  setFabMenuVisible(false);
                  setCsvModalVisible(true);
                }}
              >
                <Ionicons name="cloud-upload-outline" size={20} color={theme.colors.text} />
                <Text style={[styles.fabMenuText, { color: theme.colors.text }]}>
                  Importar CSV
                </Text>
              </Pressable>
            </View>
          </Pressable>
        )}

        <Pressable
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          onPress={() => setFabMenuVisible(!fabMenuVisible)}
          accessibilityRole="button"
          accessibilityLabel="User actions menu"
        >
          <Ionicons name={fabMenuVisible ? 'close' : 'add'} size={28} color="#FFFFFF" />
        </Pressable>

        {/* Modals */}
        <UserRegistrationModal
          visible={regModalVisible}
          onClose={() => setRegModalVisible(false)}
          role={roleFilter === 'ALL' ? 'STUDENT' : (roleFilter as any)}
          onSuccess={handleUserCreated}
        />

        <BulkEnrollmentModal
          visible={enrollModalVisible}
          onClose={() => setEnrollModalVisible(false)}
          institutionId={effectiveInstitutionId}
          onSuccess={handleUserCreated}
        />

        <CSVImportModal
          visible={csvModalVisible}
          onClose={() => setCsvModalVisible(false)}
          onSuccess={handleUserCreated}
        />
      </ThemedView>
    </SafeAreaView>
  );
}

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        { backgroundColor: active ? theme.colors.primary : theme.colors.card },
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`Filter by ${label}`}
    >
      <Text
        style={[
          styles.chipText,
          { color: active ? '#FFFFFF' : theme.colors.textSecondary },
        ]}
      >
        {label}
      </Text>
    </Pressable>
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
  searchContainer: { paddingHorizontal: 20, marginBottom: 12 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    height: 50,
    borderRadius: 15,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16 },
  institutionPickerContainer: {
    paddingHorizontal: 20,
    marginBottom: 12,
    zIndex: 10,
  },
  institutionPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    height: 44,
    borderRadius: 12,
    gap: 8,
  },
  institutionPickerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  institutionDropdown: {
    position: 'absolute',
    top: 48,
    left: 20,
    right: 20,
    borderRadius: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    maxHeight: 200,
    overflow: 'hidden',
  },
  institutionOption: {
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  institutionOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  chipText: { fontSize: 13, fontWeight: '600' },
  list: { paddingHorizontal: 20, paddingBottom: 100 },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 24,
    marginBottom: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarImg: { width: 50, height: 50, borderRadius: 25 },
  avatarText: { fontSize: 20, fontWeight: '700' },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: '700' },
  userEmail: { fontSize: 13, marginTop: 2, opacity: 0.7 },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 6,
  },
  roleText: { fontSize: 10, fontWeight: '800' },
  stateContainer: { marginTop: 40 },
  footerLoader: { paddingVertical: 20 },
  fabOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
  },
  fabMenu: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    borderRadius: 16,
    padding: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    minWidth: 200,
  },
  fabMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  fabMenuText: { fontSize: 14, fontWeight: '600' },
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
    zIndex: 25,
  },
});
