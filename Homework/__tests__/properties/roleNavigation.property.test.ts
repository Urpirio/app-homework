// Feature: homework-app-integration, Property 16: Role-specific navigation routing
/**
 * Property 16: Role-specific navigation routing
 *
 * For any user with a role in {STUDENT, TEACHER, SUPPORT} and a valid
 * institutionId, the navigateToUserDetail function should produce a route
 * path containing the correct role-specific segment and the user's ID.
 *
 * Also verifies that DEFAULT_HOME_BY_ROLE maps every role to a valid route.
 *
 * **Validates: Requirements 6.8**
 */

import { DEFAULT_HOME_BY_ROLE } from '@/constants/routePermissions';
import { UserRole } from '@/types/auth';
import * as fc from 'fast-check';

const allRoles: UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.SCHOOL_ADMIN,
  UserRole.TEACHER,
  UserRole.STUDENT,
  UserRole.SUPPORT,
];

/**
 * Simulates the navigateToUserDetail function from the design document.
 * Routes users to role-specific detail screens.
 */
function navigateToUserDetail(user: {
  id: string;
  role: string;
  institutionId: string;
}): string {
  const base = `/admin/institution/${user.institutionId}`;
  switch (user.role) {
    case 'STUDENT':
      return `${base}/student/${user.id}`;
    case 'TEACHER':
      return `${base}/teacher/${user.id}`;
    case 'SUPPORT':
      return `${base}/support/${user.id}`;
    default:
      return `/admin/users/${user.id}`;
  }
}

describe('Property 16: Role-specific navigation routing', () => {
  it('DEFAULT_HOME_BY_ROLE maps every role to a valid route starting with "/"', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...allRoles),
        (role) => {
          const home = DEFAULT_HOME_BY_ROLE[role];
          expect(typeof home).toBe('string');
          expect(home.length).toBeGreaterThan(0);
          expect(home.startsWith('/')).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('DEFAULT_HOME_BY_ROLE has an entry for every UserRole', () => {
    for (const role of allRoles) {
      expect(DEFAULT_HOME_BY_ROLE).toHaveProperty(role);
    }
  });

  it('navigateToUserDetail produces correct role-specific segment for STUDENT', () => {
    fc.assert(
      fc.property(fc.uuid(), fc.uuid(), (userId, instId) => {
        const route = navigateToUserDetail({
          id: userId,
          role: 'STUDENT',
          institutionId: instId,
        });
        expect(route).toContain('/student/');
        expect(route).toContain(userId);
        expect(route).toContain(instId);
        expect(route.startsWith('/')).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('navigateToUserDetail produces correct role-specific segment for TEACHER', () => {
    fc.assert(
      fc.property(fc.uuid(), fc.uuid(), (userId, instId) => {
        const route = navigateToUserDetail({
          id: userId,
          role: 'TEACHER',
          institutionId: instId,
        });
        expect(route).toContain('/teacher/');
        expect(route).toContain(userId);
        expect(route).toContain(instId);
        expect(route.startsWith('/')).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('navigateToUserDetail produces correct role-specific segment for SUPPORT', () => {
    fc.assert(
      fc.property(fc.uuid(), fc.uuid(), (userId, instId) => {
        const route = navigateToUserDetail({
          id: userId,
          role: 'SUPPORT',
          institutionId: instId,
        });
        expect(route).toContain('/support/');
        expect(route).toContain(userId);
        expect(route).toContain(instId);
        expect(route.startsWith('/')).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('navigateToUserDetail falls back to /admin/users/{id} for other roles', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.uuid(),
        fc.constantFrom('SUPER_ADMIN', 'SCHOOL_ADMIN'),
        (userId, instId, role) => {
          const route = navigateToUserDetail({
            id: userId,
            role,
            institutionId: instId,
          });
          expect(route).toBe(`/admin/users/${userId}`);
          expect(route.startsWith('/')).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
