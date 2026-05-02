/**
 * useFormValidation Hook
 * 
 * Custom hook for managing form validation state and logic in the login form.
 * Handles form values, validation errors, loading state, and provides methods
 * for form interaction.
 * 
 * Validates Requirements: 6.1, 6.2, 6.4, 10.1, 10.2, 10.3
 * 
 * @example
 * ```typescript
 * const {
 *   values,
 *   errors,
 *   handleChange,
 *   handleSubmit,
 *   clearError,
 *   setLoading
 * } = useFormValidation(
 *   { email: '', password: '' },
 *   {
 *     email: validateEmail,
 *     password: validatePassword
 *   }
 * );
 * ```
 */

import { useCallback, useState } from 'react';

/**
 * ValidationRules
 * 
 * Interface for validation rule functions.
 * Each field can have a validation function that returns an error message
 * or undefined if the field is valid.
 */
export interface ValidationRules<T> {
  [key: string]: (value: string, allValues: T) => string | undefined;
}

/**
 * UseFormValidationReturn
 * 
 * Return type for the useFormValidation hook.
 * 
 * @property values - Current form field values
 * @property errors - Current validation errors for each field
 * @property handleChange - Function to update a field value and clear its error
 * @property handleSubmit - Function to validate all fields and return validation status
 * @property clearError - Function to clear error for a specific field
 * @property setLoading - Function to update the loading state
 */
export interface UseFormValidationReturn<T> {
  values: T;
  errors: Record<string, string | undefined>;
  handleChange: (field: keyof T, value: string) => void;
  handleSubmit: () => boolean;
  clearError: (field: keyof T) => void;
  setLoading: (loading: boolean) => void;
  isLoading: boolean;
}

/**
 * useFormValidation
 * 
 * Hook for managing form validation state and logic.
 * 
 * Features:
 * - Manages form field values
 * - Tracks validation errors per field
 * - Clears errors when user starts typing (Requirement 6.4)
 * - Validates all fields on submit
 * - Manages loading state for async operations
 * 
 * @param initialValues - Initial values for form fields
 * @param validationRules - Validation functions for each field
 * @returns Object with form state and handler functions
 * 
 * @example
 * ```typescript
 * const form = useFormValidation(
 *   { email: '', password: '' },
 *   {
 *     email: (value) => !value ? 'Email required' : undefined,
 *     password: (value) => value.length < 6 ? 'Too short' : undefined
 *   }
 * );
 * 
 * // Update field value
 * form.handleChange('email', 'user@example.com');
 * 
 * // Validate and submit
 * if (form.handleSubmit()) {
 *   // Form is valid, proceed with submission
 *   form.setLoading(true);
 *   await submitForm(form.values);
 *   form.setLoading(false);
 * }
 * ```
 */
export function useFormValidation<T extends Record<string, any>>(
  initialValues: T,
  validationRules: ValidationRules<T>
): UseFormValidationReturn<T> {
  // State for form field values
  const [values, setValues] = useState<T>(initialValues);
  
  // State for validation errors
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  
  // State for loading indicator
  const [isLoading, setIsLoading] = useState<boolean>(false);

  /**
   * handleChange
   * 
   * Updates a field value and clears its error.
   * This provides immediate feedback when the user starts correcting an error.
   * 
   * Validates Requirement 6.4: Error clearing on input
   * 
   * @param field - The field name to update
   * @param value - The new value for the field
   */
  const handleChange = useCallback((field: keyof T, value: string) => {
    // Update the field value
    setValues((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear the error for this field when user starts typing
    // This implements Requirement 6.4
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field as string];
      return newErrors;
    });
  }, []);

  /**
   * handleSubmit
   * 
   * Validates all fields using the provided validation rules.
   * Returns true if all fields are valid, false otherwise.
   * Updates the errors state with any validation errors found.
   * 
   * Validates Requirements 6.1, 6.2: Field validation on submit
   * 
   * @returns true if form is valid, false if there are validation errors
   */
  const handleSubmit = useCallback((): boolean => {
    const newErrors: Record<string, string | undefined> = {};
    let isValid = true;

    // Validate each field using its validation rule
    Object.keys(validationRules).forEach((field) => {
      const validator = validationRules[field];
      const value = values[field] as string;
      const error = validator(value, values);

      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    // Update errors state
    setErrors(newErrors);

    // Return validation status
    return isValid;
  }, [values, validationRules]);

  /**
   * clearError
   * 
   * Clears the error for a specific field.
   * Useful for programmatically clearing errors.
   * 
   * @param field - The field name to clear error for
   */
  const clearError = useCallback((field: keyof T) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field as string];
      return newErrors;
    });
  }, []);

  /**
   * setLoading
   * 
   * Updates the loading state.
   * Used to show loading indicators during async operations.
   * 
   * Validates Requirements 10.1, 10.2, 10.3: Loading state management
   * 
   * @param loading - The new loading state
   */
  const setLoadingState = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  return {
    values,
    errors,
    handleChange,
    handleSubmit,
    clearError,
    setLoading: setLoadingState,
    isLoading,
  };
}
