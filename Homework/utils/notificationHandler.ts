/**
 * Background Notification Handler
 *
 * Handles notification taps received via expo-notifications when the app
 * is in the background or was killed. Routes the user to the appropriate
 * screen using getDeepLinkRoute().
 *
 * Validates: Requirements 5.7
 */

import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';

import {
    getDeepLinkRoute,
    type NotificationPayload,
} from './notificationRouter';

/**
 * Configure how notifications are presented when the app is in the foreground.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Extract a NotificationPayload from an expo-notifications response.
 * The payload data may come from the notification content's `data` field.
 */
function extractPayload(
  response: Notifications.NotificationResponse
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
  response: Notifications.NotificationResponse
): void {
  const payload = extractPayload(response);
  if (!payload) {
    router.push('/notifications');
    return;
  }

  const route = getDeepLinkRoute(payload);
  router.push(route as never);
}

let responseSubscription: Notifications.Subscription | null = null;

/**
 * Set up the listener for notification taps (background + killed state).
 * Call this once at app startup (e.g., in the root layout).
 */
export function setupNotificationResponseListener(): void {
  // Clean up any existing subscription
  if (responseSubscription) {
    responseSubscription.remove();
  }

  responseSubscription =
    Notifications.addNotificationResponseReceivedListener(handleNotificationTap);
}

/**
 * Check if the app was opened from a notification tap (cold start).
 * Should be called once after the app mounts.
 */
export async function handleInitialNotification(): Promise<void> {
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
