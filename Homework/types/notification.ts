/**
 * Notification Type Definitions
 *
 * Matches the backend Prisma Notification model and API response contracts.
 * Includes NotificationPreferences for the preferences endpoint.
 *
 * Validates: Requirements 4.8, 9.1
 */

export type NotificationType =
  | 'PROJECT'
  | 'TASK'
  | 'ALERT'
  | 'COLLABORATOR_REQUEST'
  | 'COLLABORATOR_ACCEPTED'
  | 'SUBMISSION_GRADED';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  userId: string;
  createdAt: string;
}

export interface NotificationPreferences {
  assignments: boolean;
  grades: boolean;
  messages: boolean;
  system: boolean;
  deadlines: boolean;
  emailNotifications: boolean;
}
