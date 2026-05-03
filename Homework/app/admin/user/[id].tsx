import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { ThemedView } from '@/components/shared/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { 
  ScrollView, 
  StyleSheet, 
  Text, 
  View, 
  Pressable, 
  ActivityIndicator,
  Image,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '@/utils/api';

export default function SupportProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [optionsVisible, setOptionsVisible] = useState(false);

  useEffect(() => {
    fetchSupportProfile();
  }, [id]);

  const fetchSupportProfile = async () => {
    try {
      const res = await api.get(`/users/${id}/profile`);
      setUser(res.data);
    } catch (error) {
      // Mock data matching existing style
      setUser({
        id,
        fullName: 'Roberto Gómez',
        email: 'roberto.g@soporte.com',
        role: 'SUPPORT',
        specialty: 'Soporte Técnico Nivel 2',
        avatar: 'https://i.pravatar.cc/150?u=roberto',
        stats: {
          ticketsSolved: 145,
          activeAlerts: 2,
          avgResponse: '15m',
          rating: 4.8
        },
        tickets: [
          { id: 't1', title: 'Error en acceso a plataforma', date: 'Hoy, 10:30 AM', status: 'RESOLVED' },
          { id: 't2', title: 'Recuperación de contraseña docente', date: 'Ayer, 03:45 PM', status: 'RESOLVED' },
          { id: 't3', title: 'Falla en carga de archivos - 6to A', date: '22 May, 09:15 AM', status: 'RESOLVED' },
          { id: 't4', title: 'Actualización de roles institucionales', date: '21 May, 11:20 AM', status: 'IN_PROGRESS' },
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ThemedView style={styles.container}>
        <BackgroundShapes />
        
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Perfil de Soporte</Text>
          <View style={styles.headerActions}>
            <Pressable 
              onPress={() => router.push({
                pathname: '/chat/[id]',
                params: { id, name: user?.fullName, type: 'user' }
              })} 
              style={styles.actionHeaderBtn}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={22} color={theme.colors.text} />
            </Pressable>
            <Pressable onPress={() => setOptionsVisible(true)} style={styles.actionHeaderBtn}>
              <Ionicons name="ellipsis-vertical" size={22} color={theme.colors.text} />
            </Pressable>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Profile Card Horizontal (Consistent Style) */}
          <View style={[styles.profileCard, { backgroundColor: theme.colors.card }]}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.primaryLight }]}>
                <Text style={[styles.avatarInitials, { color: theme.colors.primary }]}>{user?.fullName.charAt(0)}</Text>
              </View>
            )}
            <View style={styles.profileInfo}>
              <Text style={[styles.name, { color: theme.colors.text }]}>{user?.fullName}</Text>
              <Text style={[styles.specialty, { color: theme.colors.primary }]}>{user?.specialty || 'Staff de Soporte'}</Text>
              <Text style={[styles.email, { color: theme.colors.textSecondary }]}>{user?.email}</Text>
            </View>
          </View>

          {/* Stats Grid (Consistent Style) */}
          <View style={styles.statsGrid}>
            <Pressable 
              onPress={() => router.push(`/admin/user/${id}/tickets`)}
              style={({ pressed }) => [
                styles.statItem, 
                { 
                  backgroundColor: theme.colors.card, 
                  borderWidth: 1, 
                  borderColor: theme.colors.border + '30',
                  opacity: pressed ? 0.7 : 1
                }
              ]}
            >
              <Text style={[styles.statValue, { color: '#34C759' }]}>{user?.stats.ticketsSolved}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Resueltos</Text>
            </Pressable>
            <View style={[styles.statItem, { backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border + '30' }]}>
              <Text style={[styles.statValue, { color: '#FF9500' }]}>{user?.stats.avgResponse}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Resp.</Text>
            </View>
            <Pressable 
              onPress={() => router.push(`/admin/user/${id}/reviews`)}
              style={({ pressed }) => [
                styles.statItem, 
                { 
                  backgroundColor: theme.colors.card, 
                  borderWidth: 1, 
                  borderColor: theme.colors.border + '30',
                  opacity: pressed ? 0.7 : 1
                }
              ]}
            >
              <Text style={[styles.statValue, { color: '#FFCC00' }]}>{user?.stats.rating}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Calif.</Text>
            </Pressable>
          </View>

          {/* Recent Tickets (Consistent Style) */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Últimos Tickets Atendidos</Text>
            {user?.tickets?.map((item: any) => (
              <Pressable 
                key={item.id} 
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
                    size={22} 
                    color={item.status === 'RESOLVED' ? '#34C759' : '#FF9500'} 
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.ticketTitle, { color: theme.colors.text }]}>{item.title}</Text>
                  <Text style={[styles.ticketDate, { color: theme.colors.textSecondary }]}>{item.date}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: (item.status === 'RESOLVED' ? '#34C759' : '#FF9500') + '10' }]}>
                  <Text style={[styles.statusText, { color: item.status === 'RESOLVED' ? '#34C759' : '#FF9500' }]}>
                    {item.status === 'RESOLVED' ? 'Cerrado' : 'Pendiente'}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        {/* Options Menu Modal */}
        {optionsVisible && (
          <Pressable 
            style={StyleSheet.absoluteFill} 
            onPress={() => setOptionsVisible(false)}
          >
            <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
              <View style={[styles.optionsCard, { backgroundColor: theme.colors.card }]}>
                <Pressable 
                  style={styles.optionItem} 
                  onPress={() => {
                    setOptionsVisible(false);
                    router.push({ pathname: '/edit-profile', params: { userId: id } });
                  }}
                >
                  <Ionicons name="pencil" size={20} color={theme.colors.text} />
                  <Text style={[styles.optionText, { color: theme.colors.text }]}>Editar Perfil</Text>
                </Pressable>
                
                <View style={[styles.divider, { backgroundColor: theme.colors.border + '30' }]} />
                
                <Pressable 
                  style={styles.optionItem} 
                  onPress={() => {
                    setOptionsVisible(false);
                    Alert.alert(
                      'Eliminar Soporte',
                      '¿Estás seguro de que deseas eliminar a este miembro del personal? Esta acción no se puede deshacer.',
                      [
                        { text: 'Cancelar', style: 'cancel' },
                        { 
                          text: 'Eliminar', 
                          style: 'destructive',
                          onPress: () => {
                            Toast.show({ type: 'success', text1: 'Personal eliminado' });
                            router.back();
                          }
                        }
                      ]
                    );
                  }}
                >
                  <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                  <Text style={[styles.optionText, { color: '#FF3B30' }]}>Eliminar Soporte</Text>
                </Pressable>
              </View>
            </View>
          </Pressable>
        )}
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 10, justifyContent: 'space-between' },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionHeaderBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 30,
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 25,
    marginRight: 20,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 25,
    marginRight: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 32,
    fontWeight: '800',
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  specialty: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  email: {
    fontSize: 13,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statItem: {
    flex: 1,
    padding: 15,
    borderRadius: 22,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 22,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  infoText: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  ticketCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 22,
    marginBottom: 10,
    gap: 12
  },
  ticketIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ticketTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  ticketDate: {
    fontSize: 12,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    paddingTop: 60,
    paddingRight: 20,
    alignItems: 'flex-end',
  },
  optionsCard: {
    width: 220,
    borderRadius: 20,
    padding: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#00000015',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  optionText: {
    fontSize: 15,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    marginHorizontal: 14,
  },
});
