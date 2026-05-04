/**
 * Background Notification Handler
 *
 * Handles notification taps received via expo-notifications when the app
 * is in the background or was killed. Routes the user to the appropriate
 * screen using getDeepLinkRoute().
 *
 * NOTE: expo-notifications remote push is not supported in Expo Go (SDK 53+).
 * All functions are no-ops in that environment to prevent crashes.
 *
 * Validates: Requirements 5.7
 */

import Constants from 'expo-constants';
import { router } from 'expo-router';

import {
    getDeepLinkRoute,
    type NotificationPayload,
} from './notificationRouter';

// Detect if running inside Expo Go (appOwnership === 'expo')
const isExpoGo = Constants.appOwnership === 'expo';

// Lazily import expo-notifications only when not in Expo Go
let Notifications: typeof import('expo-notifications') | null = null;

if (!isExpoGo) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    Notifications = require('expo-notifications');
  } catch {
    // Silently ignore if not available
  }
}

/**
 * Configure how notifications are presented when the app is in the foreground.
 * No-op in Expo Go.
 */
if (Notifications) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/**
 * Extract a NotificationPayload from an expo-notifications response.
 */
function extractPayload(
  response: import('expo-notifications').NotificationResponse
): NotificationPayload | null {
  const data = response.notification.request.content.data as
    | Record<string, unknown>
    | undefined;

  if (!data || typeof data.type !== 'string') {
    return null;
  }

  return {
    type: data.type as NotificationPayload['type'],
    entityId: typeof data.entityId === 'string' ? data.entityId : undefined,
    metadata:
      data.metadata && typeof data.metadata === 'object'
        ? (data.metadata as Record<string, string>)
        : undefined,
  };
}

/**
 * Handle a notification tap by navigating to the deep link route.
 */
function handleNotificationTap(
  response: import('expo-notifications').NotificationResponse
): void {
  const payload = extractPayload(response);
  if (!payload) {
    router.push('/notifications');
    return;
  }

  const route = getDeepLinkRoute(payload);
  router.push(route as never);
}

let responseSubscription: import('expo-notifications').Subscription | null = null;

/**
 * Set up the listener for notification taps (background + killed state).
 * Call this once at app startup (e.g., in the root layout).
 * No-op in Expo Go.
 */
export function setupNotificationResponseListener(): void {
  if (!Notifications) return;

  if (responseSubscription) {
    responseSubscription.remove();
  }

  responseSubscription =
    Notifications.addNotificationResponseReceivedListener(handleNotificationTap);
}

/**
 * Check if the app was opened from a notification tap (cold start).
 * No-op in Expo Go.
 */
export async function handleInitialNotification(): Promise<void> {
  if (!Notifications) return;

  const response = await Notifications.getLastNotificationResponseAsync();
  if (response) {
    handleNotificationTap(response);
  }
}

/**
 * Remove the notification response listener. Call on cleanup.
 */
export function removeNotificationResponseListener(): void {
  if (responseSubscription) {
    responseSubscription.remove();
    responseSubscription = null;
  }
}
