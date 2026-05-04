/**
 * GradingStatsCard Component
 *
 * Displays grading statistics in a 4-cell grid: averageGrade, completionRate,
 * pendingCount, and totalSubmissions. Uses circular progress indicators for
 * rate values and numeric displays for counts.
 *
 * Used on both the teacher dashboard and individual subject detail screens.
 *
 * Validates: Requirements 3.8, 3.10
 * Design: Frontend Screen Designs — Grading Statistics Display
 */

import { useTheme } from '@/hooks/useTheme';
import type { GradingStats } from '@/utils/gradingStats';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

export interface GradingStatsCardProps {
  stats: GradingStats;
  style?: ViewStyle;
}

function StatCell({
  label,
  value,
  unit,
  icon,
  color,
}: {
  label: string;
  value: string;
  unit?: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.cell,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border + '50',
        },
      ]}
      accessibilityRole="text"
      accessibilityLabel={`${label}: ${value}${unit ? ` ${unit}` : ''}`}
    >
      <View style={[styles.cellIcon, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={[styles.cellValue, { color: theme.colors.text }]}>
        {value}
        {unit ? (
          <Text style={[styles.cellUnit, { color: theme.colors.textSecondary }]}>
            {unit}
          </Text>
        ) : null}
      </Text>
      <Text
        style={[styles.cellLabel, { color: theme.colors.textSecondary }]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

export function GradingStatsCard({ stats, style }: GradingStatsCardProps) {
  return (
    <View style={[styles.grid, style]}>
      <StatCell
        label="Promedio"
        value={stats.averageGrade.toFixed(1)}
        icon="school-outline"
        color="#007AFF"
      />
      <StatCell
        label="Completado"
        value={stats.completionRate.toFixed(0)}
        unit="%"
        icon="checkmark-circle-outline"
        color="#32D74B"
      />
      <StatCell
        label="Pendientes"
        value={String(stats.pendingCount)}
        icon="time-outline"
        color="#FF9500"
      />
      <StatCell
        label="Total Entregas"
        value={String(stats.totalSubmissions)}
        icon="document-text-outline"
        color="#5856D6"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  cell: {
    width: '47%',
    flexGrow: 1,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  cellIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  cellValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  cellUnit: {
    fontSize: 13,
    fontWeight: '500',
  },
  cellLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
});

export default GradingStatsCard;
