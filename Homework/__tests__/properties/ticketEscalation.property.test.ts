// Feature: homework-app-integration, Property 35: Ticket escalation triggers on time threshold
/**
 * Property 35: Ticket escalation triggers on time threshold
 *
 * For any ticket with High priority not claimed within 2 hours, or Critical
 * priority not claimed within 1 hour, or any ticket unresolved after 48 hours,
 * the escalation mechanism should flag the ticket for escalation.
 *
 * Only OPEN or IN_PROGRESS tickets can be escalated.
 * Priority-based escalation only applies to OPEN tickets without assignedToId.
 *
 * **Validates: Requirements 15.6**
 */

import type { TicketStatus } from '@/types/ticket';
import { shouldAutoEscalate } from '@/utils/ticketEscalation';
import * as fc from 'fast-check';

// ---------------------------------------------------------------------------
// Constants (matching the utility thresholds)
// ---------------------------------------------------------------------------

const ONE_HOUR_MS = 1 * 60 * 60 * 1000;
const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const escalatableStatusArb: fc.Arbitrary<TicketStatus> = fc.constantFrom('OPEN', 'IN_PROGRESS');
const nonEscalatableStatusArb: fc.Arbitrary<TicketStatus> = fc.constantFrom('RESOLVED', 'CLOSED');
const priorityArb = fc.constantFrom('Critical', 'High', 'Medium', 'Low');

/** Generate a createdAt ISO string that is `elapsedMs` milliseconds in the past */
function createdAtFromElapsed(elapsedMs: number): string {
  return new Date(Date.now() - elapsedMs).toISOString();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Property 35: Ticket escalation triggers on time threshold', () => {
  it('Critical OPEN unclaimed ticket past 1 hour should escalate', () => {
    fc.assert(
      fc.property(
        // elapsed time beyond 1 hour (1h + 1ms to 10h)
        fc.integer({ min: ONE_HOUR_MS + 1, max: ONE_HOUR_MS * 10 }),
        (elapsed) => {
          const ticket = {
            status: 'OPEN' as TicketStatus,
            priority: 'Critical',
            createdAt: createdAtFromElapsed(elapsed),
            assignedToId: undefined,
          };
          expect(shouldAutoEscalate(ticket)).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('High OPEN unclaimed ticket past 2 hours should escalate', () => {
    fc.assert(
      fc.property(
        // elapsed time beyond 2 hours (2h + 1ms to 20h)
        fc.integer({ min: TWO_HOURS_MS + 1, max: TWO_HOURS_MS * 10 }),
        (elapsed) => {
          const ticket = {
            status: 'OPEN' as TicketStatus,
            priority: 'High',
            createdAt: createdAtFromElapsed(elapsed),
            assignedToId: undefined,
          };
          expect(shouldAutoEscalate(ticket)).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('any OPEN or IN_PROGRESS ticket unresolved after 48 hours should escalate', () => {
    fc.assert(
      fc.property(
        escalatableStatusArb,
        priorityArb,
        // elapsed time beyond 48 hours
        fc.integer({ min: FORTY_EIGHT_HOURS_MS + 1, max: FORTY_EIGHT_HOURS_MS * 3 }),
        fc.option(fc.uuid(), { nil: undefined }),
        (status, priority, elapsed, assignedToId) => {
          const ticket = {
            status,
            priority,
            createdAt: createdAtFromElapsed(elapsed),
            assignedToId,
          };
          expect(shouldAutoEscalate(ticket)).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('RESOLVED or CLOSED tickets should never escalate regardless of time', () => {
    fc.assert(
      fc.property(
        nonEscalatableStatusArb,
        priorityArb,
        // any elapsed time, even very large
        fc.integer({ min: 0, max: FORTY_EIGHT_HOURS_MS * 5 }),
        fc.option(fc.uuid(), { nil: undefined }),
        (status, priority, elapsed, assignedToId) => {
          const ticket = {
            status,
            priority,
            createdAt: createdAtFromElapsed(elapsed),
            assignedToId,
          };
          expect(shouldAutoEscalate(ticket)).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('Critical OPEN unclaimed ticket within 1 hour should NOT escalate (unless 48h rule)', () => {
    fc.assert(
      fc.property(
        // elapsed time well within 1 hour (0 to 59 minutes)
        fc.integer({ min: 0, max: ONE_HOUR_MS - 1 }),
        (elapsed) => {
          const ticket = {
            status: 'OPEN' as TicketStatus,
            priority: 'Critical',
            createdAt: createdAtFromElapsed(elapsed),
            assignedToId: undefined,
          };
          // Within 1 hour and within 48 hours, should not escalate
          expect(shouldAutoEscalate(ticket)).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('High OPEN unclaimed ticket within 2 hours should NOT escalate (unless 48h rule)', () => {
    fc.assert(
      fc.property(
        // elapsed time well within 2 hours (0 to 1h59m)
        fc.integer({ min: 0, max: TWO_HOURS_MS - 1 }),
        (elapsed) => {
          const ticket = {
            status: 'OPEN' as TicketStatus,
            priority: 'High',
            createdAt: createdAtFromElapsed(elapsed),
            assignedToId: undefined,
          };
          expect(shouldAutoEscalate(ticket)).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('OPEN ticket with assignedToId does not trigger priority-based escalation within 48h', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('Critical', 'High'),
        // elapsed time beyond priority threshold but within 48h
        fc.integer({ min: TWO_HOURS_MS + 1, max: FORTY_EIGHT_HOURS_MS - 1 }),
        fc.uuid(),
        (priority, elapsed, assignedToId) => {
          const ticket = {
            status: 'OPEN' as TicketStatus,
            priority,
            createdAt: createdAtFromElapsed(elapsed),
            assignedToId,
          };
          // Has assignedToId, so priority-based escalation doesn't apply
          // And within 48h, so the unresolved rule doesn't apply either
          expect(shouldAutoEscalate(ticket)).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });
});
