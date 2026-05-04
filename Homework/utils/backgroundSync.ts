import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { AppState, AppStateStatus } from 'react-native';
import api from './api';
import { getQueueCount, processQueue } from './offlineQueue';

const BACKGROUND_SYNC_TASK = 'BACKGROUND_SYNC_TASK';

/**
 * Runs a single sync cycle:
 * 1. Process the offline queue (if items exist)
 * 2. Prefetch unread notification count
 * 3. Sync notification read status (batched in queue)
 */
export async function runSyncCycle(): Promise<void> {
  try {
    const count = await getQueueCount();
    if (count > 0) {
      await processQueue();
    }
  } catch {
    // Queue processing errors are non-fatal; items stay queued for next cycle
  }

  try {
    // Prefetch notification count — result is discarded here but warms any
    // HTTP-level cache or can be consumed by a listener in the future.
    await api.get('/notifications', {
      params: { unreadOnly: true, limit: 1 },
    });
  } catch {
    // Non-critical; swallow errors silently
  }
}

// ---------------------------------------------------------------------------
// Background fetch task (runs when the OS wakes the app, ~15 min minimum)
// ---------------------------------------------------------------------------

TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
  try {
    await runSyncCycle();
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

/**
 * Registers the background fetch periodic task.
 * Safe to call multiple times — re-registration is a no-op if already registered.
 */
export async function registerBackgroundSync(): Promise<void> {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(
    BACKGROUND_SYNC_TASK
  );
  if (isRegistered) return;

  await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
    minimumInterval: 15 * 60, // 15 minutes (OS may adjust)
    stopOnTerminate: false,
    startOnBoot: true,
  });
}

/**
 * Unregisters the background fetch task.
 */
export async function unregisterBackgroundSync(): Promise<void> {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(
    BACKGROUND_SYNC_TASK
  );
  if (!isRegistered) return;

  await BackgroundFetch.unregisterTaskAsync(BACKGROUND_SYNC_TASK);
}

// ---------------------------------------------------------------------------
// Connectivity listener — triggers sync on reconnection
// ---------------------------------------------------------------------------

let wasOffline = false;

/**
 * Subscribes to NetInfo connectivity changes.
 * When the device transitions from offline → online, a sync cycle runs immediately.
 *
 * @returns An unsubscribe function.
 */
export function subscribeToConnectivity(
  onStatusChange?: (isConnected: boolean) => void
): () => void {
  const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
    const isConnected = state.isConnected ?? false;

    onStatusChange?.(isConnected);

    if (isConnected && wasOffline) {
      // Reconnected — run sync
      runSyncCycle();
    }

    wasOffline = !isConnected;
  });

  return unsubscribe;
}

// ---------------------------------------------------------------------------
// AppState listener — triggers sync on app resume
// ---------------------------------------------------------------------------

/**
 * Subscribes to AppState changes.
 * When the app transitions to 'active' (foreground), a sync cycle runs immediately.
 *
 * @returns An unsubscribe function (remove the listener).
 */
export function subscribeToAppState(): { remove: () => void } {
  const handler = (nextState: AppStateStatus) => {
    if (nextState === 'active') {
      runSyncCycle();
    }
  };

  const subscription = AppState.addEventListener('change', handler);
  return subscription;
}

export { BACKGROUND_SYNC_TASK };
