/**
 * Tests for dashboardWidgets constants
 *
 * Validates: Requirements 14.10
 */

import { UserRole } from '@/types/auth';
import {
    buildLayoutKey,
    DashboardWidget,
    DEFAULT_LAYOUTS,
    getDefaultLayout,
    isValidLayout,
    WIDGET_IDS,
    WIDGET_TITLES,
} from '../dashboardWidgets';

describe('dashboardWidgets', () => {
  describe('WIDGET_IDS', () => {
    it('should contain all 7 widget IDs', () => {
      expect(Object.keys(WIDGET_IDS)).toHaveLength(7);
    });

    it('should have matching titles for every widget ID', () => {
      for (const id of Object.values(WIDGET_IDS)) {
        expect(WIDGET_TITLES[id]).toBeDefined();
        expect(typeof WIDGET_TITLES[id]).toBe('string');
      }
    });
  });

  describe('DEFAULT_LAYOUTS', () => {
    const allRoles = [
      UserRole.SUPER_ADMIN,
      UserRole.SCHOOL_ADMIN,
      UserRole.TEACHER,
      UserRole.STUDENT,
      UserRole.SUPPORT,
    ];

    it.each(allRoles)('should have a default layout for %s', (role) => {
      const layout = DEFAULT_LAYOUTS[role];
      expect(layout).toBeDefined();
      expect(Array.isArray(layout)).toBe(true);
      expect(layout.length).toBeGreaterThan(0);
    });

    it.each(allRoles)(
      'should include all widget IDs in the %s layout',
      (role) => {
        const layout = DEFAULT_LAYOUTS[role];
        const layoutIds = layout.map((w) => w.id);
        const allIds = Object.values(WIDGET_IDS);
        expect(layoutIds.sort()).toEqual(allIds.sort());
      }
    );

    it('should give SUPER_ADMIN all widgets visible', () => {
      const layout = DEFAULT_LAYOUTS[UserRole.SUPER_ADMIN];
      expect(layout.every((w) => w.visible)).toBe(true);
    });

    it('should hide TicketQueue for SCHOOL_ADMIN by default', () => {
      const layout = DEFAULT_LAYOUTS[UserRole.SCHOOL_ADMIN];
      const ticketWidget = layout.find(
        (w) => w.id === WIDGET_IDS.TICKET_QUEUE
      );
      expect(ticketWidget?.visible).toBe(false);
    });

    it('should show TicketQueue for SUPPORT by default', () => {
      const layout = DEFAULT_LAYOUTS[UserRole.SUPPORT];
      const ticketWidget = layout.find(
        (w) => w.id === WIDGET_IDS.TICKET_QUEUE
      );
      expect(ticketWidget?.visible).toBe(true);
    });
  });

  describe('getDefaultLayout', () => {
    it('should return the correct layout for a known role', () => {
      const layout = getDefaultLayout(UserRole.TEACHER);
      expect(layout).toBe(DEFAULT_LAYOUTS[UserRole.TEACHER]);
    });

    it('should fall back to SUPER_ADMIN for unknown roles', () => {
      const layout = getDefaultLayout('UNKNOWN_ROLE');
      expect(layout).toBe(DEFAULT_LAYOUTS[UserRole.SUPER_ADMIN]);
    });
  });

  describe('buildLayoutKey', () => {
    it('should build the correct AsyncStorage key', () => {
      expect(buildLayoutKey('user-123')).toBe('dashboard_layout:user-123');
    });

    it('should handle empty userId', () => {
      expect(buildLayoutKey('')).toBe('dashboard_layout:');
    });
  });

  describe('isValidLayout', () => {
    it('should accept a valid layout array', () => {
      const layout: DashboardWidget[] = [
        { id: WIDGET_IDS.STATS_GRID, title: 'Stats', visible: true },
      ];
      expect(isValidLayout(layout)).toBe(true);
    });

    it('should reject non-array values', () => {
      expect(isValidLayout(null)).toBe(false);
      expect(isValidLayout('string')).toBe(false);
      expect(isValidLayout(42)).toBe(false);
      expect(isValidLayout({})).toBe(false);
    });

    it('should reject arrays with unknown widget IDs', () => {
      const layout = [
        { id: 'UnknownWidget', title: 'Unknown', visible: true },
      ];
      expect(isValidLayout(layout)).toBe(false);
    });

    it('should reject items missing required fields', () => {
      expect(isValidLayout([{ id: WIDGET_IDS.STATS_GRID }])).toBe(false);
      expect(
        isValidLayout([{ id: WIDGET_IDS.STATS_GRID, title: 'Stats' }])
      ).toBe(false);
    });

    it('should reject items with wrong field types', () => {
      expect(
        isValidLayout([
          { id: WIDGET_IDS.STATS_GRID, title: 123, visible: true },
        ])
      ).toBe(false);
      expect(
        isValidLayout([
          { id: WIDGET_IDS.STATS_GRID, title: 'Stats', visible: 'yes' },
        ])
      ).toBe(false);
    });

    it('should accept an empty array', () => {
      expect(isValidLayout([])).toBe(true);
    });

    it('should accept a full default layout', () => {
      expect(isValidLayout(DEFAULT_LAYOUTS[UserRole.SUPER_ADMIN])).toBe(true);
    });
  });
});
