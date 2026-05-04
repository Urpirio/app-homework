// Feature: homework-app-integration, Property 34: Ticket tracking numbers are unique
/**
 * Property 34: Ticket tracking numbers are unique
 *
 * For any two tickets created in the system, their tracking numbers should
 * be distinct. No two tickets should ever share the same tracking number
 * regardless of creation order or timing.
 *
 * **Validates: Requirements 15.2**
 */

import { generateTrackingNumber } from '@/utils/ticketTracking';
import * as fc from 'fast-check';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Property 34: Ticket tracking numbers are unique', () => {
  it('any batch of generated tracking numbers contains no duplicates', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 50 }),
        (count) => {
          const numbers: string[] = [];
          for (let i = 0; i < count; i++) {
            numbers.push(generateTrackingNumber());
          }
          const unique = new Set(numbers);
          expect(unique.size).toBe(numbers.length);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('tracking numbers are non-empty strings', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 20 }),
        (count) => {
          for (let i = 0; i < count; i++) {
            const num = generateTrackingNumber();
            expect(typeof num).toBe('string');
            expect(num.length).toBeGreaterThan(0);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('tracking numbers follow the TK- prefix format', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 20 }),
        (count) => {
          for (let i = 0; i < count; i++) {
            const num = generateTrackingNumber();
            expect(num).toMatch(/^TK-/);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('two consecutively generated tracking numbers are always different', () => {
    fc.assert(
      fc.property(
        fc.constant(null),
        () => {
          const a = generateTrackingNumber();
          const b = generateTrackingNumber();
          expect(a).not.toBe(b);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('large batch of 100 tracking numbers has zero collisions', () => {
    const numbers: string[] = [];
    for (let i = 0; i < 100; i++) {
      numbers.push(generateTrackingNumber());
    }
    const unique = new Set(numbers);
    expect(unique.size).toBe(100);
  });
});
