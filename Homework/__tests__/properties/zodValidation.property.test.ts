// Feature: homework-app-integration, Property 24: Client-side validation agrees with Zod schema
/**
 * Property 24: Client-side validation agrees with Zod schema
 *
 * For any input object and its corresponding Zod schema, the validation
 * result (success/failure) should be deterministic, and for any failing
 * input, the error object should contain at least one field-specific
 * error message referencing the invalid field path.
 *
 * **Validates: Requirements 9.1, 9.2, 9.6**
 */

import { institutionSchema, taskSchema, ticketSchema } from '@/validation/schemas';
import * as fc from 'fast-check';

describe('Property 24: Client-side validation agrees with Zod schema', () => {
  describe('taskSchema', () => {
    const validTaskArb = fc.record({
      title: fc.string({ minLength: 1, maxLength: 200 }),
      description: fc.option(fc.string(), { nil: undefined }),
      dueDate: fc.constant(undefined),
      maxGrade: fc.integer({ min: 0, max: 100 }),
      type: fc.constantFrom('ASSIGNMENT' as const, 'EXAM' as const, 'NOTE' as const, 'QUIZ' as const),
      projectId: fc.uuid(),
    });

    it('accepts valid task inputs', () => {
      fc.assert(
        fc.property(validTaskArb, (input) => {
          const result = taskSchema.safeParse(input);
          expect(result.success).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('rejects tasks with empty title', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('ASSIGNMENT' as const, 'EXAM' as const, 'NOTE' as const, 'QUIZ' as const),
          fc.uuid(),
          (type, projectId) => {
            const result = taskSchema.safeParse({
              title: '',
              type,
              projectId,
              maxGrade: 100,
            });
            expect(result.success).toBe(false);
            if (!result.success) {
              const paths = result.error.issues.map((i) => i.path.join('.'));
              expect(paths).toContain('title');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('rejects tasks with maxGrade outside 0-100 range', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.integer({ min: -1000, max: -1 }),
            fc.integer({ min: 101, max: 1000 })
          ),
          fc.uuid(),
          (maxGrade, projectId) => {
            const result = taskSchema.safeParse({
              title: 'Test Task',
              type: 'ASSIGNMENT',
              projectId,
              maxGrade,
            });
            expect(result.success).toBe(false);
            if (!result.success) {
              const paths = result.error.issues.map((i) => i.path.join('.'));
              expect(paths).toContain('maxGrade');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('is deterministic — same input always produces same result', () => {
      fc.assert(
        fc.property(validTaskArb, (input) => {
          const result1 = taskSchema.safeParse(input);
          const result2 = taskSchema.safeParse(input);
          expect(result1.success).toBe(result2.success);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('institutionSchema', () => {
    const validInstitutionArb = fc.record({
      name: fc.string({ minLength: 1, maxLength: 200 }),
      address: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
      logoUrl: fc.option(
        fc.webUrl(),
        { nil: undefined }
      ),
    });

    it('accepts valid institution inputs', () => {
      fc.assert(
        fc.property(validInstitutionArb, (input) => {
          const result = institutionSchema.safeParse(input);
          expect(result.success).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('rejects institutions with empty name', () => {
      fc.assert(
        fc.property(
          fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
          (address) => {
            const result = institutionSchema.safeParse({
              name: '',
              address,
            });
            expect(result.success).toBe(false);
            if (!result.success) {
              const paths = result.error.issues.map((i) => i.path.join('.'));
              expect(paths).toContain('name');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('is deterministic — same input always produces same result', () => {
      fc.assert(
        fc.property(validInstitutionArb, (input) => {
          const result1 = institutionSchema.safeParse(input);
          const result2 = institutionSchema.safeParse(input);
          expect(result1.success).toBe(result2.success);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('ticketSchema', () => {
    const validTicketArb = fc.record({
      title: fc.string({ minLength: 1, maxLength: 200 }),
      description: fc.string({ minLength: 10, maxLength: 2000 }),
      category: fc.constantFrom('Technical', 'Academic', 'Account', 'General'),
    });

    it('accepts valid ticket inputs', () => {
      fc.assert(
        fc.property(validTicketArb, (input) => {
          const result = ticketSchema.safeParse(input);
          expect(result.success).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('rejects tickets with short description', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 200 }),
          fc.string({ minLength: 1, maxLength: 9 }),
          (title, description) => {
            const result = ticketSchema.safeParse({
              title,
              description,
              category: 'Technical',
            });
            expect(result.success).toBe(false);
            if (!result.success) {
              const paths = result.error.issues.map((i) => i.path.join('.'));
              expect(paths).toContain('description');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('rejects tickets with empty title', () => {
      const result = ticketSchema.safeParse({
        title: '',
        description: 'A valid description that is long enough',
        category: 'Technical',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const paths = result.error.issues.map((i) => i.path.join('.'));
        expect(paths).toContain('title');
      }
    });

    it('is deterministic — same input always produces same result', () => {
      fc.assert(
        fc.property(validTicketArb, (input) => {
          const result1 = ticketSchema.safeParse(input);
          const result2 = ticketSchema.safeParse(input);
          expect(result1.success).toBe(result2.success);
        }),
        { numRuns: 100 }
      );
    });
  });
});
