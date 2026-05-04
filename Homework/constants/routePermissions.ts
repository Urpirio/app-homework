/**
 * Route Permissions Configuration
 *
 * Defines which user roles can access each route path.
 * Routes not listed here are accessible to all authenticated users.
 *
 * Validates: Requirements 7.3, 7.4
 */

import { UserRole } from '@/types/auth';

/**
 * Map of route path patterns to the roles allowed to access them.
 * Patterns use prefix matching: '/admin' matches '/admin/users', '/admin/institutions', etc.
 * More specific patterns are checked first (longest match wins).
 */
export const ROUTE_PERMISSIONS: Record<string, UserRole[]> = {
  // Admin routes — SUPER_ADMIN and SCHOOL_ADMIN only
  '/(tabs)/admin-dashboard': [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN],
  '/admin/institutions': [UserRole.SUPER_ADMIN],
  '/admin/users': [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN],
  '/admin/tickets': [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.SUPPORT],
  '/admin/institution': [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN],

  // Teacher-specific routes
  '/teacher/dashboard': [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER],

  // Support-specific routes
  '/support/dashboard': [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.SUPPORT],

  // Task and project routes — all roles except SUPPORT
  '/tasks': [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.STUDENT],
  '/projects': [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.STUDENT],
  '/grades': [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.STUDENT],

  // Shared routes accessible to all authenticated users (listed for completeness)
  // '/(tabs)/home': all roles
  // '/(tabs)/calendar': all roles
  // '/(tabs)/collaborators': all roles
  // '/chat': all roles
  // '/notifications': all roles
  // '/profile': all roles
  // '/edit-profile': all roles
  // '/security': all roles
  // '/appearance': all roles
};

/**
 * Default home screen for each role.
 * Used as redirect target when a user tries to access an unauthorized route.
 */
export const DEFAULT_HOME_BY_ROLE: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: '/(tabs)/admin-dashboard',
  [UserRole.SCHOOL_ADMIN]: '/(tabs)/admin-dashboard',
  [UserRole.TEACHER]: '/(tabs)/home',
  [UserRole.STUDENT]: '/(tabs)/home',
  [UserRole.SUPPORT]: '/(tabs)/home',
};

/**
 * Tab visibility configuration.
 * Defines which roles can see each tab in the bottom navigation.
 */
export const TAB_PERMISSIONS: Record<string, UserRole[]> = {
  home: [
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_ADMIN,
    UserRole.TEACHER,
    UserRole.STUDENT,
    UserRole.SUPPORT,
  ],
  calendar: [
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_ADMIN,
    UserRole.TEACHER,
    UserRole.STUDENT,
    UserRole.SUPPORT,
  ],
  collaborators: [
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_ADMIN,
    UserRole.TEACHER,
    UserRole.STUDENT,
    UserRole.SUPPORT,
  ],
  'admin-dashboard': [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN],
};

/**
 * Action-level permissions.
 * Controls visibility of specific action buttons within screens.
 */
export const ACTION_PERMISSIONS: Record<string, UserRole[]> = {
  grade: [UserRole.TEACHER, UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN],
  createTask: [UserRole.TEACHER, UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN],
  createSchedule: [UserRole.TEACHER, UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN],
  manageUsers: [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN],
  manageInstitutions: [UserRole.SUPER_ADMIN],
  submitAssignment: [UserRole.STUDENT],
  manageTickets: [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.SUPPORT],
};
