/**
 * InstitutionContext
 *
 * Provides institutional context switching for multi-tenant admin screens.
 * - SUPER_ADMIN users can switch between institutions via a selector
 * - SCHOOL_ADMIN users have their institutionId fixed from their profile
 * - On institution change: invalidates all institution-scoped React Query caches
 *
 * Validates: Requirements 7.6
 */

import { useProfile } from '@/hooks/api/useAuth';
import { queryClient } from '@/utils/queryClient';
import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';

export interface InstitutionContextValue {
  /** Currently selected institution ID, or null if none selected */
  institutionId: string | null;
  /** Update the selected institution and invalidate scoped caches */
  setInstitutionId: (id: string | null) => void;
}

export const InstitutionContext = createContext<InstitutionContextValue>({
  institutionId: null,
  setInstitutionId: () => {},
});

/** Query key prefixes that are scoped to a specific institution */
export const INSTITUTION_SCOPED_QUERY_KEYS = [
  'institutions',
  'institution-stats',
  'classrooms',
  'users',
  'teachers',
  'students',
  'subjects',
  'tickets',
  'schedules',
  'dashboard',
  'admin-dashboard',
];

interface InstitutionProviderProps {
  children: React.ReactNode;
}

export function InstitutionProvider({ children }: InstitutionProviderProps) {
  const [institutionId, setInstitutionIdState] = useState<string | null>(null);
  const { data: profile } = useProfile();

  const setInstitutionId = useCallback((id: string | null) => {
    setInstitutionIdState(id);

    // Invalidate all institution-scoped React Query caches so they refetch
    // with the new institutionId
    INSTITUTION_SCOPED_QUERY_KEYS.forEach((key) => {
      queryClient.invalidateQueries({ queryKey: [key] });
    });
  }, []);

  // Auto-sync institutionId for SCHOOL_ADMIN (and SUPER_ADMIN if profile has one)
  useEffect(() => {
    if (profile?.institutionId && !institutionId) {
      setInstitutionId(profile.institutionId);
    }
  }, [profile, institutionId, setInstitutionId]);

  const value = useMemo<InstitutionContextValue>(
    () => ({ institutionId, setInstitutionId }),
    [institutionId, setInstitutionId]
  );

  return (
    <InstitutionContext.Provider value={value}>
      {children}
    </InstitutionContext.Provider>
  );
}
