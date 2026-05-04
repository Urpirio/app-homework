/**
 * useRouteGuard Hook
 *
 * Provides route-level and action-level access control based on the current user's role.
 * Checks navigation attempts against ROUTE_PERMISSIONS and redirects unauthorized
 * users to their default home screen with a toast message.
 *
 * Validates: Requirements 7.3, 7.4, 7.6
 */

import {
    ACTION_PERMISSIONS,
    DEFAULT_HOME_BY_ROLE,
    ROUTE_PERMISSIONS,
    TAB_PERMISSIONS,
} from '@/constants/routePermissions';
import { UserRole } from '@/types/auth';
import { hasRole } from '@/utils/roleHelpers';
import { router } from 'expo-router';
import { useCallback, useMemo } from 'react';
import Toast from 'react-native-toast-message';

interface UseRouteGuardResult {
  /**
   * Check if the current user can access a given route path.
   * Returns true if access is allowed.
   */
  canAccess: (path: string) => boolean;

  /**
   * Navigate to a route if the user has permission.
   * Redirects to default home with a toast if unauthorized.
   * Returns true if navigation was allowed.
   */
  guardedNavigate: (path: string) => boolean;

  /**
   * Check if a specific tab should be visible for the current role.
   */
  isTabVisible: (tabName: string) => boolean;

  /**
   * Check if a specific action is permitted for the current role.
   * Useful for conditionally rendering buttons like "Grade", "Create Task", etc.
   */
  canPerformAction: (actionName: string) => boolean;

  /**
   * Get the default home screen path for the current user's role.
   */
  defaultHome: string;
}

/**
 * Find the most specific matching permission entry for a given path.
 * Uses prefix matching — longer (more specific) patterns take priority.
 *
 * @param path - The route path to check
 * @returns The allowed roles for the matching route, or null if no restriction exists
 */
export function getRoutePermissions(path: string): UserRole[] | null {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  // Collect all matching patterns and sort by specificity (longest first)
  const matches = Object.entries(ROUTE_PERMISSIONS)
    .filter(([pattern]) => normalizedPath.startsWith(pattern))
    .sort(([a], [b]) => b.length - a.length);

  if (matches.length > 0) {
    return matches[0][1];
  }

  // No restriction found — route is accessible to all authenticated users
  return null;
}

/**
 * Hook for role-based navigation guards.
 *
 * @param userRole - The current user's role (from auth profile)
 * @returns Guard utilities for route access, tab visibility, and action permissions
 */
export function useRouteGuard(userRole: UserRole | string | null | undefined): UseRouteGuardResult {
  const defaultHome = useMemo(() => {
    if (!userRole) return '/(tabs)/home';
    return DEFAULT_HOME_BY_ROLE[userRole as UserRole] ?? '/(tabs)/home';
  }, [userRole]);

  const canAccess = useCallback(
    (path: string): boolean => {
      if (!userRole) return false;

      const allowedRoles = getRoutePermissions(path);

      // No restriction — accessible to all authenticated users
      if (allowedRoles === null) return true;

      return hasRole(userRole, allowedRoles);
    },
    [userRole]
  );

  const guardedNavigate = useCallback(
    (path: string): boolean => {
      if (canAccess(path)) {
        router.push(path as any);
        return true;
      }

      // Unauthorized — redirect to default home with toast
      Toast.show({
        type: 'error',
        text1: 'Acceso denegado',
        text2: 'No tienes permisos para acceder a esta sección',
        visibilityTime: 3000,
      });

      router.replace(defaultHome as any);
      return false;
    },
    [canAccess, defaultHome]
  );

  const isTabVisible = useCallback(
    (tabName: string): boolean => {
      if (!userRole) return false;

      const allowedRoles = TAB_PERMISSIONS[tabName];

      // If no entry exists, show the tab to everyone
      if (!allowedRoles) return true;

      return hasRole(userRole, allowedRoles);
    },
    [userRole]
  );

  const canPerformAction = useCallback(
    (actionName: string): boolean => {
      if (!userRole) return false;

      const allowedRoles = ACTION_PERMISSIONS[actionName];

      // If no entry exists, allow the action
      if (!allowedRoles) return true;

      return hasRole(userRole, allowedRoles);
    },
    [userRole]
  );

  return {
    canAccess,
    guardedNavigate,
    isTabVisible,
    canPerformAction,
    defaultHome,
  };
}
