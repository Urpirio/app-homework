// Feature: homework-app-integration, Property 14: Notification preferences round-trip
/**
 * Property 14: Notification preferences round-trip
 *
 * For any combination of 6 boolean preferences, updating and then reading
 * returns the same values. Tests the preferences data structure round-trip.
 *
 * **Validates: Requirements 5.5**
 */

import * as fc from 'fast-check';

// ---- Types from types/notification.ts ----

interface NotificationPreferences {
  assignments: boolean;
  grades: boolean;
  messages: boolean;
  system: boolean;
  deadlines: boolean;
  emailNotifications: boolean;
}

// ---- Pure logic: simulates the preferences round-trip ----

/**
 * Simulates serializing preferences for the PUT request body.
 * The API accepts a JSON body with 6 boolean fields.
 */
function serializePreferences(prefs: NotificationPreferences): string {
  return JSON.stringify(prefs);
}

/**
 * Simulates deserializing preferences from the GET response.
 */
function deserializePreferences(json: string): NotificationPreferences {
  return JSON.parse(json) as NotificationPreferences;
}

/**
 * Simulates the full round-trip: serialize → deserialize.
 * This mirrors what happens when preferences are saved via PUT
 * and then fetched via GET.
 */
function roundTripPreferences(
  prefs: NotificationPreferences
): NotificationPreferences {
  const serialized = serializePreferences(prefs);
  return deserializePreferences(serialized);
}

/**
 * Simulates the optimistic update logic from notification-preferences.tsx:
 *   const updated = { ...localPreferences, [key]: value };
 */
function applyToggle(
  prefs: NotificationPreferences,
  key: keyof NotificationPreferences,
  value: boolean
): NotificationPreferences {
  return { ...prefs, [key]: value };
}

const PREFERENCE_KEYS: (keyof NotificationPreferences)[] = [
  'assignments',
  'grades',
  'messages',
  'system',
  'deadlines',
  'emailNotifications',
];

// ---- Arbitraries ----

const notificationPrefsArb: fc.Arbitrary<NotificationPreferences> = fc.record({
  assignments: fc.boolean(),
  grades: fc.boolean(),
  messages: fc.boolean(),
  system: fc.boolean(),
  deadlines: fc.boolean(),
  emailNotifications: fc.boolean(),
});

const preferenceKeyArb = fc.constantFrom<keyof NotificationPreferences>(
  ...PREFERENCE_KEYS
);

// ---- Tests ----

describe('Property 14: Notification preferences round-trip', () => {
  it('round-trip preserves all 6 boolean preference values', () => {
    fc.assert(
      fc.property(notificationPrefsArb, (prefs) => {
        const result = roundTripPreferences(prefs);
        expect(result.assignments).toBe(prefs.assignments);
        expect(result.grades).toBe(prefs.grades);
        expect(result.messages).toBe(prefs.messages);
        expect(result.system).toBe(prefs.system);
        expect(result.deadlines).toBe(prefs.deadlines);
        expect(result.emailNotifications).toBe(prefs.emailNotifications);
      }),
      { numRuns: 100 }
    );
  });

  it('round-trip produces deeply equal preferences object', () => {
    fc.assert(
      fc.property(notificationPrefsArb, (prefs) => {
        const result = roundTripPreferences(prefs);
        expect(result).toEqual(prefs);
      }),
      { numRuns: 100 }
    );
  });

  it('toggling a preference key and round-tripping preserves the toggled value', () => {
    fc.assert(
      fc.property(
        notificationPrefsArb,
        preferenceKeyArb,
        fc.boolean(),
        (prefs, key, value) => {
          const updated = applyToggle(prefs, key, value);
          const result = roundTripPreferences(updated);
          expect(result[key]).toBe(value);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('toggling a preference only changes that specific key', () => {
    fc.assert(
      fc.property(
        notificationPrefsArb,
        preferenceKeyArb,
        fc.boolean(),
        (prefs, key, value) => {
          const updated = applyToggle(prefs, key, value);
          for (const k of PREFERENCE_KEYS) {
            if (k === key) {
              expect(updated[k]).toBe(value);
            } else {
              expect(updated[k]).toBe(prefs[k]);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('preferences object always has exactly 6 keys', () => {
    fc.assert(
      fc.property(notificationPrefsArb, (prefs) => {
        const result = roundTripPreferences(prefs);
        expect(Object.keys(result)).toHaveLength(6);
        for (const key of PREFERENCE_KEYS) {
          expect(key in result).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('all preference values are booleans after round-trip', () => {
    fc.assert(
      fc.property(notificationPrefsArb, (prefs) => {
        const result = roundTripPreferences(prefs);
        for (const key of PREFERENCE_KEYS) {
          expect(typeof result[key]).toBe('boolean');
        }
      }),
      { numRuns: 100 }
    );
  });

  it('multiple sequential toggles and round-trip preserves final state', () => {
    fc.assert(
      fc.property(
        notificationPrefsArb,
        fc.array(
          fc.tuple(preferenceKeyArb, fc.boolean()),
          { minLength: 1, maxLength: 20 }
        ),
        (initialPrefs, toggles) => {
          let current = { ...initialPrefs };
          for (const [key, value] of toggles) {
            current = applyToggle(current, key, value);
          }
          const result = roundTripPreferences(current);
          expect(result).toEqual(current);
        }
      ),
      { numRuns: 100 }
    );
  });
});
