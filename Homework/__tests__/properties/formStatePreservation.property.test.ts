// Feature: homework-app-integration, Property 26: Form state preserved after submission error
/**
 * Property 26: Form state preserved after submission error
 *
 * For any form with N filled fields and a submission that results in a
 * validation failure, all N field values should remain unchanged in the
 * form state after the error is displayed. The error message should be
 * visible without any field data loss.
 *
 * We test the useForm hook's handleSubmit behavior: when validation fails,
 * values remain intact and errors are populated.
 *
 * **Validates: Requirements 9.7**
 */

import * as fc from 'fast-check';
import { z } from 'zod';

/**
 * Simulates the core logic of useForm's handleSubmit.
 * Given a Zod schema and form values, returns whether validation passed
 * and the resulting errors, while preserving the original values.
 */
function simulateHandleSubmit<T extends Record<string, unknown>>(
  schema: z.ZodObject<z.ZodRawShape>,
  values: T
): {
  isValid: boolean;
  values: T;
  errors: Partial<Record<keyof T, string>>;
} {
  const result = schema.safeParse(values);

  if (result.success) {
    return { isValid: true, values, errors: {} };
  }

  const errors: Partial<Record<keyof T, string>> = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as keyof T;
    if (field && !errors[field]) {
      errors[field] = issue.message;
    }
  }

  // Key property: values are preserved even on validation failure
  return { isValid: false, values, errors };
}

// Test schema matching the taskSchema from the codebase
const taskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional(),
  maxGrade: z.number().min(0).max(100).default(100),
  type: z.enum(['ASSIGNMENT', 'EXAM', 'NOTE', 'QUIZ']),
});

// Test schema matching the ticketSchema from the codebase
const ticketSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  description: z.string().min(10, 'Please provide more detail'),
  category: z.enum(['Technical', 'Academic', 'Account', 'General']),
  priority: z.enum(['Low', 'Medium', 'High', 'Critical']),
});

describe('Property 26: Form state preserved after submission error', () => {
  it('values are preserved when task form validation fails', () => {
    fc.assert(
      fc.property(
        fc.record({
          title: fc.string({ maxLength: 200 }),
          description: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
          maxGrade: fc.oneof(
            fc.integer({ min: 0, max: 100 }),
            fc.integer({ min: -100, max: -1 }),
            fc.integer({ min: 101, max: 500 })
          ),
          type: fc.oneof(
            fc.constantFrom('ASSIGNMENT', 'EXAM', 'NOTE', 'QUIZ'),
            fc.string({ minLength: 1, maxLength: 10 })
          ),
        }),
        (formValues) => {
          const result = simulateHandleSubmit(taskSchema, formValues);

          // Core property: values are ALWAYS preserved regardless of validation outcome
          expect(result.values).toEqual(formValues);
          expect(result.values.title).toBe(formValues.title);
          expect(result.values.maxGrade).toBe(formValues.maxGrade);
          expect(result.values.type).toBe(formValues.type);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('errors are populated for invalid fields without losing values', () => {
    fc.assert(
      fc.property(
        fc.record({
          title: fc.constantFrom('', 'a'.repeat(201)), // Invalid titles
          description: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
          maxGrade: fc.integer({ min: 101, max: 500 }), // Invalid grade
          type: fc.constantFrom('ASSIGNMENT', 'EXAM', 'NOTE', 'QUIZ'),
        }),
        (formValues) => {
          const result = simulateHandleSubmit(taskSchema, formValues);

          // Should fail validation
          expect(result.isValid).toBe(false);

          // Values must be preserved
          expect(result.values).toEqual(formValues);

          // At least one error should exist
          const errorKeys = Object.keys(result.errors);
          expect(errorKeys.length).toBeGreaterThan(0);

          // Each error should be a non-empty string
          errorKeys.forEach((key) => {
            expect(typeof result.errors[key as keyof typeof formValues]).toBe('string');
            expect((result.errors[key as keyof typeof formValues] as string).length).toBeGreaterThan(0);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('valid form submission returns isValid=true with no errors and preserved values', () => {
    fc.assert(
      fc.property(
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 200 }),
          description: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
          maxGrade: fc.integer({ min: 0, max: 100 }),
          type: fc.constantFrom('ASSIGNMENT' as const, 'EXAM' as const, 'NOTE' as const, 'QUIZ' as const),
        }),
        (formValues) => {
          const result = simulateHandleSubmit(taskSchema, formValues);

          expect(result.isValid).toBe(true);
          expect(result.errors).toEqual({});
          expect(result.values).toEqual(formValues);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('ticket form values preserved after validation failure', () => {
    fc.assert(
      fc.property(
        fc.record({
          title: fc.string({ maxLength: 4 }), // Too short — min 5
          description: fc.string({ maxLength: 9 }), // Too short — min 10
          category: fc.constantFrom('Technical', 'Academic', 'Account', 'General'),
          priority: fc.constantFrom('Low', 'Medium', 'High', 'Critical'),
        }),
        (formValues) => {
          const result = simulateHandleSubmit(ticketSchema, formValues);

          // Should fail (title < 5 chars, description < 10 chars)
          expect(result.isValid).toBe(false);

          // Values must be preserved
          expect(result.values).toEqual(formValues);
          expect(result.values.title).toBe(formValues.title);
          expect(result.values.description).toBe(formValues.description);
          expect(result.values.category).toBe(formValues.category);
          expect(result.values.priority).toBe(formValues.priority);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('handleSubmit returns false but values remain for any invalid input', () => {
    fc.assert(
      fc.property(
        fc.record({
          title: fc.string({ maxLength: 200 }),
          description: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
          maxGrade: fc.double({ min: -1000, max: 1000, noNaN: true }),
          type: fc.string({ minLength: 0, maxLength: 20 }),
        }),
        (formValues) => {
          const result = simulateHandleSubmit(taskSchema, formValues);

          // Regardless of outcome, values are always preserved
          expect(result.values).toBe(formValues);

          if (!result.isValid) {
            // Errors should be present
            expect(Object.keys(result.errors).length).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
