/**
 * Tests for notification deep link routing.
 *
 * Validates: Requirements 5.6
 */

import {
    getDeepLinkRoute,
    type NotificationPayload,
} from '../notificationRouter';

describe('getDeepLinkRoute', () => {
  it('routes TASK to /tasks/{entityId}', () => {
    const payload: NotificationPayload = { type: 'TASK', entityId: 'task-123' };
    expect(getDeepLinkRoute(payload)).toBe('/tasks/task-123');
  });

  it('routes TASK without entityId to /notifications', () => {
    const payload: NotificationPayload = { type: 'TASK' };
    expect(getDeepLinkRoute(payload)).toBe('/notifications');
  });

  it('routes SUBMISSION_GRADED to /tasks/{metadata.taskId}', () => {
    const payload: NotificationPayload = {
      type: 'SUBMISSION_GRADED',
      entityId: 'sub-456',
      metadata: { taskId: 'task-789' },
    };
    expect(getDeepLinkRoute(payload)).toBe('/tasks/task-789');
  });

  it('routes SUBMISSION_GRADED without metadata.taskId to /tasks/{entityId}', () => {
    const payload: NotificationPayload = {
      type: 'SUBMISSION_GRADED',
      entityId: 'sub-456',
    };
    expect(getDeepLinkRoute(payload)).toBe('/tasks/sub-456');
  });

  it('routes PROJECT to /projects/{entityId}', () => {
    const payload: NotificationPayload = {
      type: 'PROJECT',
      entityId: 'proj-001',
    };
    expect(getDeepLinkRoute(payload)).toBe('/projects/proj-001');
  });

  it('routes PROJECT without entityId to /notifications', () => {
    const payload: NotificationPayload = { type: 'PROJECT' };
    expect(getDeepLinkRoute(payload)).toBe('/notifications');
  });

  it('routes ALERT with ticketId to /support/ticket/{ticketId}', () => {
    const payload: NotificationPayload = {
      type: 'ALERT',
      entityId: 'alert-1',
      metadata: { ticketId: 'ticket-42' },
    };
    expect(getDeepLinkRoute(payload)).toBe('/support/ticket/ticket-42');
  });

  it('routes ALERT without ticketId to /notifications', () => {
    const payload: NotificationPayload = {
      type: 'ALERT',
      entityId: 'alert-1',
    };
    expect(getDeepLinkRoute(payload)).toBe('/notifications');
  });

  it('routes COLLABORATOR_REQUEST to /collaborators', () => {
    const payload: NotificationPayload = {
      type: 'COLLABORATOR_REQUEST',
      entityId: 'collab-1',
    };
    expect(getDeepLinkRoute(payload)).toBe('/collaborators');
  });

  it('routes COLLABORATOR_ACCEPTED to /collaborators', () => {
    const payload: NotificationPayload = {
      type: 'COLLABORATOR_ACCEPTED',
      entityId: 'collab-2',
    };
    expect(getDeepLinkRoute(payload)).toBe('/collaborators');
  });

  it('returns /notifications for unknown type', () => {
    const payload = { type: 'UNKNOWN_TYPE' } as unknown as NotificationPayload;
    expect(getDeepLinkRoute(payload)).toBe('/notifications');
  });

  it('always returns a string starting with /', () => {
    const types: NotificationPayload['type'][] = [
      'TASK',
      'SUBMISSION_GRADED',
      'PROJECT',
      'ALERT',
      'COLLABORATOR_REQUEST',
      'COLLABORATOR_ACCEPTED',
    ];

    for (const type of types) {
      const route = getDeepLinkRoute({ type, entityId: 'test-id' });
      expect(route).toMatch(/^\//);
    }
  });
});
