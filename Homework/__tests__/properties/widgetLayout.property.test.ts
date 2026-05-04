// Feature: homework-app-integration, Property 39: Dashboard widget layout round-trip
/**
 * Property 39: Dashboard widget layout round-trip
 *
 * For any widget layout configuration (ordered list of widget IDs with
 * visibility flags), saving to AsyncStorage and reloading should produce
 * the identical layout configuration.
 *
 * **Validates: Requirements 14.10**
 */

import {
    buildLayoutKey,
    getDefaultLayout,
    isValidLayout,
    WIDGET_IDS,
    WIDGET_TITLES,
    type DashboardWidget,
    type WidgetId
} from '@/constants/dashboardWidgets';
import { UserRole } from '@/types/auth';
import * as fc from 'fast-check';

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const allWidgetIds = Object.values(WIDGET_IDS);

/** Generate a single valid DashboardWidget */
const widgetArb: fc.Arbitrary<DashboardWidget> = fc
  .tuple(
    fc.constantFrom(...allWidgetIds),
    fc.boolean(),
  )
  .map(([id, visible]) => ({
    id,
    title: WIDGET_TITLES[id],
    visible,
  }));

/** Generate a valid layout (array of widgets with known IDs) */
const layoutArb: fc.Arbitrary<DashboardWidget[]> = fc
  .shuffledSubarray(allWidgetIds, { minLength: 1, maxLength: allWidgetIds.length })
  .chain((ids) =>
    fc.tuple(...ids.map((id) =>
      fc.boolean().map((visible) => ({
        id,
        title: WIDGET_TITLES[id],
        visible,
      })),
    )),
  )
  .map((widgets) => widgets as DashboardWidget[]);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Property 39: Dashboard widget layout round-trip', () => {
  it('isValidLayout accepts any layout with known widget IDs and correct shape', () => {
    fc.assert(
      fc.property(layoutArb, (layout) => {
        expect(isValidLayout(layout)).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  it('JSON serialize/deserialize round-trip preserves layout exactly', () => {
    fc.assert(
      fc.property(layoutArb, (layout) => {
        // Simulate AsyncStorage: setItem(key, JSON.stringify(layout))
        const serialized = JSON.stringify(layout);
        // Simulate AsyncStorage: getItem(key) → JSON.parse
        const deserialized = JSON.parse(serialized);

        expect(isValidLayout(deserialized)).toBe(true);
        expect(deserialized).toEqual(layout);
      }),
      { numRuns: 100 },
    );
  });

  it('round-trip preserves widget order', () => {
    fc.assert(
      fc.property(layoutArb, (layout) => {
        const serialized = JSON.stringify(layout);
        const deserialized: DashboardWidget[] = JSON.parse(serialized);

        for (let i = 0; i < layout.length; i++) {
          expect(deserialized[i].id).toBe(layout[i].id);
          expect(deserialized[i].visible).toBe(layout[i].visible);
          expect(deserialized[i].title).toBe(layout[i].title);
        }
      }),
      { numRuns: 100 },
    );
  });

  it('round-trip preserves visibility flags', () => {
    fc.assert(
      fc.property(layoutArb, (layout) => {
        const serialized = JSON.stringify(layout);
        const deserialized: DashboardWidget[] = JSON.parse(serialized);

        const originalVisibility = layout.map((w) => w.visible);
        const deserializedVisibility = deserialized.map((w) => w.visible);
        expect(deserializedVisibility).toEqual(originalVisibility);
      }),
      { numRuns: 100 },
    );
  });

  it('isValidLayout rejects arrays with unknown widget IDs', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 5, maxLength: 20 }).filter(
          (s) => !allWidgetIds.includes(s as WidgetId),
        ),
        (unknownId) => {
          const invalidLayout = [
            { id: unknownId, title: 'Unknown', visible: true },
          ];
          expect(isValidLayout(invalidLayout)).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('isValidLayout rejects non-array values', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.string(),
          fc.integer(),
          fc.boolean(),
          fc.constant(null),
          fc.constant(undefined),
          fc.record({ id: fc.string() }),
        ),
        (value) => {
          expect(isValidLayout(value)).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('isValidLayout rejects widgets with missing fields', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...allWidgetIds),
        (id) => {
          // Missing title
          expect(isValidLayout([{ id, visible: true }])).toBe(false);
          // Missing visible
          expect(isValidLayout([{ id, title: 'Test' }])).toBe(false);
          // Missing id
          expect(isValidLayout([{ title: 'Test', visible: true }])).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('default layouts for all roles are valid', () => {
    const allRoles = Object.values(UserRole);
    for (const role of allRoles) {
      const layout = getDefaultLayout(role);
      expect(isValidLayout(layout)).toBe(true);
    }
  });

  it('buildLayoutKey produces consistent keys for the same userId', () => {
    fc.assert(
      fc.property(fc.uuid(), (userId) => {
        const key1 = buildLayoutKey(userId);
        const key2 = buildLayoutKey(userId);
        expect(key1).toBe(key2);
        expect(key1).toBe(`dashboard_layout:${userId}`);
      }),
      { numRuns: 100 },
    );
  });
});
