import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { subscribeToConnectivity } from '../../utils/backgroundSync';
import { getQueueCount } from '../../utils/offlineQueue';

/**
 * OfflineBanner
 *
 * Displays a banner at the top of the screen when the device is offline.
 * Shows the number of pending queued actions so the user knows work will
 * be synced once connectivity is restored.
 *
 * Mount this component near the top of your root layout so it's always visible.
 *
 * **Validates: Requirements 10.3**
 */
export function OfflineBanner() {
  const { theme } = useTheme();
  const [isOffline, setIsOffline] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const unsubscribe = subscribeToConnectivity((isConnected) => {
      setIsOffline(!isConnected);
    });

    return unsubscribe;
  }, []);

  // Refresh the pending count whenever the offline status changes
  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      const count = await getQueueCount();
      if (!cancelled) setPendingCount(count);
    }

    refresh();

    // Poll every 5 seconds while offline to pick up newly queued actions
    const interval = isOffline
      ? setInterval(refresh, 5000)
      : undefined;

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
    };
  }, [isOffline]);

  if (!isOffline) return null;

  return (
    <View
      style={[styles.banner, { backgroundColor: theme.colors.error }]}
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
    >
      <Text style={styles.text}>
        You are offline
        {pendingCount > 0 && ` · ${pendingCount} pending action${pendingCount === 1 ? '' : 's'}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
