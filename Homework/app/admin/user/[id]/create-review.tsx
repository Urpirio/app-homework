/**
 * Create User Review Screen
 *
 * Multi-dimensional rating form for general user reviews.
 * Supports role-based templates (student vs teacher),
 * confidentiality settings, and improvement recommendations.
 *
 * Validates: Requirements 16.1, 16.2, 16.3, 16.6, 16.7
 */

import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { ThemedView } from '@/components/shared/ThemedView';
import {
    ALL_TEMPLATES,
    getReviewTemplate,
    type ReviewDimension
} from '@/constants/reviewTemplates';
import { useCreateReview } from '@/hooks/api/useReviews';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
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

type Visibility = 'PUBLIC' | 'CONFIDENTIAL';

export default function CreateUserReviewScreen() {
  const { id: userId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const createReview = useCreateReview();

  // Template selection
  const [selectedTemplateRole, setSelectedTemplateRole] = useState<string>('STUDENT');
  const template = useMemo(
    () => getReviewTemplate(selectedTemplateRole),
    [selectedTemplateRole]
  );

  // Dimension ratings
  const [dimensionRatings, setDimensionRatings] = useState<Record<string, number>>({});

  // Form fields
  const [writtenFeedback, setWrittenFeedback] = useState('');
  const [improvements, setImprovements] = useState('');
  const [goals, setGoals] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('PUBLIC');
  const [submitting, setSubmitting] = useState(false);

  // Computed overall rating
  const overallRating = useMemo(() => {
    const ratings = template.dimensions.map((d) => dimensionRatings[d.key] || 0);
    const filled = ratings.filter((r) => r > 0);
    if (filled.length === 0) return 0;
    return filled.reduce((sum, r) => sum + r, 0) / filled.length;
  }, [dimensionRatings, template]);

  const handleDimensionRating = (key: string, rating: number) => {
    setDimensionRatings((prev) => ({ ...prev, [key]: rating }));
  };

  const handleTemplateChange = (role: string) => {
    setSelectedTemplateRole(role);
    setDimensionRatings({});
  };

  const handleSubmit = async () => {
    // Validate at least one dimension is rated
    const hasRatings = template.dimensions.some((d) => (dimensionRatings[d.key] || 0) > 0);
    if (!hasRatings) {
      Toast.show({ type: 'error', text1: 'Califica al menos una dimensión' });
      return;
    }

    setSubmitting(true);
    try {
      // Build structured comment
      const parts: string[] = [];

      // Dimension ratings
      const dimensionSummary = template.dimensions
        .filter((d) => dimensionRatings[d.key])
        .map((d) => `${d.label}: ${dimensionRatings[d.key]}/5`)
        .join(', ');
      if (dimensionSummary) parts.push(`Dimensiones: ${dimensionSummary}`);

      if (writtenFeedback.trim()) parts.push(`Retroalimentación: ${writtenFeedback.trim()}`);
      if (improvements.trim()) parts.push(`Recomendaciones: ${improvements.trim()}`);
      if (goals.trim()) parts.push(`Metas: ${goals.trim()}`);
      parts.push(`Visibilidad: ${visibility}`);
      parts.push(`Plantilla: ${template.label}`);

      await createReview.mutateAsync({
        rating: Math.round(overallRating),
        comment: parts.join('\n'),
        ticketId: userId!, // Using ticketId field to associate with user
      });

      Alert.alert('Reseña Creada', 'La evaluación ha sido registrada exitosamente.', [
        { text: 'Aceptar', onPress: () => router.back() },
      ]);
    } catch {
      Toast.show({ type: 'error', text1: 'Error al crear reseña' });
    } finally {
      setSubmitting(false);
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
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Crear Evaluación
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Template Selector */}
          <Animated.View entering={FadeInDown.duration(400)}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Tipo de Evaluación</Text>
            <View style={styles.templateRow}>
              {ALL_TEMPLATES.map((t) => {
                const selected = selectedTemplateRole === t.role;
                return (
                  <Pressable
                    key={t.role}
                    onPress={() => handleTemplateChange(t.role)}
                    style={[
                      styles.templateBtn,
                      {
                        backgroundColor: selected ? theme.colors.primary : theme.colors.card,
                        borderColor: selected ? theme.colors.primary : theme.colors.border + '40',
                      },
                    ]}
                  >
                    <Ionicons
                      name={t.role === 'STUDENT' ? 'school-outline' : 'person-outline'}
                      size={18}
                      color={selected ? '#FFF' : theme.colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.templateBtnText,
                        { color: selected ? '#FFF' : theme.colors.textSecondary },
                      ]}
                    >
                      {t.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>

          {/* Rating Dimensions */}
          <Animated.View entering={FadeInDown.duration(400).delay(100)}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Dimensiones</Text>
            {template.dimensions.map((dim) => (
              <DimensionRating
                key={dim.key}
                dimension={dim}
                rating={dimensionRatings[dim.key] || 0}
                onRate={(r) => handleDimensionRating(dim.key, r)}
              />
            ))}
          </Animated.View>

          {/* Overall Rating Display */}
          {overallRating > 0 && (
            <Animated.View entering={FadeInDown.duration(300)}>
              <View
                style={[styles.overallCard, { backgroundColor: theme.colors.primary + '10' }]}
              >
                <Text style={[styles.overallLabel, { color: theme.colors.textSecondary }]}>
                  Calificación General
                </Text>
                <Text style={[styles.overallValue, { color: theme.colors.primary }]}>
                  {overallRating.toFixed(1)}
                </Text>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons
                      key={star}
                      name={star <= Math.round(overallRating) ? 'star' : 'star-outline'}
                      size={20}
                      color="#FFCC00"
                    />
                  ))}
                </View>
              </View>
            </Animated.View>
          )}

          {/* Written Feedback */}
          <Animated.View entering={FadeInDown.duration(400).delay(200)}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Retroalimentación Escrita
            </Text>
            <TextInput
              style={[
                styles.textArea,
                {
                  color: theme.colors.text,
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.border + '40',
                },
              ]}
              placeholder="Escribe tu retroalimentación detallada..."
              placeholderTextColor={theme.colors.textSecondary}
              value={writtenFeedback}
              onChangeText={setWrittenFeedback}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </Animated.View>

          {/* Improvement Recommendations */}
          <Animated.View entering={FadeInDown.duration(400).delay(300)}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Recomendaciones de Mejora
            </Text>
            <TextInput
              style={[
                styles.textArea,
                {
                  color: theme.colors.text,
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.border + '40',
                },
              ]}
              placeholder="Áreas de mejora y sugerencias..."
              placeholderTextColor={theme.colors.textSecondary}
              value={improvements}
              onChangeText={setImprovements}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </Animated.View>

          {/* Goal Setting */}
          <Animated.View entering={FadeInDown.duration(400).delay(350)}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Metas (opcional)
            </Text>
            <TextInput
              style={[
                styles.textArea,
                {
                  color: theme.colors.text,
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.border + '40',
                },
              ]}
              placeholder="Objetivos a alcanzar..."
              placeholderTextColor={theme.colors.textSecondary}
              value={goals}
              onChangeText={setGoals}
              multiline
              numberOfLines={2}
              textAlignVertical="top"
            />
          </Animated.View>

          {/* Visibility Toggle */}
          <Animated.View entering={FadeInDown.duration(400).delay(400)}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Visibilidad</Text>
            <View style={styles.visibilityRow}>
              <Pressable
                onPress={() => setVisibility('PUBLIC')}
                style={[
                  styles.visibilityBtn,
                  {
                    backgroundColor:
                      visibility === 'PUBLIC' ? '#34C75920' : theme.colors.card,
                    borderColor:
                      visibility === 'PUBLIC' ? '#34C759' : theme.colors.border + '40',
                  },
                ]}
              >
                <Ionicons
                  name="eye-outline"
                  size={18}
                  color={visibility === 'PUBLIC' ? '#34C759' : theme.colors.textSecondary}
                />
                <View>
                  <Text
                    style={[
                      styles.visibilityBtnText,
                      {
                        color:
                          visibility === 'PUBLIC' ? '#34C759' : theme.colors.textSecondary,
                      },
                    ]}
                  >
                    Pública
                  </Text>
                  <Text style={[styles.visibilityDesc, { color: theme.colors.textSecondary }]}>
                    Visible para el evaluado
                  </Text>
                </View>
              </Pressable>
              <Pressable
                onPress={() => setVisibility('CONFIDENTIAL')}
                style={[
                  styles.visibilityBtn,
                  {
                    backgroundColor:
                      visibility === 'CONFIDENTIAL' ? '#FF950020' : theme.colors.card,
                    borderColor:
                      visibility === 'CONFIDENTIAL' ? '#FF9500' : theme.colors.border + '40',
                  },
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color={
                    visibility === 'CONFIDENTIAL' ? '#FF9500' : theme.colors.textSecondary
                  }
                />
                <View>
                  <Text
                    style={[
                      styles.visibilityBtnText,
                      {
                        color:
                          visibility === 'CONFIDENTIAL'
                            ? '#FF9500'
                            : theme.colors.textSecondary,
                      },
                    ]}
                  >
                    Confidencial
                  </Text>
                  <Text style={[styles.visibilityDesc, { color: theme.colors.textSecondary }]}>
                    Solo administradores
                  </Text>
                </View>
              </Pressable>
            </View>
          </Animated.View>

          {/* Submit */}
          <Animated.View entering={FadeInDown.duration(400).delay(450)}>
            <Pressable
              onPress={handleSubmit}
              disabled={submitting}
              style={({ pressed }) => [
                styles.submitBtn,
                {
                  backgroundColor: submitting ? theme.colors.border : theme.colors.primary,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Ionicons name="checkmark-circle-outline" size={18} color="#FFF" />
              <Text style={styles.submitBtnText}>
                {submitting ? 'Guardando...' : 'Guardar Evaluación'}
              </Text>
            </Pressable>
          </Animated.View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

function DimensionRating({
  dimension,
  rating,
  onRate,
}: {
  dimension: ReviewDimension;
  rating: number;
  onRate: (rating: number) => void;
}) {
  const { theme } = useTheme();

  return (
    <View style={[styles.dimensionCard, { backgroundColor: theme.colors.card }]}>
      <View style={styles.dimensionHeader}>
        <Text style={[styles.dimensionLabel, { color: theme.colors.text }]}>
          {dimension.label}
        </Text>
        {rating > 0 && (
          <Text style={[styles.dimensionRatingText, { color: theme.colors.primary }]}>
            {rating}/5
          </Text>
        )}
      </View>
      <Text style={[styles.dimensionDesc, { color: theme.colors.textSecondary }]}>
        {dimension.description}
      </Text>
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Pressable key={star} onPress={() => onRate(star)} hitSlop={6}>
            <Ionicons
              name={star <= rating ? 'star' : 'star-outline'}
              size={28}
              color="#FFCC00"
            />
          </Pressable>
        ))}
      </View>
    </View>
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
  label: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
    marginTop: 20,
  },
  templateRow: {
    flexDirection: 'row',
    gap: 10,
  },
  templateBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  templateBtnText: { fontSize: 13, fontWeight: '700' },
  dimensionCard: {
    padding: 16,
    borderRadius: 18,
    marginBottom: 10,
  },
  dimensionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  dimensionLabel: { fontSize: 15, fontWeight: '700' },
  dimensionRatingText: { fontSize: 13, fontWeight: '800' },
  dimensionDesc: { fontSize: 12, marginBottom: 10 },
  starsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  overallCard: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    marginTop: 16,
    gap: 8,
  },
  overallLabel: { fontSize: 12, fontWeight: '700' },
  overallValue: { fontSize: 36, fontWeight: '900' },
  textArea: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    minHeight: 80,
  },
  visibilityRow: {
    flexDirection: 'row',
    gap: 10,
  },
  visibilityBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  visibilityBtnText: { fontSize: 13, fontWeight: '700' },
  visibilityDesc: { fontSize: 10, marginTop: 2 },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    marginTop: 28,
    gap: 8,
  },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
});
