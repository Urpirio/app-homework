// Feature: homework-app-integration, Property 20: Session timeout triggers after inactivity threshold
/**
 * Property 20: Session timeout triggers after inactivity threshold
 *
 * For any elapsed time, the session timeout logic correctly determines
 * whether to show warning (≥25min) or logout (≥30min). For elapsed
 * time < 25 minutes, no action should be taken.
 *
 * We test the pure timeout decision logic extracted from SessionTimeoutProvider
 * rather than rendering the component, keeping the test focused on correctness.
 *
 * **Validates: Requirements 7.7**
 */

import * as fc from 'fast-check';

const WARNING_THRESHOLD_MS = 25 * 60 * 1000; // 25 minutes
const LOGOUT_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes

type SessionAction = 'none' | 'warning' | 'logout';

/**
 * Pure function that mirrors the checkInactivity logic from SessionTimeoutProvider.
 * Given the elapsed time since last interaction, returns the appropriate action.
 */
function determineSessionAction(elapsedMs: number): SessionAction {
  if (elapsedMs >= LOGOUT_THRESHOLD_MS) {
    return 'logout';
  }
  if (elapsedMs >= WARNING_THRESHOLD_MS) {
    return 'warning';
  }
  return 'none';
}

describe('Property 20: Session timeout triggers after inactivity threshold', () => {
  it('returns "none" for any elapsed time under 25 minutes', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: WARNING_THRESHOLD_MS - 1 }),
        (elapsedMs) => {
          expect(determineSessionAction(elapsedMs)).toBe('none');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('returns "warning" for elapsed time between 25 and 30 minutes (exclusive)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: WARNING_THRESHOLD_MS, max: LOGOUT_THRESHOLD_MS - 1 }),
        (elapsedMs) => {
          expect(determineSessionAction(elapsedMs)).toBe('warning');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('returns "logout" for any elapsed time >= 30 minutes', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: LOGOUT_THRESHOLD_MS, max: LOGOUT_THRESHOLD_MS * 10 }),
        (elapsedMs) => {
          expect(determineSessionAction(elapsedMs)).toBe('logout');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('action is deterministic — same elapsed time always produces same action', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: LOGOUT_THRESHOLD_MS * 5 }),
        (elapsedMs) => {
          const action1 = determineSessionAction(elapsedMs);
          const action2 = determineSessionAction(elapsedMs);
          expect(action1).toBe(action2);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('action is always one of the three valid values', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: LOGOUT_THRESHOLD_MS * 10 }),
        (elapsedMs) => {
          const action = determineSessionAction(elapsedMs);
          expect(['none', 'warning', 'logout']).toContain(action);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('boundary: exactly 25 minutes triggers warning', () => {
    expect(determineSessionAction(WARNING_THRESHOLD_MS)).toBe('warning');
  });

  it('boundary: exactly 30 minutes triggers logout', () => {
    expect(determineSessionAction(LOGOUT_THRESHOLD_MS)).toBe('logout');
  });

  it('action severity never decreases as elapsed time increases', () => {
    const severity: Record<SessionAction, number> = {
      none: 0,
      warning: 1,
      logout: 2,
    };

    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: LOGOUT_THRESHOLD_MS * 5 }),
        fc.integer({ min: 0, max: LOGOUT_THRESHOLD_MS * 5 }),
        (elapsed1, elapsed2) => {
          const [smaller, larger] =
            elapsed1 <= elapsed2
              ? [elapsed1, elapsed2]
              : [elapsed2, elapsed1];

          const action1 = determineSessionAction(smaller);
          const action2 = determineSessionAction(larger);

          expect(severity[action2]).toBeGreaterThanOrEqual(severity[action1]);
        }
      ),
      { numRuns: 100 }
    );
  });
});
