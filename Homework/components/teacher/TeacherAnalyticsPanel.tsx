/**
 * TeacherAnalyticsPanel
 *
 * Teacher-specific analytics with subject selector, grade distribution bar chart,
 * progress trend line chart, and subject comparison horizontal bar chart.
 * Reuses chart patterns from the admin AnalyticsPanel.
 *
 * Validates: Requirements 3.12, 3.13
 * Design: Analytics & Visualization Design — Teacher Analytics Panel
 */

import { useTheme } from '@/hooks/useTheme';
import React, { useMemo, useState } from 'react';
import {
    Dimensions,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { BarChart, LineChart } from 'react-native-chart-kit';

const SCREEN_WIDTH = Dimensions.get('window').width;

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SubjectOption {
  id: string;
  name: string;
}

export interface TeacherAnalyticsData {
  gradeDistribution: { labels: string[]; data: number[] };
  progressTrend: { labels: string[]; submissions: number[]; avgGrades: number[] };
  subjectComparison: { labels: string[]; data: number[] };
}

export interface TeacherAnalyticsPanelProps {
  subjects: SubjectOption[];
  data?: TeacherAnalyticsData;
  onSubjectChange?: (subjectId: string | null) => void;
}

// ─── Placeholder data ────────────────────────────────────────────────────────

const PLACEHOLDER_DATA: TeacherAnalyticsData = {
  gradeDistribution: {
    labels: ['0-20', '21-40', '41-60', '61-80', '81-100'],
    data: [2, 5, 15, 28, 12],
  },
  progressTrend: {
    labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6'],
    submissions: [8, 12, 10, 15, 14, 18],
    avgGrades: [65, 70, 68, 75, 72, 78],
  },
  subjectComparison: {
    labels: ['Matemáticas', 'Ciencias', 'Historia'],
    data: [75, 82, 68],
  },
};

// ─── SubjectSelector ─────────────────────────────────────────────────────────

function SubjectSelector({
  subjects,
  selected,
  onSelect,
}: {
  subjects: SubjectOption[];
  selected: string | null;
  onSelect: (id: string | null) => void;
}) {
  const { theme } = useTheme();

  const options = [{ id: null as string | null, name: 'Todas' }, ...subjects];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.selectorRow}
      contentContainerStyle={styles.selectorContent}
    >
      {options.map((opt) => {
        const isActive = selected === opt.id;
        return (
          <Pressable
            key={opt.id ?? 'all'}
            onPress={() => onSelect(opt.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={`Materia: ${opt.name}`}
            style={[
              styles.selectorChip,
              {
                backgroundColor: isActive
                  ? theme.colors.primary
                  : theme.colors.card,
                borderColor: isActive
                  ? theme.colors.primary
                  : theme.colors.border + '50',
              },
            ]}
          >
            <Text
              style={[
                styles.selectorChipText,
                { color: isActive ? '#FFFFFF' : theme.colors.textSecondary },
              ]}
            >
              {opt.name}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

// ─── Chart config helper ─────────────────────────────────────────────────────

function useChartConfig() {
  const { theme, isDark } = useTheme();

  return useMemo(
    () => ({
      backgroundColor: theme.colors.card,
      backgroundGradientFrom: theme.colors.card,
      backgroundGradientTo: theme.colors.card,
      decimalCount: 0,
      color: (opacity = 1) =>
        isDark
          ? `rgba(10, 132, 255, ${opacity})`
          : `rgba(0, 122, 255, ${opacity})`,
      labelColor: () => theme.colors.textSecondary,
      propsForBackgroundLines: { stroke: theme.colors.border + '30' },
      propsForLabels: { fontSize: 10 },
      style: { borderRadius: 16 },
    }),
    [theme, isDark],
  );
}

// ─── GradeDistributionChart ──────────────────────────────────────────────────

function GradeDistributionChart({
  labels,
  data,
}: {
  labels: string[];
  data: number[];
}) {
  const { theme } = useTheme();
  const chartConfig = useChartConfig();
  const chartWidth = SCREEN_WIDTH - 48;

  return (
    <View
      style={[
        styles.chartCard,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border + '50',
        },
      ]}
    >
      <Text style={[styles.chartTitle, { color: theme.colors.text }]}>
        Distribución de Calificaciones
      </Text>
      <BarChart
        data={{ labels, datasets: [{ data }] }}
        width={chartWidth}
        height={200}
        chartConfig={{
          ...chartConfig,
          color: (opacity = 1) => `rgba(88, 86, 214, ${opacity})`,
        }}
        style={styles.chart}
        fromZero
        showValuesOnTopOfBars
        yAxisLabel=""
        yAxisSuffix=""
      />
    </View>
  );
}

// ─── ProgressTrendChart ──────────────────────────────────────────────────────

function ProgressTrendChart({
  labels,
  avgGrades,
}: {
  labels: string[];
  submissions: number[];
  avgGrades: number[];
}) {
  const { theme } = useTheme();
  const chartConfig = useChartConfig();
  const chartWidth = SCREEN_WIDTH - 48;

  return (
    <View
      style={[
        styles.chartCard,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border + '50',
        },
      ]}
    >
      <Text style={[styles.chartTitle, { color: theme.colors.text }]}>
        Tendencia de Progreso
      </Text>
      <LineChart
        data={{
          labels,
          datasets: [{ data: avgGrades, strokeWidth: 2 }],
        }}
        width={chartWidth}
        height={200}
        chartConfig={chartConfig}
        bezier
        style={styles.chart}
        withInnerLines={false}
        withOuterLines={false}
        fromZero
      />
    </View>
  );
}

// ─── SubjectComparisonChart ──────────────────────────────────────────────────

function SubjectComparisonChart({
  labels,
  data,
}: {
  labels: string[];
  data: number[];
}) {
  const { theme } = useTheme();
  const chartConfig = useChartConfig();
  const chartWidth = SCREEN_WIDTH - 48;

  return (
    <View
      style={[
        styles.chartCard,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border + '50',
        },
      ]}
    >
      <Text style={[styles.chartTitle, { color: theme.colors.text }]}>
        Comparación por Materia
      </Text>
      <BarChart
        data={{ labels, datasets: [{ data }] }}
        width={chartWidth}
        height={200}
        chartConfig={{
          ...chartConfig,
          color: (opacity = 1) => `rgba(50, 215, 75, ${opacity})`,
        }}
        style={styles.chart}
        fromZero
        showValuesOnTopOfBars
        yAxisLabel=""
        yAxisSuffix=""
      />
    </View>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function TeacherAnalyticsPanel({
  subjects,
  data,
  onSubjectChange,
}: TeacherAnalyticsPanelProps) {
  const { theme } = useTheme();
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  const analytics = data ?? PLACEHOLDER_DATA;

  const handleSubjectChange = (id: string | null) => {
    setSelectedSubject(id);
    onSubjectChange?.(id);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.panelTitle, { color: theme.colors.text }]}>
        Analíticas
      </Text>
      <Text style={[styles.panelSubtitle, { color: theme.colors.textSecondary }]}>
        Rendimiento y progreso de tus materias
      </Text>

      <SubjectSelector
        subjects={subjects}
        selected={selectedSubject}
        onSelect={handleSubjectChange}
      />

      <GradeDistributionChart
        labels={analytics.gradeDistribution.labels}
        data={analytics.gradeDistribution.data}
      />

      <ProgressTrendChart
        labels={analytics.progressTrend.labels}
        submissions={analytics.progressTrend.submissions}
        avgGrades={analytics.progressTrend.avgGrades}
      />

      <SubjectComparisonChart
        labels={analytics.subjectComparison.labels}
        data={analytics.subjectComparison.data}
      />
    </ScrollView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  panelTitle: { fontSize: 28, fontWeight: '800' },
  panelSubtitle: { fontSize: 14, marginTop: 4, marginBottom: 16 },

  selectorRow: { marginBottom: 20 },
  selectorContent: { gap: 8 },
  selectorChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  selectorChipText: { fontSize: 13, fontWeight: '600' },

  chartCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  chartTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  chart: { borderRadius: 16, marginLeft: -16 },
});

export default TeacherAnalyticsPanel;
