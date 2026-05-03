import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { ThemedView } from '@/components/shared/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { 
  FlatList, 
  StyleSheet, 
  Text, 
  View, 
  Pressable, 
  ActivityIndicator,
  TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '@/utils/api';

export default function UserTicketsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchTickets();
  }, [id]);

  const fetchTickets = async () => {
    try {
      const res = await api.get(`/users/${id}/tickets`);
      setTickets(res.data);
    } catch (error) {
      // Mock data
      setTickets([
        { id: 't1', title: 'Error en acceso a plataforma', date: 'Hoy, 10:30 AM', status: 'RESOLVED', category: 'Acceso' },
        { id: 't2', title: 'Recuperación de contraseña docente', date: 'Ayer, 03:45 PM', status: 'RESOLVED', category: 'Cuentas' },
        { id: 't3', title: 'Falla en carga de archivos - 6to A', date: '22 May, 09:15 AM', status: 'RESOLVED', category: 'Contenido' },
        { id: 't4', title: 'Actualización de roles institucionales', date: '21 May, 11:20 AM', status: 'IN_PROGRESS', category: 'Admin' },
        { id: 't5', title: 'Problema con visualización de notas', date: '20 May, 04:10 PM', status: 'RESOLVED', category: 'Notas' },
        { id: 't6', title: 'Error de sincronización con base de datos', date: '19 May, 08:00 AM', status: 'RESOLVED', category: 'Base de Datos' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredTickets = tickets.filter(t => 
    t.title.toLowerCase().includes(search.toLowerCase()) || 
    t.category.toLowerCase().includes(search.toLowerCase())
  );

  const renderTicket = ({ item }: { item: any }) => (
    <Pressable 
      onPress={() => router.push(`/admin/user/${id}/ticket/${item.id}`)}
      style={({ pressed }) => [
        styles.ticketCard, 
        { 
          backgroundColor: theme.colors.card, 
          borderWidth: 1, 
          borderColor: theme.colors.border + '30',
          opacity: pressed ? 0.8 : 1
        }
      ]}
    >
      <View style={[styles.ticketIcon, { backgroundColor: (item.status === 'RESOLVED' ? '#34C759' : '#FF9500') + '15' }]}>
        <Ionicons 
          name={item.status === 'RESOLVED' ? 'checkmark-circle' : 'time'} 
          size={24} 
          color={item.status === 'RESOLVED' ? '#34C759' : '#FF9500'} 
        />
      </View>
      <View style={styles.ticketInfo}>
        <View style={styles.ticketHeader}>
          <Text style={[styles.ticketCategory, { color: theme.colors.primary }]}>{item.category}</Text>
          <Text style={[styles.ticketDate, { color: theme.colors.textSecondary }]}>{item.date}</Text>
        </View>
        <Text style={[styles.ticketTitle, { color: theme.colors.text }]}>{item.title}</Text>
        <View style={[styles.statusBadge, { backgroundColor: (item.status === 'RESOLVED' ? '#34C759' : '#FF9500') + '10' }]}>
          <Text style={[styles.statusText, { color: item.status === 'RESOLVED' ? '#34C759' : '#FF9500' }]}>
            {item.status === 'RESOLVED' ? 'Completado' : 'En Revisión'}
          </Text>
        </View>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ThemedView style={styles.container}>
        <BackgroundShapes />
        
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Historial de Tickets</Text>
        </View>

        <View style={styles.searchContainer}>
          <View style={[styles.searchBar, { backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border + '30' }]}>
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

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <FlatList
            data={filteredTickets}
            renderItem={renderTicket}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="document-text-outline" size={64} color={theme.colors.border} />
                <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No hay tickets registrados.</Text>
              </View>
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
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 10 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', marginLeft: 10 },
  searchContainer: { paddingHorizontal: 20, marginBottom: 15 },
  searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, height: 50, borderRadius: 15 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16 },
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
  ticketInfo: {
    flex: 1,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  ticketCategory: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  ticketDate: {
    fontSize: 11,
  },
  ticketTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
