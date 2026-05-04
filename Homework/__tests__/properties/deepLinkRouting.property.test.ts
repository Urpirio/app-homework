// Feature: homework-app-integration, Property 13: Notification deep link routing resolves to valid screen paths
/**
 * Property 13: Notification deep link routing resolves to valid screen paths
 *
 * For any notification with a valid type and entityId, the getDeepLinkRoute
 * function should return a non-empty string starting with '/' that corresponds
 * to an existing route in the application.
 *
 * **Validates: Requirements 5.6**
 */

import type { NotificationType } from '@/types/notification';
import {
    getDeepLinkRoute,
    NotificationPayload,
} from '@/utils/notificationRouter';
import * as fc from 'fast-check';

const notificationTypes: NotificationType[] = [
  'TASK',
  'SUBMISSION_GRADED',
  'PROJECT',
  'ALERT',
  'COLLABORATOR_REQUEST',
  'COLLABORATOR_ACCEPTED',
];

const entityIdArb = fc.uuid();

const metadataArb = fc.oneof(
  fc.constant(undefined),
  fc.record({
    taskId: fc.uuid(),
    ticketId: fc.uuid(),
  }).map((r) => r as Record<string, string>)
);

describe('Property 13: Notification deep link routing resolves to valid screen paths', () => {
  it('always returns a string starting with "/" for any valid notification type and entityId', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...notificationTypes),
        entityIdArb,
        metadataArb,
        (type, entityId, metadata) => {
          const payload: NotificationPayload = { type, entityId, metadata };
          const route = getDeepLinkRoute(payload);

          expect(typeof route).toBe('string');
          expect(route.length).toBeGreaterThan(0);
          expect(route.startsWith('/')).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('routes TASK notifications to /tasks/{entityId}', () => {
    fc.assert(
      fc.property(entityIdArb, (entityId) => {
        const route = getDeepLinkRoute({ type: 'TASK', entityId });
        expect(route).toBe(`/tasks/${entityId}`);
      }),
      { numRuns: 100 }
    );
  });

  it('routes PROJECT notifications to /projects/{entityId}', () => {
    fc.assert(
      fc.property(entityIdArb, (entityId) => {
        const route = getDeepLinkRoute({ type: 'PROJECT', entityId });
        expect(route).toBe(`/projects/${entityId}`);
      }),
      { numRuns: 100 }
    );
  });

  it('routes SUBMISSION_GRADED to /tasks/{metadata.taskId} when metadata.taskId exists', () => {
    fc.assert(
      fc.property(entityIdArb, fc.uuid(), (entityId, taskId) => {
        const route = getDeepLinkRoute({
          type: 'SUBMISSION_GRADED',
          entityId,
          metadata: { taskId },
        });
        expect(route).toBe(`/tasks/${taskId}`);
      }),
      { numRuns: 100 }
    );
  });

  it('routes ALERT with ticketId to /support/ticket/{ticketId}', () => {
    fc.assert(
      fc.property(entityIdArb, fc.uuid(), (entityId, ticketId) => {
        const route = getDeepLinkRoute({
          type: 'ALERT',
          entityId,
          metadata: { ticketId },
        });
        expect(route).toBe(`/support/ticket/${ticketId}`);
      }),
      { numRuns: 100 }
    );
  });

  it('routes ALERT without ticketId to /notifications', () => {
    const route = getDeepLinkRoute({ type: 'ALERT', entityId: 'some-id' });
    expect(route).toBe('/notifications');
  });

  it('routes COLLABORATOR_REQUEST and COLLABORATOR_ACCEPTED to /collaborators', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<NotificationType>('COLLABORATOR_REQUEST', 'COLLABORATOR_ACCEPTED'),
        entityIdArb,
        (type, entityId) => {
          const route = getDeepLinkRoute({ type, entityId });
          expect(route).toBe('/collaborators');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('never returns an empty string for any notification payload', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...notificationTypes),
        fc.option(entityIdArb, { nil: undefined }),
        metadataArb,
        (type, entityId, metadata) => {
          const route = getDeepLinkRoute({ type, entityId, metadata });
          expect(route.length).toBeGreaterThan(0);
          expect(route.startsWith('/')).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
