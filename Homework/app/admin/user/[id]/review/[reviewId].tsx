/**
 * Review Detail Screen
 *
 * Displays individual review details with associated ticket info.
 * Uses React Query hooks instead of mock data.
 *
 * Validates: Requirements 15.13
 */

import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { ErrorState, SkeletonLoader } from '@/components/shared';
import { ThemedView } from '@/components/shared/ThemedView';
import { useReview } from '@/hooks/api/useReviews';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ReviewDetailScreen() {
  const { id, reviewId } = useLocalSearchParams<{ id: string; reviewId: string }>();
  const router = useRouter();
  const { theme } = useTheme();

  const {
    data: review,
    isLoading,
    isError,
    error,
    refetch,
  } = useReview(reviewId!);

  const renderStars = (rating: number) => (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Ionicons
          key={star}
          name={star <= rating ? 'star' : 'star-outline'}
          size={24}
          color="#FFCC00"
        />
      ))}
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <ThemedView style={styles.container}>
          <BackgroundShapes />
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
            </Pressable>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
              Detalle de Reseña
            </Text>
          </View>
          <View style={{ padding: 20 }}>
            <SkeletonLoader rows={3} variant="detail" />
          </View>
        </ThemedView>
      </SafeAreaView>
    );
  }

  if (isError || !review) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <ThemedView style={styles.container}>
          <BackgroundShapes />
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
            </Pressable>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
              Detalle de Reseña
            </Text>
          </View>
          <ErrorState error={error as any} onRetry={() => refetch()} />
        </ThemedView>
      </SafeAreaView>
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
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Detalle de Reseña
          </Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Review Card */}
          <View
            style={[
              styles.card,
              { backgroundColor: theme.colors.card, borderColor: theme.colors.border + '30' },
            ]}
          >
            {/* Reviewer Info */}
            <View style={styles.userRow}>
              <View style={[styles.avatar, { backgroundColor: theme.colors.primaryLight }]}>
                <Text style={[styles.avatarText, { color: theme.colors.primary }]}>
                  {(review.userId || '?').charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.userName, { color: theme.colors.text }]}>
                  Reseña de usuario
                </Text>
                <Text style={[styles.reviewDate, { color: theme.colors.textSecondary }]}>
                  {new Date(review.createdAt).toLocaleString()}
                </Text>
              </View>
            </View>

            {/* Rating */}
            <View style={styles.ratingSection}>
              {renderStars(review.rating)}
              <Text style={[styles.ratingLabel, { color: theme.colors.text }]}>
                {review.rating}.0 / 5.0
              </Text>
            </View>

            {/* Comment */}
            {review.comment && (
              <Text style={[styles.comment, { color: theme.colors.text }]}>
                "{review.comment}"
              </Text>
            )}
          </View>

          {/* Associated Ticket */}
          {review.ticketId && (
            <>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Ticket Asociado
              </Text>
              <Pressable
                onPress={() =>
                  router.push(`/admin/user/${id}/ticket/${review.ticketId}`)
                }
                style={({ pressed }) => [
                  styles.ticketLink,
                  {
                    backgroundColor: theme.colors.card,
                    borderColor: theme.colors.border + '30',
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <View style={[styles.ticketBadge, { backgroundColor: theme.colors.primary + '15' }]}>
                  <Text style={[styles.ticketBadgeText, { color: theme.colors.primary }]}>
                    #{review.ticketId.slice(0, 8).toUpperCase()}
                  </Text>
                </View>
                <Text style={[styles.ticketLinkText, { color: theme.colors.text }]}>
                  Ver ticket
                </Text>
                <Ionicons name="chevron-forward" size={18} color={theme.colors.border} />
              </Pressable>
            </>
          )}
        </ScrollView>
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
  avatarText: { fontSize: 22, fontWeight: '800' },
  userName: { fontSize: 17, fontWeight: '800' },
  reviewDate: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  ratingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  starsRow: { flexDirection: 'row', gap: 4 },
  ratingLabel: { fontSize: 18, fontWeight: '900' },
  comment: { fontSize: 16, lineHeight: 24, fontStyle: 'italic' },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 16, marginLeft: 4 },
  ticketLink: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
  },
  ticketBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ticketBadgeText: { fontSize: 12, fontWeight: '800' },
  ticketLinkText: { flex: 1, fontSize: 15, fontWeight: '700' },
});
