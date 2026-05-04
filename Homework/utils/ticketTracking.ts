/**
 * Ticket Tracking Utilities
 *
 * Generates unique tracking numbers for support tickets.
 * Tracking numbers combine a timestamp component with a random
 * component to ensure uniqueness across concurrent creations.
 *
 * Validates: Requirements 15.2
 */

let counter = 0;

/**
 * Generates a unique tracking number string.
 *
 * Format: `TK-{timestamp}-{counter}-{random}`
 * - timestamp: base-36 encoded Date.now()
 * - counter: monotonically increasing per-process counter
 * - random: 4-character random base-36 suffix
 *
 * The combination of timestamp + counter + random makes collisions
 * virtually impossible even under rapid sequential calls.
 */
export function generateTrackingNumber(): string {
  const timestamp = Date.now().toString(36);
  const seq = (counter++).toString(36);
  const random = Math.random().toString(36).substring(2, 6);
  return `TK-${timestamp}-${seq}-${random}`;
}
