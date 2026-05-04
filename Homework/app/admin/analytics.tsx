/**
 * Admin Analytics Screen
 *
 * Renders the AnalyticsPanel component within a safe-area layout
 * with a back-navigation header.
 *
 * Validates: Requirements 14.6, 14.7
 */

import { AnalyticsPanel, DateRangePreset } from '@/components/admin/AnalyticsPanel';
import { useInstitutionStats } from '@/hooks/api/useInstitutions';
import { useInstitution } from '@/hooks/useInstitution';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AdminAnalyticsScreen() {
  const { theme } = useTheme();
  const { institutionId } = useInstitution();
  
  const { data: stats, isLoading } = useInstitutionStats(institutionId || '');

  const handleDateRangeChange = useCallback((preset: DateRangePreset) => {
    // Future: fetch analytics data scoped to the selected date range
  }, []);

  const analyticsData = useMemo(() => {
    if (!stats) return undefined;
    
    // Convert stats to the format expected by AnalyticsPanel if needed
    // or just let AnalyticsPanel handle the data if it's already compatible.
    // For now, we'll pass a partial data object to stimulate real data visualization
    return {
      overview: [
        { label: 'Estudiantes', value: stats.students, change: 5, icon: 'people' as const, color: '#007AFF' },
        { label: 'Maestros', value: stats.teachers, change: 0, icon: 'school' as const, color: '#5856D6' },
        { label: 'Promedio', value: stats.avgGrade.toFixed(1), change: 1.2, icon: 'trending-up' as const, color: '#34C759' },
      ]
    };
  }, [stats]);

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Volver"
        >
          <Ionicons
            name="chevron-back"
            size={24}
            color={theme.colors.text}
          />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Analíticas
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Analytics content — data=undefined uses placeholder data */}
      <AnalyticsPanel 
        data={analyticsData} 
        isLoading={isLoading}
        onDateRangeChange={handleDateRangeChange} 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 36,
  },
});
