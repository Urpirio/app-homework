/**
 * Notification Deep Link Router
 *
 * Maps notification payloads to screen routes for deep linking.
 * Used when tapping notifications from the list or from system push
 * notifications received while the app is in the background.
 *
 * Validates: Requirements 5.6
 */

import type { NotificationType } from '../types/notification';

export interface NotificationPayload {
  type: NotificationType;
  entityId?: string;
  metadata?: Record<string, string>;
}

/**
 * Resolve a notification payload to the appropriate in-app route.
 *
 * Routing rules:
 * - TASK → /tasks/{entityId}
 * - SUBMISSION_GRADED → /tasks/{metadata.taskId || entityId}
 * - PROJECT → /projects/{entityId}
 * - ALERT (with metadata.ticketId) → /support/ticket/{metadata.ticketId}
 * - ALERT (without ticketId) → /notifications
 * - COLLABORATOR_REQUEST → /collaborators
 * - COLLABORATOR_ACCEPTED → /collaborators
 * - Default → /notifications
 */
export function getDeepLinkRoute(payload: NotificationPayload): string {
  switch (payload.type) {
    case 'TASK':
      return payload.entityId ? `/tasks/${payload.entityId}` : '/notifications';

    case 'SUBMISSION_GRADED':
      return `/tasks/${payload.metadata?.taskId || payload.entityId || ''}`;

    case 'PROJECT':
      return payload.entityId
        ? `/projects/${payload.entityId}`
        : '/notifications';

    case 'ALERT':
      return payload.metadata?.ticketId
        ? `/support/ticket/${payload.metadata.ticketId}`
        : '/notifications';

    case 'COLLABORATOR_REQUEST':
    case 'COLLABORATOR_ACCEPTED':
      return '/collaborators';

    default:
      return '/notifications';
  }
}
