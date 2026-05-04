/**
 * useForm Hook
 *
 * Lightweight form management hook that accepts a Zod schema for validation.
 * Provides field-level validation on blur and form-level validation on submit.
 * Error messages are field-specific strings for inline display.
 *
 * Validates: Requirements 9.1, 9.2, 9.6
 *
 * @example
 * ```typescript
 * const form = useForm(taskSchema, {
 *   title: '',
 *   type: 'ASSIGNMENT',
 *   maxGrade: 100,
 *   projectId: '',
 * });
 *
 * <TextInput
 *   value={form.values.title}
 *   onChangeText={(text) => form.handleChange('title', text)}
 *   onBlur={() => form.handleBlur('title')}
 *   style={form.errors.title ? styles.inputError : styles.input}
 * />
 * {form.errors.title && <Text style={styles.errorText}>{form.errors.title}</Text>}
 * ```
 */

import { useCallback, useMemo, useState } from 'react';
import type { ZodObject, ZodRawShape } from 'zod';

export interface UseFormReturn<T extends Record<string, any>> {
  /** Current form field values */
  values: T;
  /** Field-specific error messages (key = field name, value = error string) */
  errors: Partial<Record<keyof T, string>>;
  /** Tracks which fields have been interacted with (blurred) */
  touched: Partial<Record<keyof T, boolean>>;
  /** Update a field value. Clears the field's error on change. */
  handleChange: (field: keyof T, value: any) => void;
  /** Mark a field as touched and validate it against the schema */
  handleBlur: (field: keyof T) => void;
  /** Validate all fields. Returns true if valid, false otherwise. */
  handleSubmit: (onSubmit?: (values: T) => void | Promise<void>) => boolean;
  /** Whether all fields currently pass validation */
  isValid: boolean;
  /** Reset form to initial values, clearing errors and touched state */
  reset: () => void;
}

/**
 * useForm
 *
 * @param schema - A Zod object schema used for validation
 * @param initialValues - Initial values for the form fields
 * @returns Form state and handler functions
 */
export function useForm<T extends Record<string, any>>(
  schema: ZodObject<ZodRawShape>,
  initialValues: T
): UseFormReturn<T> {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  /**
   * Validate a single field by parsing the full values object through the schema
   * and extracting the error for the specific field.
   */
  const validateField = useCallback(
    (field: keyof T, currentValues: T): string | undefined => {
      const result = schema.safeParse(currentValues);
      if (result.success) return undefined;

      const fieldError = result.error.issues.find(
        (issue) => issue.path[0] === field
      );
      return fieldError?.message;
    },
    [schema]
  );

  /**
   * Update a field value and clear its error to provide immediate feedback.
   */
  const handleChange = useCallback(
    (field: keyof T, value: any) => {
      setValues((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => {
        if (prev[field] === undefined) return prev;
        const next = { ...prev };
        delete next[field];
        return next;
      });
    },
    []
  );

  /**
   * Mark a field as touched and run field-level validation.
   */
  const handleBlur = useCallback(
    (field: keyof T) => {
      setTouched((prev) => ({ ...prev, [field]: true }));
      setValues((currentValues) => {
        const error = validateField(field, currentValues);
        setErrors((prev) => {
          if (error) {
            return { ...prev, [field]: error };
          }
          const next = { ...prev };
          delete next[field];
          return next;
        });
        return currentValues;
      });
    },
    [validateField]
  );

  /**
   * Validate all fields. If valid, call the optional onSubmit callback.
   * Returns true if the form is valid.
   */
  const handleSubmit = useCallback(
    (onSubmit?: (values: T) => void | Promise<void>): boolean => {
      const result = schema.safeParse(values);

      // Mark all fields as touched
      const allTouched: Partial<Record<keyof T, boolean>> = {};
      for (const key of Object.keys(values)) {
        allTouched[key as keyof T] = true;
      }
      setTouched(allTouched);

      if (result.success) {
        setErrors({});
        if (onSubmit) {
          onSubmit(values);
        }
        return true;
      }

      // Map Zod issues to field-specific error messages
      const newErrors: Partial<Record<keyof T, string>> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof T;
        // Only keep the first error per field
        if (field && !newErrors[field]) {
          newErrors[field] = issue.message;
        }
      }
      setErrors(newErrors);
      return false;
    },
    [schema, values]
  );

  /**
   * Compute isValid by running the schema against current values.
   */
  const isValid = useMemo(() => {
    return schema.safeParse(values).success;
  }, [schema, values]);

  /**
   * Reset form to initial state.
   */
  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
    isValid,
    reset,
  };
}
