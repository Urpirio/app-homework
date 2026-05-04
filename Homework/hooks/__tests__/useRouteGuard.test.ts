import { getRoutePermissions } from '@/hooks/useRouteGuard';
import { UserRole } from '@/types/auth';

// We test the pure function getRoutePermissions directly,
// and the hook behavior through its logic (since renderHook
// requires a full React Native environment).

const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  router: {
    push: (...args: any[]) => mockPush(...args),
    replace: (...args: any[]) => mockReplace(...args),
  },
}));

jest.mock('react-native-toast-message', () => ({
  show: jest.fn(),
}));

describe('getRoutePermissions', () => {
  it('returns admin roles for admin-dashboard', () => {
    const roles = getRoutePermissions('/(tabs)/admin-dashboard');
    expect(roles).toContain(UserRole.SUPER_ADMIN);
    expect(roles).toContain(UserRole.SCHOOL_ADMIN);
    expect(roles).not.toContain(UserRole.STUDENT);
  });

  it('returns SUPER_ADMIN only for /admin/institutions', () => {
    const roles = getRoutePermissions('/admin/institutions');
    expect(roles).toEqual([UserRole.SUPER_ADMIN]);
  });

  it('uses prefix matching for nested admin routes', () => {
    const roles = getRoutePermissions('/admin/institution/123/classrooms');
    expect(roles).toContain(UserRole.SUPER_ADMIN);
    expect(roles).toContain(UserRole.SCHOOL_ADMIN);
    expect(roles).not.toContain(UserRole.STUDENT);
  });

  it('returns null for unrestricted routes like /profile', () => {
    const roles = getRoutePermissions('/profile');
    expect(roles).toBeNull();
  });

  it('returns null for unrestricted routes like /notifications', () => {
    const roles = getRoutePermissions('/notifications');
    expect(roles).toBeNull();
  });

  it('returns null for unrestricted routes like /chat/123', () => {
    const roles = getRoutePermissions('/chat/123');
    expect(roles).toBeNull();
  });

  it('matches /tasks routes to academic roles', () => {
    const roles = getRoutePermissions('/tasks/abc-123');
    expect(roles).toContain(UserRole.STUDENT);
    expect(roles).toContain(UserRole.TEACHER);
    expect(roles).not.toContain(UserRole.SUPPORT);
  });

  it('matches /projects routes to academic roles', () => {
    const roles = getRoutePermissions('/projects/some-id/unit/u1');
    expect(roles).toContain(UserRole.STUDENT);
    expect(roles).toContain(UserRole.TEACHER);
    expect(roles).not.toContain(UserRole.SUPPORT);
  });

  it('matches /grades to academic roles', () => {
    const roles = getRoutePermissions('/grades');
    expect(roles).toContain(UserRole.STUDENT);
    expect(roles).toContain(UserRole.TEACHER);
    expect(roles).not.toContain(UserRole.SUPPORT);
  });

  it('prefers more specific patterns over general ones', () => {
    // /admin/institutions is SUPER_ADMIN only, while /admin/institution is SUPER_ADMIN + SCHOOL_ADMIN
    const institutionsRoles = getRoutePermissions('/admin/institutions');
    const institutionRoles = getRoutePermissions('/admin/institution/123');

    expect(institutionsRoles).toEqual([UserRole.SUPER_ADMIN]);
    expect(institutionRoles).toContain(UserRole.SCHOOL_ADMIN);
  });

  it('normalizes paths without leading slash', () => {
    const roles = getRoutePermissions('tasks/123');
    expect(roles).toContain(UserRole.STUDENT);
  });

  it('returns teacher dashboard roles for /teacher/dashboard', () => {
    const roles = getRoutePermissions('/teacher/dashboard');
    expect(roles).toContain(UserRole.TEACHER);
    expect(roles).toContain(UserRole.SUPER_ADMIN);
    expect(roles).not.toContain(UserRole.STUDENT);
  });

  it('returns support dashboard roles for /support/dashboard', () => {
    const roles = getRoutePermissions('/support/dashboard');
    expect(roles).toContain(UserRole.SUPPORT);
    expect(roles).toContain(UserRole.SUPER_ADMIN);
    expect(roles).not.toContain(UserRole.STUDENT);
  });
});

// Test the hook logic via direct function calls (avoiding renderHook complexity)
describe('useRouteGuard logic', () => {
  // Import the hook and test its internal logic through getRoutePermissions + hasRole
  const { hasRole } = require('@/utils/roleHelpers');

  describe('canAccess equivalent', () => {
    it('allows SUPER_ADMIN to access any restricted route', () => {
      const restrictedRoutes = [
        '/(tabs)/admin-dashboard',
        '/admin/institutions',
        '/admin/users',
        '/teacher/dashboard',
        '/support/dashboard',
        '/tasks/123',
        '/projects',
        '/grades',
      ];

      for (const route of restrictedRoutes) {
        const allowedRoles = getRoutePermissions(route);
        if (allowedRoles) {
          expect(hasRole(UserRole.SUPER_ADMIN, allowedRoles)).toBe(true);
        }
      }
    });

    it('denies STUDENT access to admin routes', () => {
      const adminRoutes = [
        '/(tabs)/admin-dashboard',
        '/admin/institutions',
        '/admin/users',
        '/admin/institution/123',
      ];

      for (const route of adminRoutes) {
        const allowedRoles = getRoutePermissions(route);
        expect(allowedRoles).not.toBeNull();
        expect(hasRole(UserRole.STUDENT, allowedRoles!)).toBe(false);
      }
    });

    it('allows STUDENT access to unrestricted routes', () => {
      const openRoutes = ['/profile', '/notifications', '/chat/123', '/appearance'];

      for (const route of openRoutes) {
        const allowedRoles = getRoutePermissions(route);
        // null means no restriction — accessible to all
        expect(allowedRoles).toBeNull();
      }
    });

    it('allows TEACHER access to task and project routes', () => {
      const teacherRoutes = ['/tasks/123', '/projects', '/grades'];

      for (const route of teacherRoutes) {
        const allowedRoles = getRoutePermissions(route);
        expect(allowedRoles).not.toBeNull();
        expect(hasRole(UserRole.TEACHER, allowedRoles!)).toBe(true);
      }
    });

    it('denies SUPPORT access to task and project routes', () => {
      const academicRoutes = ['/tasks/123', '/projects', '/grades'];

      for (const route of academicRoutes) {
        const allowedRoles = getRoutePermissions(route);
        expect(allowedRoles).not.toBeNull();
        expect(hasRole(UserRole.SUPPORT, allowedRoles!)).toBe(false);
      }
    });
  });
});
