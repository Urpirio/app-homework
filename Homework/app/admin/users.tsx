import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { ThemedView } from '@/components/shared/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import React, { useState, useCallback } from 'react';
import { 
  ScrollView, 
  StyleSheet, 
  Text, 
  View, 
  Dimensions, 
  Pressable,
  ActivityIndicator,
  FlatList,
  TextInput,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router, useFocusEffect } from 'expo-router';
import api from '@/utils/api';
import { UserRegistrationModal } from '@/components/login/UserRegistrationModal';
import { UserRole } from '@/types/auth';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function UserDirectoryScreen() {
  const { theme } = useTheme();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'STUDENT' | 'TEACHER' | 'SUPPORT'>('ALL');
  const [regModalVisible, setRegModalVisible] = useState(false);
  const [institutionId, setInstitutionId] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      const profile = await api.get('/auth/profile');
      let apiUsers = [];
      if (profile.data.institutionId) {
        setInstitutionId(profile.data.institutionId);
        const res = await api.get(`/institutions/${profile.data.institutionId}`);
        apiUsers = res.data.users || [];
      }
      
      setUsers(apiUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchUsers();
    }, [])
  );

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.fullName.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'ALL' || u.role === filter;
    return matchesSearch && matchesFilter;
  });

  const renderUser = ({ item }: { item: any }) => (
    <Pressable 
      style={[styles.userCard, { backgroundColor: theme.colors.card }]}
      onPress={() => {
        if (item.role === 'STUDENT') {
          router.push(`/admin/institution/${institutionId}/student/${item.id}`);
        } else if (item.role === 'TEACHER') {
          router.push(`/admin/institution/${institutionId}/teacher/${item.id}`);
        } else {
          router.push(`/admin/user/${item.id}`);
        }
      }}
    >
      <View style={[styles.avatar, { backgroundColor: theme.colors.primaryLight }]}>
        {item.avatarUrl ? (
          <Image source={{ uri: item.avatarUrl }} style={styles.avatarImg} />
        ) : (
          <Text style={[styles.avatarText, { color: theme.colors.primary }]}>{item.fullName.charAt(0)}</Text>
        )}
      </View>
      <View style={styles.userInfo}>
        <Text style={[styles.userName, { color: theme.colors.text }]}>{item.fullName}</Text>
        <Text style={[styles.userEmail, { color: theme.colors.textSecondary }]}>{item.email}</Text>
        <View style={[styles.roleBadge, { backgroundColor: getRoleColor(item.role) + '20' }]}>
          <Text style={[styles.roleText, { color: getRoleColor(item.role) }]}>{item.role}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={theme.colors.border} />
    </Pressable>
  );

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'TEACHER': return '#5856D6';
      case 'SCHOOL_ADMIN': return '#FF3B30';
      case 'SUPPORT': return '#FF9500';
      default: return '#007AFF';
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ThemedView style={styles.container}>
        <BackgroundShapes />
        
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </Pressable>
          <Text style={[styles.title, { color: theme.colors.text }]}>Directorio</Text>
        </View>

        <View style={styles.searchContainer}>
          <View style={[styles.searchBar, { backgroundColor: theme.colors.card }]}>
            <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: theme.colors.text }]}
              placeholder="Buscar por nombre o correo..."
              placeholderTextColor={theme.colors.textSecondary}
              value={search}
              onChangeText={setSearch}
            />
          </View>
        </View>

        <View style={styles.filterRow}>
          <FilterChip label="Todos" active={filter === 'ALL'} onPress={() => setFilter('ALL')} />
          <FilterChip label="Alumnos" active={filter === 'STUDENT'} onPress={() => setFilter('STUDENT')} />
          <FilterChip label="Maestros" active={filter === 'TEACHER'} onPress={() => setFilter('TEACHER')} />
          <FilterChip label="Soporte" active={filter === 'SUPPORT'} onPress={() => setFilter('SUPPORT')} />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={filteredUsers}
            renderItem={renderUser}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No se encontraron usuarios.</Text>
              </View>
            }
          />
        )}

        <Pressable 
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          onPress={() => setRegModalVisible(true)}
        >
          <Ionicons name="person-add" size={28} color="#FFFFFF" />
        </Pressable>

        <UserRegistrationModal
          visible={regModalVisible}
          onClose={() => setRegModalVisible(false)}
          role={filter === 'ALL' ? 'STUDENT' : filter}
          onSuccess={fetchUsers}
        />
      </ThemedView>
    </SafeAreaView>
  );
}

const FilterChip = ({ label, active, onPress }: any) => {
  const { theme } = useTheme();
  return (
    <Pressable 
      onPress={onPress}
      style={[
        styles.chip, 
        { backgroundColor: active ? theme.colors.primary : theme.colors.card }
      ]}
    >
      <Text style={[styles.chipText, { color: active ? '#FFFFFF' : theme.colors.textSecondary }]}>{label}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, justifyContent: 'space-between' },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '800', flex: 1, marginLeft: 10 },
  addBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  searchContainer: { paddingHorizontal: 20, marginBottom: 15 },
  searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, height: 50, borderRadius: 15 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16 },
  filterRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 20 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  chipText: { fontSize: 13, fontWeight: '600' },
  list: { paddingHorizontal: 20, paddingBottom: 40 },
  userCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 24, marginBottom: 12 },
  avatar: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  avatarImg: { width: 50, height: 50, borderRadius: 25 },
  avatarText: { fontSize: 20, fontWeight: '700' },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: '700' },
  userEmail: { fontSize: 13, marginTop: 2, opacity: 0.7 },
  roleBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 6 },
  roleText: { fontSize: 10, fontWeight: '800' },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { fontSize: 16 },
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
