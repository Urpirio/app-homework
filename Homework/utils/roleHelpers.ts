/**
 * Role Helper Utilities
 *
 * Provides helper functions for role-based access control checks.
 *
 * Validates: Requirements 7.3, 7.4
 */

import { UserRole } from '@/types/auth';

/**
 * Check if a user role is included in a list of allowed roles.
 *
 * @param userRole - The current user's role
 * @param allowedRoles - Array of roles that are permitted
 * @returns true if the user's role is in the allowed list
 */
export function hasRole(
  userRole: UserRole | string | null | undefined,
  allowedRoles: UserRole[]
): boolean {
  if (!userRole) return false;
  return allowedRoles.includes(userRole as UserRole);
}

/**
 * Check if a user role has admin-level access (SUPER_ADMIN or SCHOOL_ADMIN).
 *
 * @param userRole - The current user's role
 * @returns true if the user is an admin
 */
export function isAdmin(userRole: UserRole | string | null | undefined): boolean {
  return hasRole(userRole, [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN]);
}

/**
 * Check if a user role is SUPER_ADMIN (global access).
 *
 * @param userRole - The current user's role
 * @returns true if the user is a super admin
 */
export function isSuperAdmin(userRole: UserRole | string | null | undefined): boolean {
  return hasRole(userRole, [UserRole.SUPER_ADMIN]);
}
