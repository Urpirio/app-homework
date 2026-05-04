/**
 * Admin Analytics Screen
 *
 * Renders the AnalyticsPanel component within a safe-area layout
 * with a back-navigation header.
 *
 * Validates: Requirements 14.6, 14.7
 */

import { AnalyticsPanel, DateRangePreset } from '@/components/admin/AnalyticsPanel';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AdminAnalyticsScreen() {
  const { theme } = useTheme();

  const handleDateRangeChange = useCallback((preset: DateRangePreset) => {
    // Future: fetch analytics data scoped to the selected date range
    // e.g. queryClient.invalidateQueries({ queryKey: ['analytics', preset] })
  }, []);

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
      <AnalyticsPanel onDateRangeChange={handleDateRangeChange} />
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
