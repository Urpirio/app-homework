/**
 * SkeletonLoader Component
 *
 * Renders animated placeholder blocks for loading states.
 * Supports list-item, card, and detail layout variants.
 *
 * Validates: Requirements 4.7, 10.5
 */

import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';

import { useTheme } from '../../hooks/useTheme';

export type SkeletonVariant = 'list-item' | 'card' | 'detail';

export interface SkeletonLoaderProps {
  /** Number of skeleton rows to render */
  rows?: number;
  /** Layout variant */
  variant?: SkeletonVariant;
  /** Additional container styles */
  style?: ViewStyle;
}

function SkeletonBlock({ style }: { style?: ViewStyle }) {
  const { theme } = useTheme();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        { backgroundColor: theme.colors.border, opacity, borderRadius: theme.borderRadius.sm },
        style,
      ]}
    />
  );
}

function ListItemSkeleton() {
  const { theme } = useTheme();
  return (
    <View style={[styles.listItem, { borderBottomColor: theme.colors.border }]}>
      <SkeletonBlock style={styles.avatar} />
      <View style={styles.listItemContent}>
        <SkeletonBlock style={styles.titleLine} />
        <SkeletonBlock style={styles.subtitleLine} />
      </View>
    </View>
  );
}

function CardSkeleton() {
  const { theme } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
      <SkeletonBlock style={styles.cardImage} />
      <View style={styles.cardBody}>
        <SkeletonBlock style={styles.titleLine} />
        <SkeletonBlock style={styles.subtitleLine} />
      </View>
    </View>
  );
}

function DetailSkeleton() {
  return (
    <View style={styles.detail}>
      <SkeletonBlock style={styles.detailHeader} />
      <SkeletonBlock style={styles.detailLine} />
      <SkeletonBlock style={styles.detailLine} />
      <SkeletonBlock style={styles.detailLineShort} />
    </View>
  );
}

export function SkeletonLoader({ rows = 3, variant = 'list-item', style }: SkeletonLoaderProps) {
  const items = Array.from({ length: rows }, (_, i) => i);

  const renderRow = () => {
    switch (variant) {
      case 'card':
        return <CardSkeleton />;
      case 'detail':
        return <DetailSkeleton />;
      case 'list-item':
      default:
        return <ListItemSkeleton />;
    }
  };

  return (
    <View style={[styles.container, style]} accessibilityRole="none" accessibilityLabel="Loading content">
      {items.map((i) => (
        <View key={i}>{renderRow()}</View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  // List item variant
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  listItemContent: {
    flex: 1,
    marginLeft: 12,
    gap: 8,
  },
  titleLine: {
    height: 14,
    width: '70%',
    borderRadius: 4,
  },
  subtitleLine: {
    height: 10,
    width: '50%',
    borderRadius: 4,
  },
  // Card variant
  card: {
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 12,
    overflow: 'hidden',
  },
  cardImage: {
    height: 120,
    width: '100%',
    borderRadius: 0,
  },
  cardBody: {
    padding: 12,
    gap: 8,
  },
  // Detail variant
  detail: {
    paddingVertical: 12,
    gap: 12,
  },
  detailHeader: {
    height: 24,
    width: '60%',
    borderRadius: 4,
  },
  detailLine: {
    height: 12,
    width: '100%',
    borderRadius: 4,
  },
  detailLineShort: {
    height: 12,
    width: '40%',
    borderRadius: 4,
  },
});
