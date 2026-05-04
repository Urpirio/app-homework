/**
 * User Reviews Screen
 *
 * Displays a user's service reviews with average rating summary.
 * Uses React Query hooks instead of mock data.
 *
 * Validates: Requirements 15.13, 15.14
 */

import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { EmptyState, ErrorState, SkeletonLoader } from '@/components/shared';
import { ThemedView } from '@/components/shared/ThemedView';
import { useTechnicianReviews, useTechnicianStats } from '@/hooks/api/useReviews';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import {
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function UserReviewsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useTheme();

  const {
    data: reviews,
    isLoading: reviewsLoading,
    isError: reviewsError,
    error: reviewsErr,
    refetch: refetchReviews,
  } = useTechnicianReviews(id!);

  const { data: stats } = useTechnicianStats(id!);

  const isLoading = reviewsLoading;
  const isError = reviewsError;

  const renderStars = (rating: number) => (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Ionicons
          key={star}
          name={star <= rating ? 'star' : 'star-outline'}
          size={16}
          color="#FFCC00"
        />
      ))}
    </View>
  );

  const renderReview = ({ item }: { item: any }) => (
    <Pressable
      onPress={() => router.push(`/admin/user/${id}/review/${item.id}`)}
      style={({ pressed }) => [
        styles.reviewCard,
        {
          backgroundColor: theme.colors.card,
          borderWidth: 1,
          borderColor: theme.colors.border + '30',
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <View style={styles.reviewHeader}>
        <View style={[styles.userAvatar, { backgroundColor: theme.colors.primaryLight }]}>
          <Text style={[styles.avatarText, { color: theme.colors.primary }]}>
            {(item.userId || '?').charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: theme.colors.text }]}>
            {item.userId?.slice(0, 8) || 'Usuario'}
          </Text>
          <Text style={[styles.reviewDate, { color: theme.colors.textSecondary }]}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
        {renderStars(item.rating)}
      </View>
      {item.comment && (
        <Text style={[styles.comment, { color: theme.colors.textSecondary }]}>
          {item.comment}
        </Text>
      )}
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
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Reseñas del Servicio
          </Text>
        </View>

        {isLoading ? (
          <View style={{ padding: 20 }}>
            <SkeletonLoader rows={5} variant="list-item" />
          </View>
        ) : isError ? (
          <ErrorState error={reviewsErr as any} onRetry={() => refetchReviews()} />
        ) : (
          <FlatList
            data={reviews ?? []}
            renderItem={renderReview}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              stats ? (
                <View
                  style={[styles.summaryCard, { backgroundColor: theme.colors.primary + '10' }]}
                >
                  <Text style={[styles.summaryValue, { color: theme.colors.primary }]}>
                    {stats.averageRating.toFixed(1)}
                  </Text>
                  <View style={styles.summaryInfo}>
                    <Text style={[styles.summaryTitle, { color: theme.colors.text }]}>
                      Calificación Promedio
                    </Text>
                    {renderStars(Math.round(stats.averageRating))}
                    <Text
                      style={[styles.summaryCount, { color: theme.colors.textSecondary }]}
                    >
                      Basado en {stats.totalReviews} reseñas
                    </Text>
                  </View>
                </View>
              ) : null
            }
            ListEmptyComponent={
              <EmptyState
                icon="star-outline"
                title="Sin reseñas"
                message="Aún no hay reseñas disponibles."
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
  list: { padding: 20, paddingBottom: 40 },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    borderRadius: 28,
    marginBottom: 24,
  },
  summaryValue: { fontSize: 48, fontWeight: '900', marginRight: 20 },
  summaryInfo: { flex: 1 },
  summaryTitle: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  summaryCount: { fontSize: 12, marginTop: 4 },
  reviewCard: { padding: 16, borderRadius: 24, marginBottom: 12 },
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
  avatarText: { fontSize: 18, fontWeight: '700' },
  userInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: '700' },
  reviewDate: { fontSize: 11, marginTop: 1 },
  starsRow: { flexDirection: 'row', gap: 2 },
  comment: { fontSize: 14, lineHeight: 20, fontStyle: 'italic' },
});
