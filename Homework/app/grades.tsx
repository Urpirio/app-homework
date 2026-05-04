import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import { ThemedView } from '@/components/shared/ThemedView';
import {
    getAcademicPeriods,
    getGpaStatus,
    useGrades,
} from '@/hooks/api/useGrades';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function GradesScreen() {
  const { theme } = useTheme();
  const periods = useMemo(() => getAcademicPeriods(), []);
  const [selectedPeriodIndex, setSelectedPeriodIndex] = useState(0);

  const selectedPeriod = periods[selectedPeriodIndex];

  const {
    data: grades,
    isLoading,
    isError,
    error,
    refetch,
  } = useGrades(selectedPeriod.startDate, selectedPeriod.endDate);

  // Compute GPA from fetched grades
  const gpa = useMemo(() => {
    if (!grades || grades.length === 0) return 0;
    const gradedSubjects = grades.filter((g) => g.grade > 0);
    if (gradedSubjects.length === 0) return 0;
    const sum = gradedSubjects.reduce((acc, g) => acc + g.grade, 0);
    return sum / gradedSubjects.length;
  }, [grades]);

  const gpaFormatted = gpa.toFixed(1);
  const gpaStatus = getGpaStatus(gpa);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ThemedView style={styles.container}>
        <BackgroundShapes />

        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Calificaciones</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* GPA Summary */}
          <Animated.View
            entering={FadeInUp.duration(600)}
            style={[styles.gpaCard, { backgroundColor: theme.colors.primary }]}
          >
            <View style={styles.gpaInfo}>
              <Text style={styles.gpaLabel}>Promedio General</Text>
              <Text style={styles.gpaValue}>
                {isLoading ? '—' : gpaFormatted}
              </Text>
              <Text style={styles.gpaStatus}>
                {isLoading ? 'Cargando...' : gpaStatus}
              </Text>
            </View>
            <View style={styles.gpaBadge}>
              <Ionicons name="school" size={40} color="rgba(255,255,255,0.3)" />
            </View>
          </Animated.View>

          {/* Period Selector */}
          <View style={styles.periodSelector}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.periodList}
            >
              {periods.map((period, index) => (
                <Pressable
                  key={period.label}
                  onPress={() => setSelectedPeriodIndex(index)}
                  style={[
                    styles.periodItem,
                    {
                      backgroundColor:
                        selectedPeriodIndex === index
                          ? theme.colors.primaryLight
                          : theme.colors.card,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.periodText,
                      {
                        color:
                          selectedPeriodIndex === index
                            ? theme.colors.primary
                            : theme.colors.textSecondary,
                      },
                    ]}
                  >
                    {period.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Grades List */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Detalle por Materia
            </Text>

            {isLoading ? (
              <SkeletonLoader rows={4} variant="list-item" />
            ) : isError ? (
              <ErrorState
                error={error}
                onRetry={() => refetch()}
                style={styles.stateContainer}
              />
            ) : !grades || grades.length === 0 ? (
              <EmptyState
                icon="school-outline"
                title="Sin calificaciones"
                message="Aún no hay calificaciones registradas para este periodo."
                style={styles.stateContainer}
              />
            ) : (
              grades.map((item, index) => (
                <Animated.View
                  key={item.id}
                  entering={FadeInDown.delay(index * 100)}
                  style={[styles.gradeCard, { backgroundColor: theme.colors.card }]}
                >
                  <View style={styles.gradeInfo}>
                    <Text style={[styles.subjectName, { color: theme.colors.text }]}>
                      {item.subject}
                    </Text>
                    <Text style={[styles.teacherName, { color: theme.colors.textSecondary }]}>
                      {item.teacher}
                    </Text>
                  </View>
                  <View style={styles.gradeValueContainer}>
                    <Text style={[styles.gradeNum, { color: theme.colors.text }]}>
                      {item.grade}
                    </Text>
                    <View
                      style={[styles.letterBadge, { backgroundColor: theme.colors.primaryLight }]}
                    >
                      <Text style={[styles.letterText, { color: theme.colors.primary }]}>
                        {item.letter}
                      </Text>
                    </View>
                  </View>
                </Animated.View>
              ))
            )}
          </View>

          {/* Official Documents Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Documentos Oficiales
            </Text>
            <Pressable style={[styles.pdfCard, { backgroundColor: theme.colors.card }]}>
              <View style={[styles.pdfIcon, { backgroundColor: '#FF3B3015' }]}>
                <Ionicons name="document-text" size={24} color="#FF3B30" />
              </View>
              <View style={styles.pdfInfo}>
                <Text style={[styles.pdfTitle, { color: theme.colors.text }]}>
                  Boleta de Calificaciones - {selectedPeriod.label}
                </Text>
                <Text style={[styles.pdfMeta, { color: theme.colors.textSecondary }]}>
                  PDF • Disponible próximamente
                </Text>
              </View>
              <Ionicons name="download-outline" size={20} color={theme.colors.textSecondary} />
            </Pressable>
          </View>

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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800' },
  scrollContent: { padding: 20 },
  gpaCard: {
    borderRadius: 30,
    padding: 25,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  gpaInfo: { flex: 1 },
  gpaLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  gpaValue: { color: '#FFF', fontSize: 42, fontWeight: '900', marginBottom: 4 },
  gpaStatus: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    opacity: 0.9,
  },
  gpaBadge: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  periodSelector: { marginBottom: 25 },
  periodList: { gap: 10 },
  periodItem: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 15 },
  periodText: { fontSize: 13, fontWeight: '700' },
  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 15, marginLeft: 5 },
  stateContainer: { minHeight: 200 },
  gradeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderRadius: 24,
    marginBottom: 10,
  },
  gradeInfo: { flex: 1 },
  subjectName: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  teacherName: { fontSize: 12, fontWeight: '500' },
  gradeValueContainer: { alignItems: 'flex-end', gap: 4 },
  gradeNum: { fontSize: 20, fontWeight: '900' },
  letterBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  letterText: { fontSize: 12, fontWeight: '800' },
  pdfCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 24,
  },
  pdfIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pdfInfo: { flex: 1, marginLeft: 15 },
  pdfTitle: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  pdfMeta: { fontSize: 11, fontWeight: '500' },
});
