import {
    ACTION_PERMISSIONS,
    DEFAULT_HOME_BY_ROLE,
    ROUTE_PERMISSIONS,
    TAB_PERMISSIONS,
} from '@/constants/routePermissions';
import { UserRole } from '@/types/auth';

describe('routePermissions', () => {
  describe('ROUTE_PERMISSIONS', () => {
    it('restricts admin-dashboard to SUPER_ADMIN and SCHOOL_ADMIN', () => {
      const roles = ROUTE_PERMISSIONS['/(tabs)/admin-dashboard'];
      expect(roles).toContain(UserRole.SUPER_ADMIN);
      expect(roles).toContain(UserRole.SCHOOL_ADMIN);
      expect(roles).not.toContain(UserRole.STUDENT);
      expect(roles).not.toContain(UserRole.TEACHER);
      expect(roles).not.toContain(UserRole.SUPPORT);
    });

    it('restricts admin/institutions to SUPER_ADMIN only', () => {
      const roles = ROUTE_PERMISSIONS['/admin/institutions'];
      expect(roles).toEqual([UserRole.SUPER_ADMIN]);
    });

    it('allows teacher dashboard for TEACHER and admins', () => {
      const roles = ROUTE_PERMISSIONS['/teacher/dashboard'];
      expect(roles).toContain(UserRole.TEACHER);
      expect(roles).toContain(UserRole.SUPER_ADMIN);
      expect(roles).toContain(UserRole.SCHOOL_ADMIN);
      expect(roles).not.toContain(UserRole.STUDENT);
    });

    it('allows tasks for academic roles but not SUPPORT', () => {
      const roles = ROUTE_PERMISSIONS['/tasks'];
      expect(roles).toContain(UserRole.STUDENT);
      expect(roles).toContain(UserRole.TEACHER);
      expect(roles).toContain(UserRole.SUPER_ADMIN);
      expect(roles).not.toContain(UserRole.SUPPORT);
    });

    it('includes admin tickets for SUPPORT role', () => {
      const roles = ROUTE_PERMISSIONS['/admin/tickets'];
      expect(roles).toContain(UserRole.SUPPORT);
      expect(roles).toContain(UserRole.SUPER_ADMIN);
      expect(roles).toContain(UserRole.SCHOOL_ADMIN);
    });
  });

  describe('DEFAULT_HOME_BY_ROLE', () => {
    it('maps SUPER_ADMIN to admin-dashboard', () => {
      expect(DEFAULT_HOME_BY_ROLE[UserRole.SUPER_ADMIN]).toBe('/(tabs)/admin-dashboard');
    });

    it('maps SCHOOL_ADMIN to admin-dashboard', () => {
      expect(DEFAULT_HOME_BY_ROLE[UserRole.SCHOOL_ADMIN]).toBe('/(tabs)/admin-dashboard');
    });

    it('maps TEACHER to home', () => {
      expect(DEFAULT_HOME_BY_ROLE[UserRole.TEACHER]).toBe('/(tabs)/home');
    });

    it('maps STUDENT to home', () => {
      expect(DEFAULT_HOME_BY_ROLE[UserRole.STUDENT]).toBe('/(tabs)/home');
    });

    it('maps SUPPORT to home', () => {
      expect(DEFAULT_HOME_BY_ROLE[UserRole.SUPPORT]).toBe('/(tabs)/home');
    });

    it('has an entry for every UserRole', () => {
      const allRoles = Object.values(UserRole);
      for (const role of allRoles) {
        expect(DEFAULT_HOME_BY_ROLE[role]).toBeDefined();
      }
    });
  });

  describe('TAB_PERMISSIONS', () => {
    it('shows home tab to all roles', () => {
      const allRoles = Object.values(UserRole);
      for (const role of allRoles) {
        expect(TAB_PERMISSIONS['home']).toContain(role);
      }
    });

    it('restricts admin-dashboard tab to admin roles', () => {
      expect(TAB_PERMISSIONS['admin-dashboard']).toContain(UserRole.SUPER_ADMIN);
      expect(TAB_PERMISSIONS['admin-dashboard']).toContain(UserRole.SCHOOL_ADMIN);
      expect(TAB_PERMISSIONS['admin-dashboard']).not.toContain(UserRole.STUDENT);
    });
  });

  describe('ACTION_PERMISSIONS', () => {
    it('restricts grade action to teachers and admins', () => {
      expect(ACTION_PERMISSIONS['grade']).toContain(UserRole.TEACHER);
      expect(ACTION_PERMISSIONS['grade']).toContain(UserRole.SUPER_ADMIN);
      expect(ACTION_PERMISSIONS['grade']).not.toContain(UserRole.STUDENT);
    });

    it('restricts submitAssignment to STUDENT only', () => {
      expect(ACTION_PERMISSIONS['submitAssignment']).toEqual([UserRole.STUDENT]);
    });

    it('restricts manageInstitutions to SUPER_ADMIN only', () => {
      expect(ACTION_PERMISSIONS['manageInstitutions']).toEqual([UserRole.SUPER_ADMIN]);
    });
  });
});
