/**
 * AnalyticsPanel
 *
 * Admin analytics dashboard with date range selection, charts (enrollment trend,
 * grade distribution, task completion), and KPI cards.
 *
 * Validates: Requirements 14.6, 14.7
 * Design: Analytics & Visualization Design — Dashboard Layouts
 */

import { useInstitution } from '@/hooks/useInstitution';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
    Dimensions,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { BarChart, LineChart, PieChart } from 'react-native-chart-kit';

const SCREEN_WIDTH = Dimensions.get('window').width;

// ─── Types ───────────────────────────────────────────────────────────────────

export type DateRangePreset = '7d' | '30d' | '90d' | 'custom';

export interface AnalyticsData {
  enrollmentTrend: { labels: string[]; data: number[] };
  gradeDistribution: { labels: string[]; data: number[] };
  taskCompletion: { todo: number; inProgress: number; done: number };
  kpis: {
    avgResponseTime: number; // minutes
    submissionRate: number; // 0-100 percentage
    engagementScore: number; // 0-100 composite
  };
}

export interface AnalyticsPanelProps {
  /** Pre-fetched analytics data. When undefined, placeholder data is shown. */
  data?: AnalyticsData;
  /** Called when the user changes the date range. */
  onDateRangeChange?: (preset: DateRangePreset) => void;
}

// ─── Placeholder data ────────────────────────────────────────────────────────

const PLACEHOLDER_DATA: AnalyticsData = {
  enrollmentTrend: {
    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
    data: [12, 19, 14, 25, 22, 30],
  },
  gradeDistribution: {
    labels: ['0-20', '21-40', '41-60', '61-80', '81-100'],
    data: [3, 8, 22, 35, 18],
  },
  taskCompletion: { todo: 25, inProgress: 40, done: 35 },
  kpis: {
    avgResponseTime: 18,
    submissionRate: 72,
    engagementScore: 65,
  },
};

// ─── DateRangeSelector ───────────────────────────────────────────────────────

const PRESETS: { key: DateRangePreset; label: string }[] = [
  { key: '7d', label: '7 días' },
  { key: '30d', label: '30 días' },
  { key: '90d', label: '90 días' },
  { key: 'custom', label: 'Personalizado' },
];

function DateRangeSelector({
  selected,
  onSelect,
}: {
  selected: DateRangePreset;
  onSelect: (preset: DateRangePreset) => void;
}) {
  const { theme } = useTheme();

  return (
    <View style={styles.dateRangeRow}>
      {PRESETS.map(({ key, label }) => {
        const isActive = selected === key;
        return (
          <Pressable
            key={key}
            onPress={() => onSelect(key)}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={`Rango: ${label}`}
            style={[
              styles.dateRangeChip,
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
                styles.dateRangeChipText,
                { color: isActive ? '#FFFFFF' : theme.colors.textSecondary },
              ]}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── KPI Card ────────────────────────────────────────────────────────────────

function KPICard({
  label,
  value,
  unit,
  icon,
  color,
}: {
  label: string;
  value: number;
  unit: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.kpiCard,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border + '50',
        },
      ]}
      accessibilityRole="text"
      accessibilityLabel={`${label}: ${value} ${unit}`}
    >
      <View style={[styles.kpiIcon, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.kpiValue, { color: theme.colors.text }]}>
        {value}
        <Text style={[styles.kpiUnit, { color: theme.colors.textSecondary }]}>
          {' '}
          {unit}
        </Text>
      </Text>
      <Text style={[styles.kpiLabel, { color: theme.colors.textSecondary }]}>
        {label}
      </Text>
    </View>
  );
}

// ─── Chart helpers ───────────────────────────────────────────────────────────

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
      propsForBackgroundLines: {
        stroke: theme.colors.border + '30',
      },
      propsForLabels: {
        fontSize: 10,
      },
      style: {
        borderRadius: 16,
      },
    }),
    [theme, isDark],
  );
}

// ─── EnrollmentTrendChart ────────────────────────────────────────────────────

function EnrollmentTrendChart({
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
        Tendencia de Inscripciones
      </Text>
      <LineChart
        data={{
          labels,
          datasets: [{ data, strokeWidth: 2 }],
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
        data={{
          labels,
          datasets: [{ data }],
        }}
        width={chartWidth}
        height={200}
        chartConfig={{
          ...chartConfig,
          color: (opacity = 1) =>
            `rgba(88, 86, 214, ${opacity})`,
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

// ─── TaskCompletionChart ─────────────────────────────────────────────────────

const TASK_COLORS = {
  todo: '#FF9500',
  inProgress: '#0A84FF',
  done: '#32D74B',
};

function TaskCompletionChart({
  todo,
  inProgress,
  done,
}: {
  todo: number;
  inProgress: number;
  done: number;
}) {
  const { theme } = useTheme();
  const chartWidth = SCREEN_WIDTH - 48;

  const total = todo + inProgress + done;
  const pct = (v: number) => (total > 0 ? Math.round((v / total) * 100) : 0);

  const pieData = [
    {
      name: 'Pendiente',
      population: todo,
      color: TASK_COLORS.todo,
      legendFontColor: theme.colors.textSecondary,
      legendFontSize: 12,
    },
    {
      name: 'En Progreso',
      population: inProgress,
      color: TASK_COLORS.inProgress,
      legendFontColor: theme.colors.textSecondary,
      legendFontSize: 12,
    },
    {
      name: 'Completado',
      population: done,
      color: TASK_COLORS.done,
      legendFontColor: theme.colors.textSecondary,
      legendFontSize: 12,
    },
  ];

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
        Estado de Tareas
      </Text>
      <PieChart
        data={pieData}
        width={chartWidth}
        height={200}
        chartConfig={{
          color: () => theme.colors.text,
          labelColor: () => theme.colors.textSecondary,
        }}
        accessor="population"
        backgroundColor="transparent"
        paddingLeft="15"
        absolute={false}
      />
      {/* Percentage summary row */}
      <View style={styles.pieStatsRow}>
        <PieStat label="Pendiente" pct={pct(todo)} color={TASK_COLORS.todo} />
        <PieStat
          label="En Progreso"
          pct={pct(inProgress)}
          color={TASK_COLORS.inProgress}
        />
        <PieStat label="Completado" pct={pct(done)} color={TASK_COLORS.done} />
      </View>
    </View>
  );
}

function PieStat({
  label,
  pct,
  color,
}: {
  label: string;
  pct: number;
  color: string;
}) {
  const { theme } = useTheme();
  return (
    <View style={styles.pieStat}>
      <View style={[styles.pieStatDot, { backgroundColor: color }]} />
      <Text style={[styles.pieStatText, { color: theme.colors.textSecondary }]}>
        {label} {pct}%
      </Text>
    </View>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function AnalyticsPanel({
  data,
  onDateRangeChange,
}: AnalyticsPanelProps) {
  const { theme } = useTheme();
  const { institutionId } = useInstitution();
  const [selectedRange, setSelectedRange] = useState<DateRangePreset>('30d');

  const analytics = useMemo(() => {
    if (!data) return PLACEHOLDER_DATA;
    return {
      enrollmentTrend: data.enrollmentTrend ?? PLACEHOLDER_DATA.enrollmentTrend,
      gradeDistribution: data.gradeDistribution ?? PLACEHOLDER_DATA.gradeDistribution,
      taskCompletion: data.taskCompletion ?? PLACEHOLDER_DATA.taskCompletion,
      kpis: {
        ...PLACEHOLDER_DATA.kpis,
        ...(data.kpis || {}),
      },
    };
  }, [data]);

  const handleRangeChange = (preset: DateRangePreset) => {
    setSelectedRange(preset);
    onDateRangeChange?.(preset);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Text style={[styles.panelTitle, { color: theme.colors.text }]}>
        Analíticas
      </Text>
      <Text style={[styles.panelSubtitle, { color: theme.colors.textSecondary }]}>
        Métricas e indicadores institucionales
      </Text>

      {/* Date Range Selector */}
      <DateRangeSelector
        selected={selectedRange}
        onSelect={handleRangeChange}
      />

      {/* KPI Cards */}
      <View style={styles.kpiRow}>
        <KPICard
          label="Tiempo Respuesta"
          value={analytics.kpis.avgResponseTime}
          unit="min"
          icon="time-outline"
          color="#FF9500"
        />
        <KPICard
          label="Tasa de Entregas"
          value={analytics.kpis.submissionRate}
          unit="%"
          icon="document-text-outline"
          color="#0A84FF"
        />
        <KPICard
          label="Engagement"
          value={analytics.kpis.engagementScore}
          unit="/100"
          icon="pulse-outline"
          color="#32D74B"
        />
      </View>

      {/* Charts */}
      <EnrollmentTrendChart
        labels={analytics.enrollmentTrend.labels}
        data={analytics.enrollmentTrend.data}
      />

      <GradeDistributionChart
        labels={analytics.gradeDistribution.labels}
        data={analytics.gradeDistribution.data}
      />

      <TaskCompletionChart
        todo={analytics.taskCompletion.todo}
        inProgress={analytics.taskCompletion.inProgress}
        done={analytics.taskCompletion.done}
      />
    </ScrollView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  panelTitle: {
    fontSize: 28,
    fontWeight: '800',
  },
  panelSubtitle: {
    fontSize: 14,
    marginTop: 4,
    marginBottom: 16,
  },

  // Date range
  dateRangeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  dateRangeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  dateRangeChipText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // KPI
  kpiRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  kpiCard: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  kpiIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  kpiUnit: {
    fontSize: 12,
    fontWeight: '500',
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },

  // Charts
  chartCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  chart: {
    borderRadius: 16,
    marginLeft: -16,
  },

  // Pie stats
  pieStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  pieStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pieStatDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pieStatText: {
    fontSize: 11,
    fontWeight: '600',
  },
});

export default AnalyticsPanel;
