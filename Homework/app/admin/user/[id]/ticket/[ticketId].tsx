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
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '@/utils/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function TicketDetailScreen() {
  const { id, ticketId } = useLocalSearchParams<{ id: string, ticketId: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const [ticket, setTicket] = useState<any>(null);
  const [institutionId, setInstitutionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTicketDetail();
  }, [ticketId]);

  const fetchTicketDetail = async () => {
    try {
      const profileRes = await api.get('/auth/profile');
      setInstitutionId(profileRes.data.institutionId);

      const res = await api.get(`/tickets/${ticketId}`);
      setTicket(res.data);
    } catch (error) {
      // Mock data for development
      setTicket({
        id: ticketId,
        title: 'Error en acceso a plataforma',
        description: 'El usuario reporta que al intentar ingresar sus credenciales, la aplicación se cierra inesperadamente en dispositivos Android 14. Se ha intentado limpiar caché sin éxito.',
        category: 'Soporte Técnico',
        status: 'RESOLVED',
        priority: 'HIGH',
        createdAt: '23 de Mayo, 2024 - 08:30 AM',
        closedAt: '23 de Mayo, 2024 - 10:30 AM',
        resolution: 'Se detectó un conflicto con la librería de autenticación en la versión 14 de Android. Se aplicó un parche de compatibilidad y se reiniciaron las sesiones del usuario.',
        user: {
          id: 'u123',
          name: 'Elena Piri',
          role: 'STUDENT',
          avatar: 'https://i.pravatar.cc/150?u=elena'
        },
        staff: {
          id,
          name: 'Roberto Gómez',
          role: 'Soporte Nivel 2'
        }
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

  const getStatusColor = (status: string) => status === 'RESOLVED' ? '#34C759' : '#FF9500';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ThemedView style={styles.container}>
        <BackgroundShapes />
        
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Detalle del Ticket</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Status and Category Badge */}
          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: getStatusColor(ticket?.status) + '15' }]}>
              <View style={[styles.dot, { backgroundColor: getStatusColor(ticket?.status) }]} />
              <Text style={[styles.badgeText, { color: getStatusColor(ticket?.status) }]}>
                {ticket?.status === 'RESOLVED' ? 'Resuelto' : 'Pendiente'}
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: theme.colors.primary + '15' }]}>
              <Text style={[styles.badgeText, { color: theme.colors.primary }]}>{ticket?.category}</Text>
            </View>
          </View>

          <Text style={[styles.title, { color: theme.colors.text }]}>{ticket?.title}</Text>

          {/* Description Section */}
          <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border + '30' }]}>
            <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>Descripción del Problema</Text>
            <Text style={[styles.description, { color: theme.colors.text }]}>{ticket?.description}</Text>
          </View>

          {/* Resolution Section */}
          <View style={[styles.card, { backgroundColor: '#34C75910', borderColor: '#34C75930' }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="checkmark-done-circle" size={20} color="#34C759" />
              <Text style={[styles.sectionLabel, { color: '#34C759', marginLeft: 8 }]}>Resolución Aplicada</Text>
            </View>
            <Text style={[styles.description, { color: theme.colors.text }]}>{ticket?.resolution}</Text>
          </View>

          {/* Timeline */}
          <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border + '30' }]}>
            <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary, marginBottom: 15 }]}>Cronología</Text>
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, { backgroundColor: theme.colors.primary }]} />
              <View style={styles.timelineContent}>
                <Text style={[styles.timelineLabel, { color: theme.colors.textSecondary }]}>Creado</Text>
                <Text style={[styles.timelineValue, { color: theme.colors.text }]}>{ticket?.createdAt}</Text>
              </View>
            </View>
            <View style={[styles.timelineItem, { marginBottom: 0 }]}>
              <View style={[styles.timelineDot, { backgroundColor: '#34C759' }]} />
              <View style={styles.timelineContent}>
                <Text style={[styles.timelineLabel, { color: theme.colors.textSecondary }]}>Resuelto</Text>
                <Text style={[styles.timelineValue, { color: theme.colors.text }]}>{ticket?.closedAt}</Text>
              </View>
            </View>
          </View>

          {/* Participants */}
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Participantes</Text>
          
          <Pressable 
            style={({ pressed }) => [styles.participantCard, { backgroundColor: theme.colors.card, opacity: pressed ? 0.7 : 1 }]}
            onPress={() => {
              if (ticket?.user?.role === 'STUDENT') {
                router.push(`/admin/institution/${institutionId}/student/${ticket?.user?.id}`);
              } else if (ticket?.user?.role === 'TEACHER') {
                router.push(`/admin/institution/${institutionId}/teacher/${ticket?.user?.id}`);
              }
            }}
          >
            {typeof ticket?.user?.avatar === 'string' && ticket.user.avatar.length > 0 ? (
              <Image source={{ uri: ticket.user.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.primaryLight }]}>
                <Text style={[styles.avatarInitials, { color: theme.colors.primary }]}>
                  {ticket?.user?.name?.charAt(0) || '?'}
                </Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={[styles.participantLabel, { color: theme.colors.textSecondary }]}>Usuario Solicitante</Text>
              <Text style={[styles.participantName, { color: theme.colors.text }]}>{ticket?.user?.name || 'Usuario desconocido'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.border} />
          </Pressable>

          <View style={[styles.participantCard, { backgroundColor: theme.colors.card, marginTop: 12 }]}>
            {typeof ticket?.staff?.avatar === 'string' && ticket.staff.avatar.length > 0 ? (
              <Image source={{ uri: ticket.staff.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.primaryLight }]}>
                <Text style={[styles.avatarInitials, { color: theme.colors.primary }]}>
                  {ticket?.staff?.name?.charAt(0) || '?'}
                </Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={[styles.participantLabel, { color: theme.colors.textSecondary }]}>Técnico Asignado</Text>
              <Text style={[styles.participantName, { color: theme.colors.text }]}>{ticket?.staff?.name || 'Sin asignar'}</Text>
            </View>
          </View>
        </ScrollView>
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
  scrollContent: { padding: 20, paddingBottom: 40 },
  badgeRow: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  badgeText: { fontSize: 12, fontWeight: '800' },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 25 },
  card: { padding: 20, borderRadius: 28, borderWidth: 1, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  sectionLabel: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', marginBottom: 8 },
  description: { fontSize: 15, lineHeight: 22, fontWeight: '500' },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginTop: 20, marginBottom: 15, marginLeft: 4 },
  timelineItem: { flexDirection: 'row', marginBottom: 20 },
  timelineDot: { width: 12, height: 12, borderRadius: 6, marginTop: 4, marginRight: 15 },
  timelineContent: { flex: 1 },
  timelineLabel: { fontSize: 11, fontWeight: '700' },
  timelineValue: { fontSize: 14, fontWeight: '700', marginTop: 2 },
  participantCard: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 22, borderWidth: 1, borderColor: '#00000005' },
  avatar: { width: 44, height: 44, borderRadius: 14, marginRight: 12 },
  avatarPlaceholder: { width: 44, height: 44, borderRadius: 14, marginRight: 12, justifyContent: 'center', alignItems: 'center' },
  avatarInitials: { fontSize: 18, fontWeight: '800' },
  participantLabel: { fontSize: 10, fontWeight: '700' },
  participantName: { fontSize: 15, fontWeight: '700' },
});
