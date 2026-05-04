/**
 * Ticket Review Screen
 *
 * Review form shown after ticket closure. Allows users to rate
 * the support service with 1-5 stars, comment, and category-specific
 * feedback toggles.
 *
 * Validates: Requirements 15.12, 15.13, 15.14, 15.15
 */

import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { ErrorState, SkeletonLoader } from '@/components/shared';
import { ThemedView } from '@/components/shared/ThemedView';
import { useProfile } from '@/hooks/api/useAuth';
import { useCreateReview } from '@/hooks/api/useReviews';
import { useTicketDetail } from '@/hooks/api/useTickets';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

const FEEDBACK_CATEGORIES = [
  { key: 'responsiveness', label: 'Rapidez de Respuesta', icon: 'timer-outline' as const },
  { key: 'competence', label: 'Competencia Técnica', icon: 'construct-outline' as const },
  { key: 'communication', label: 'Comunicación', icon: 'chatbubbles-outline' as const },
];

export default function TicketReviewScreen() {
  const { ticketId } = useLocalSearchParams<{ ticketId: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const { data: profile } = useProfile();
  const createReview = useCreateReview();

  const {
    data: ticket,
    isLoading,
    isError,
    error,
    refetch,
  } = useTicketDetail(ticketId!);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [feedbackToggles, setFeedbackToggles] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);

  const toggleFeedback = (key: string) => {
    setFeedbackToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      Toast.show({ type: 'error', text1: 'Selecciona una calificación' });
      return;
    }

    setSubmitting(true);
    try {
      // Build comment with feedback toggles
      const feedbackParts: string[] = [];
      if (comment.trim()) feedbackParts.push(comment.trim());

      const selectedFeedback = FEEDBACK_CATEGORIES
        .filter((cat) => feedbackToggles[cat.key])
        .map((cat) => cat.label);
      if (selectedFeedback.length > 0) {
        feedbackParts.push(`Destacado: ${selectedFeedback.join(', ')}`);
      }

      await createReview.mutateAsync({
        rating,
        comment: feedbackParts.join('\n') || undefined,
        ticketId: ticketId!,
      });

      Alert.alert(
        'Gracias por tu reseña',
        'Tu opinión nos ayuda a mejorar el servicio de soporte.',
        [{ text: 'Aceptar', onPress: () => router.back() }]
      );
    } catch {
      Toast.show({ type: 'error', text1: 'Error al enviar reseña' });
    } finally {
      setSubmitting(false);
    }
  };

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
              Evaluar Servicio
            </Text>
          </View>
          <View style={{ padding: 20 }}>
            <SkeletonLoader rows={3} variant="card" />
          </View>
        </ThemedView>
      </SafeAreaView>
    );
  }

  if (isError || !ticket) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <ThemedView style={styles.container}>
          <BackgroundShapes />
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
            </Pressable>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
              Evaluar Servicio
            </Text>
          </View>
          <ErrorState error={error as any} onRetry={() => refetch()} />
        </ThemedView>
      </SafeAreaView>
    );
  }

  // If ticket already has a review, show it
  if (ticket.review) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <ThemedView style={styles.container}>
          <BackgroundShapes />
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
            </Pressable>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
              Reseña Enviada
            </Text>
          </View>
          <View style={styles.alreadyReviewed}>
            <Ionicons name="checkmark-circle" size={64} color="#34C759" />
            <Text style={[styles.alreadyReviewedTitle, { color: theme.colors.text }]}>
              Ya evaluaste este ticket
            </Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name={star <= ticket.review!.rating ? 'star' : 'star-outline'}
                  size={28}
                  color="#FFCC00"
                />
              ))}
            </View>
            {ticket.review.comment && (
              <Text style={[styles.existingComment, { color: theme.colors.textSecondary }]}>
                "{ticket.review.comment}"
              </Text>
            )}
          </View>
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
            Evaluar Servicio
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Ticket Summary */}
          <Animated.View
            entering={FadeInDown.duration(400)}
            style={[styles.ticketSummary, { backgroundColor: theme.colors.card }]}
          >
            <Text style={[styles.ticketSummaryLabel, { color: theme.colors.textSecondary }]}>
              Ticket #{ticketId?.slice(0, 8).toUpperCase()}
            </Text>
            <Text style={[styles.ticketSummaryTitle, { color: theme.colors.text }]}>
              {ticket.title}
            </Text>
          </Animated.View>

          {/* Star Rating */}
          <Animated.View entering={FadeInDown.duration(400).delay(100)}>
            <Text style={[styles.ratingPrompt, { color: theme.colors.text }]}>
              ¿Cómo calificarías el servicio?
            </Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Pressable key={star} onPress={() => setRating(star)} hitSlop={8}>
                  <Ionicons
                    name={star <= rating ? 'star' : 'star-outline'}
                    size={40}
                    color="#FFCC00"
                  />
                </Pressable>
              ))}
            </View>
            {rating > 0 && (
              <Text style={[styles.ratingLabel, { color: theme.colors.textSecondary }]}>
                {rating === 5
                  ? 'Excelente'
                  : rating === 4
                  ? 'Muy Bueno'
                  : rating === 3
                  ? 'Bueno'
                  : rating === 2
                  ? 'Regular'
                  : 'Malo'}
              </Text>
            )}
          </Animated.View>

          {/* Feedback Toggles */}
          <Animated.View entering={FadeInDown.duration(400).delay(200)}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              ¿Qué destacarías? (opcional)
            </Text>
            <View style={styles.feedbackRow}>
              {FEEDBACK_CATEGORIES.map((cat) => {
                const active = feedbackToggles[cat.key];
                return (
                  <Pressable
                    key={cat.key}
                    onPress={() => toggleFeedback(cat.key)}
                    style={[
                      styles.feedbackChip,
                      {
                        backgroundColor: active
                          ? theme.colors.primary + '20'
                          : theme.colors.card,
                        borderColor: active
                          ? theme.colors.primary
                          : theme.colors.border + '40',
                      },
                    ]}
                  >
                    <Ionicons
                      name={cat.icon}
                      size={16}
                      color={active ? theme.colors.primary : theme.colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.feedbackChipText,
                        {
                          color: active ? theme.colors.primary : theme.colors.textSecondary,
                        },
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>

          {/* Comment */}
          <Animated.View entering={FadeInDown.duration(400).delay(300)}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Comentario (opcional)
            </Text>
            <TextInput
              style={[
                styles.commentInput,
                {
                  color: theme.colors.text,
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.border + '40',
                },
              ]}
              placeholder="Cuéntanos más sobre tu experiencia..."
              placeholderTextColor={theme.colors.textSecondary}
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
            />
          </Animated.View>

          {/* Submit */}
          <Animated.View entering={FadeInDown.duration(400).delay(400)}>
            <Pressable
              onPress={handleSubmit}
              disabled={submitting || rating === 0}
              style={({ pressed }) => [
                styles.submitBtn,
                {
                  backgroundColor:
                    submitting || rating === 0 ? theme.colors.border : theme.colors.primary,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Ionicons name="send-outline" size={18} color="#FFF" />
              <Text style={styles.submitBtnText}>
                {submitting ? 'Enviando...' : 'Enviar Reseña'}
              </Text>
            </Pressable>
          </Animated.View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800' },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  ticketSummary: {
    padding: 16,
    borderRadius: 20,
    marginBottom: 24,
  },
  ticketSummaryLabel: { fontSize: 11, fontWeight: '700', marginBottom: 4 },
  ticketSummaryTitle: { fontSize: 16, fontWeight: '700' },
  ratingPrompt: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 16,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  ratingLabel: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
    marginTop: 8,
  },
  feedbackRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  feedbackChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  feedbackChipText: { fontSize: 13, fontWeight: '700' },
  commentInput: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    minHeight: 100,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    marginTop: 24,
    gap: 8,
  },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  alreadyReviewed: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    gap: 16,
  },
  alreadyReviewedTitle: { fontSize: 18, fontWeight: '800' },
  existingComment: { fontSize: 14, fontStyle: 'italic', textAlign: 'center', marginTop: 8 },
});
