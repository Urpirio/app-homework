/**
 * useInstitution Hook
 *
 * Convenience hook for accessing the InstitutionContext.
 * Returns the currently selected institutionId and the setter function.
 *
 * Validates: Requirements 7.6
 */

import {
    InstitutionContext,
    InstitutionContextValue,
} from '@/providers/InstitutionContext';
import { useContext } from 'react';

export function useInstitution(): InstitutionContextValue {
  const context = useContext(InstitutionContext);

  if (!context) {
    throw new Error(
      'useInstitution must be used within an InstitutionProvider'
    );
  }

  return context;
}
