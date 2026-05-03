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
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '@/utils/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function UserReviewsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, [id]);

  const fetchReviews = async () => {
    try {
      const res = await api.get(`/users/${id}/reviews`);
      setReviews(res.data);
    } catch (error) {
      // Mock data
      setReviews([
        { id: 'r1', user: 'Elena Piri', rating: 5, comment: 'Excelente atención, resolvió mi problema de acceso en minutos. Muy amable.', date: 'Hoy' },
        { id: 'r2', user: 'Marcos Soto', rating: 4, comment: 'Buen soporte, aunque tardó un poco en responder al inicio.', date: 'Ayer' },
        { id: 'r3', user: 'Ana Martínez', rating: 5, comment: 'Muy profesional y paciente explicando los pasos a seguir.', date: '22 May' },
        { id: 'r4', user: 'Carlos Rodríguez', rating: 5, comment: 'Atención impecable. 10/10.', date: '20 May' },
        { id: 'r5', user: 'Roberto Gómez', rating: 4, comment: 'Satisfecho con la solución brindada.', date: '18 May' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons 
            key={star} 
            name={star <= rating ? "star" : "star-outline"} 
            size={16} 
            color="#FFCC00" 
          />
        ))}
      </View>
    );
  };

  const renderReview = ({ item }: { item: any }) => (
    <Pressable 
      onPress={() => router.push(`/admin/user/${id}/review/${item.id}`)}
      style={({ pressed }) => [
        styles.reviewCard, 
        { 
          backgroundColor: theme.colors.card, 
          borderWidth: 1, 
          borderColor: theme.colors.border + '30',
          opacity: pressed ? 0.8 : 1
        }
      ]}
    >
      <View style={styles.reviewHeader}>
        <View style={[styles.userAvatar, { backgroundColor: theme.colors.primaryLight }]}>
          <Text style={[styles.avatarText, { color: theme.colors.primary }]}>{item.user.charAt(0)}</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: theme.colors.text }]}>{item.user}</Text>
          <Text style={[styles.reviewDate, { color: theme.colors.textSecondary }]}>{item.date}</Text>
        </View>
        {renderStars(item.rating)}
      </View>
      <Text style={[styles.comment, { color: theme.colors.textSecondary }]}>{item.comment}</Text>
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
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Reseñas del Servicio</Text>
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <FlatList
            data={reviews}
            renderItem={renderReview}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <View style={[styles.summaryCard, { backgroundColor: theme.colors.primary + '10' }]}>
                <Text style={[styles.summaryValue, { color: theme.colors.primary }]}>4.8</Text>
                <View style={styles.summaryInfo}>
                  <Text style={[styles.summaryTitle, { color: theme.colors.text }]}>Calificación Promedio</Text>
                  {renderStars(5)}
                  <Text style={[styles.summaryCount, { color: theme.colors.textSecondary }]}>Basado en {reviews.length} reseñas</Text>
                </View>
              </View>
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="star-outline" size={64} color={theme.colors.border} />
                <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>Aún no hay reseñas disponibles.</Text>
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
  list: { padding: 20, paddingBottom: 40 },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    borderRadius: 28,
    marginBottom: 24,
  },
  summaryValue: {
    fontSize: 48,
    fontWeight: '900',
    marginRight: 20,
  },
  summaryInfo: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  summaryCount: {
    fontSize: 12,
    marginTop: 4,
  },
  reviewCard: {
    padding: 16,
    borderRadius: 24,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
  },
  reviewDate: {
    fontSize: 11,
    marginTop: 1,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  comment: {
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
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
