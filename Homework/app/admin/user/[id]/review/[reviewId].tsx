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
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '@/utils/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ReviewDetailScreen() {
  const { id, reviewId } = useLocalSearchParams<{ id: string, reviewId: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const [review, setReview] = useState<any>(null);
  const [institutionId, setInstitutionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviewDetail();
  }, [reviewId]);

  const fetchReviewDetail = async () => {
    try {
      const profileRes = await api.get('/auth/profile');
      setInstitutionId(profileRes.data.institutionId);

      const res = await api.get(`/reviews/${reviewId}`);
      setReview(res.data);
    } catch (error) {
      // Mock data for development
      setReview({
        id: reviewId,
        userId: 'mock-user-123',
        user: 'Elena Piri',
        userRole: 'STUDENT',
        rating: 5,
        comment: 'Excelente atención, resolvió mi problema de acceso en minutos. Muy amable y paciente.',
        date: '23 de Mayo, 2024 - 11:45 AM',
        ticket: {
          id: 'TK-8842',
          title: 'Error en acceso a plataforma',
          category: 'Soporte Técnico',
          closedDate: '23 de Mayo, 2024 - 10:30 AM',
          resolution: 'Se resetearon las credenciales y se verificó la conexión del dispositivo.'
        },
        staff: {
          name: 'Roberto Gómez',
          role: 'Soporte Nivel 2'
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Ionicons 
          key={star} 
          name={star <= rating ? "star" : "star-outline"} 
          size={24} 
          color="#FFCC00" 
        />
      ))}
    </View>
  );

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
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Detalle de Reseña</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Review Header Card */}
          <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border + '30' }]}>
            <Pressable 
              style={({ pressed }) => [styles.userRow, { opacity: pressed ? 0.7 : 1 }]}
              onPress={() => {
                if (review?.userRole === 'STUDENT') {
                  router.push(`/admin/institution/${institutionId}/student/${review?.userId}`);
                } else if (review?.userRole === 'TEACHER') {
                  router.push(`/admin/institution/${institutionId}/teacher/${review?.userId}`);
                } else {
                  router.push(`/admin/user/${review?.userId}`);
                }
              }}
            >
              <View style={[styles.avatar, { backgroundColor: theme.colors.primaryLight }]}>
                <Text style={[styles.avatarText, { color: theme.colors.primary }]}>{review?.user.charAt(0)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.userName, { color: theme.colors.text }]}>{review?.user}</Text>
                <Text style={[styles.userRole, { color: theme.colors.textSecondary }]}>{review?.userRole}</Text>
                <Text style={[styles.reviewDate, { color: theme.colors.textSecondary, marginTop: 4 }]}>{review?.date}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.border} />
            </Pressable>
            
            <View style={styles.ratingSection}>
              {renderStars(review?.rating)}
              <Text style={[styles.ratingLabel, { color: theme.colors.text }]}>{review?.rating}.0 / 5.0</Text>
            </View>
            
            <Text style={[styles.comment, { color: theme.colors.text }]}>"{review?.comment}"</Text>
          </View>

          {/* Associated Ticket Section */}
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Ticket Asociado</Text>
          <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border + '30' }]}>
            <View style={styles.ticketHeader}>
              <View style={[styles.ticketBadge, { backgroundColor: theme.colors.primary + '15' }]}>
                <Text style={[styles.ticketBadgeText, { color: theme.colors.primary }]}>{review?.ticket.id}</Text>
              </View>
              <Text style={[styles.ticketCategory, { color: theme.colors.textSecondary }]}>{review?.ticket.category}</Text>
            </View>
            
            <Text style={[styles.ticketTitle, { color: theme.colors.text }]}>{review?.ticket.title}</Text>
            
            <View style={[styles.divider, { backgroundColor: theme.colors.border + '20' }]} />
            
            <View style={styles.ticketDetailRow}>
              <Ionicons name="checkmark-done-circle" size={20} color="#34C759" />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Resolución</Text>
                <Text style={[styles.detailText, { color: theme.colors.text }]}>{review?.ticket.resolution}</Text>
              </View>
            </View>
            
            <View style={[styles.ticketDetailRow, { marginTop: 15 }]}>
              <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Cerrado el</Text>
                <Text style={[styles.detailText, { color: theme.colors.text }]}>{review?.ticket.closedDate}</Text>
              </View>
            </View>
          </View>

          {/* Attended By */}
          <View style={[styles.staffCard, { backgroundColor: theme.colors.primary + '10' }]}>
            <Ionicons name="person-circle-outline" size={24} color={theme.colors.primary} />
            <Text style={[styles.staffText, { color: theme.colors.text }]}>
              Atendido por <Text style={{ fontWeight: '800' }}>{review?.staff.name}</Text> ({review?.staff.role})
            </Text>
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
  card: {
    padding: 20,
    borderRadius: 28,
    borderWidth: 1,
    marginBottom: 24,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#00000005',
    padding: 12,
    borderRadius: 16,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '800',
  },
  userName: {
    fontSize: 17,
    fontWeight: '800',
  },
  userRole: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  reviewDate: {
    fontSize: 10,
    position: 'absolute',
    top: 0,
    right: 0,
  },
  ratingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  ratingLabel: {
    fontSize: 18,
    fontWeight: '900',
  },
  comment: {
    fontSize: 16,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
    marginLeft: 4,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ticketBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ticketBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  ticketCategory: {
    fontSize: 12,
    fontWeight: '600',
  },
  ticketTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
  },
  divider: {
    height: 1,
    marginBottom: 20,
  },
  ticketDetailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  detailText: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
    lineHeight: 20,
  },
  staffCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    gap: 12,
  },
  staffText: {
    fontSize: 13,
    flex: 1,
  },
});
