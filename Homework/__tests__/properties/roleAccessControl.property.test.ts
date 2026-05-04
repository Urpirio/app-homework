// Feature: homework-app-integration, Property 15: Role-based access control is consistent
/**
 * Property 15: Role-based access control is consistent
 *
 * For any user role and any route path, the useRouteGuard check should return
 * allowed if and only if the role appears in the ROUTE_PERMISSIONS map for
 * that route (or the route is unrestricted). This should hold for all five
 * roles and all defined routes.
 *
 * **Validates: Requirements 6.3, 7.3, 7.4**
 */

import { ROUTE_PERMISSIONS } from '@/constants/routePermissions';
import { getRoutePermissions } from '@/hooks/useRouteGuard';
import { UserRole } from '@/types/auth';
import { hasRole } from '@/utils/roleHelpers';
import * as fc from 'fast-check';

const allRoles: UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.SCHOOL_ADMIN,
  UserRole.TEACHER,
  UserRole.STUDENT,
  UserRole.SUPPORT,
];

const restrictedRoutes = Object.keys(ROUTE_PERMISSIONS);

const unrestrictedRoutes = [
  '/(tabs)/home',
  '/(tabs)/calendar',
  '/(tabs)/collaborators',
  '/chat/123',
  '/notifications',
  '/profile',
  '/edit-profile',
  '/security',
  '/appearance',
];

describe('Property 15: Role-based access control is consistent', () => {
  it('hasRole returns true iff the role is in the allowed list', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...allRoles),
        fc.subarray(allRoles, { minLength: 0, maxLength: allRoles.length }),
        (role, allowedRoles) => {
          const result = hasRole(role, allowedRoles);
          expect(result).toBe(allowedRoles.includes(role));
        }
      ),
      { numRuns: 100 }
    );
  });

  it('hasRole returns false for null or undefined roles', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(null, undefined),
        fc.subarray(allRoles, { minLength: 0, maxLength: allRoles.length }),
        (role, allowedRoles) => {
          expect(hasRole(role, allowedRoles)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('getRoutePermissions returns the correct roles for restricted routes', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...restrictedRoutes),
        (route) => {
          const permissions = getRoutePermissions(route);
          expect(permissions).not.toBeNull();
          expect(Array.isArray(permissions)).toBe(true);
          // The returned permissions should match what's in ROUTE_PERMISSIONS
          expect(permissions).toEqual(ROUTE_PERMISSIONS[route]);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('getRoutePermissions returns null for unrestricted routes', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...unrestrictedRoutes),
        (route) => {
          const permissions = getRoutePermissions(route);
          expect(permissions).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('access control is consistent: role in permissions list means access allowed', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...allRoles),
        fc.constantFrom(...restrictedRoutes),
        (role, route) => {
          const permissions = getRoutePermissions(route);
          const hasAccess = hasRole(role, permissions!);
          const expectedAccess = ROUTE_PERMISSIONS[route].includes(role);
          expect(hasAccess).toBe(expectedAccess);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('SUPER_ADMIN has access to all restricted routes', () => {
    for (const route of restrictedRoutes) {
      const permissions = getRoutePermissions(route);
      expect(hasRole(UserRole.SUPER_ADMIN, permissions!)).toBe(true);
    }
  });
});
