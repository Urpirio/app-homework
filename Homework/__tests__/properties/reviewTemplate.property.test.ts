// Feature: homework-app-integration, Property 37: Review template matches target user role
/**
 * Property 37: Review template matches target user role
 *
 * For any target user with a role (STUDENT or TEACHER), the review template
 * loader should return the template with criteria dimensions matching that
 * role type:
 *   - Students: academic, behavior, participation, homework
 *   - Teachers: teaching_quality, communication, curriculum, engagement
 *
 * Unknown roles default to the STUDENT template.
 *
 * **Validates: Requirements 16.2, 16.6**
 */

import {
    getReviewTemplate,
    STUDENT_TEMPLATE,
    TEACHER_TEMPLATE,
} from '@/constants/reviewTemplates';
import * as fc from 'fast-check';

// ---------------------------------------------------------------------------
// Expected dimension keys
// ---------------------------------------------------------------------------

const STUDENT_DIMENSION_KEYS = ['academic', 'behavior', 'participation', 'homework'];
const TEACHER_DIMENSION_KEYS = ['teaching_quality', 'communication', 'curriculum', 'engagement'];

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const unknownRoleArb = fc
  .string({ minLength: 1, maxLength: 20 })
  .filter((s) => s !== 'STUDENT' && s !== 'TEACHER');

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Property 37: Review template matches target user role', () => {
  it('STUDENT role returns template with student dimensions', () => {
    fc.assert(
      fc.property(
        fc.constant('STUDENT'),
        (role) => {
          const template = getReviewTemplate(role);
          expect(template.role).toBe('STUDENT');
          const keys = template.dimensions.map((d) => d.key);
          expect(keys).toEqual(STUDENT_DIMENSION_KEYS);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('TEACHER role returns template with teacher dimensions', () => {
    fc.assert(
      fc.property(
        fc.constant('TEACHER'),
        (role) => {
          const template = getReviewTemplate(role);
          expect(template.role).toBe('TEACHER');
          const keys = template.dimensions.map((d) => d.key);
          expect(keys).toEqual(TEACHER_DIMENSION_KEYS);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('unknown roles default to student template', () => {
    fc.assert(
      fc.property(
        unknownRoleArb,
        (role) => {
          const template = getReviewTemplate(role);
          expect(template.role).toBe('STUDENT');
          const keys = template.dimensions.map((d) => d.key);
          expect(keys).toEqual(STUDENT_DIMENSION_KEYS);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('student template has exactly 4 dimensions', () => {
    fc.assert(
      fc.property(
        fc.constant('STUDENT'),
        (role) => {
          const template = getReviewTemplate(role);
          expect(template.dimensions).toHaveLength(4);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('teacher template has exactly 4 dimensions', () => {
    fc.assert(
      fc.property(
        fc.constant('TEACHER'),
        (role) => {
          const template = getReviewTemplate(role);
          expect(template.dimensions).toHaveLength(4);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('every dimension has non-empty key, label, and description', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('STUDENT', 'TEACHER'),
        (role) => {
          const template = getReviewTemplate(role);
          for (const dim of template.dimensions) {
            expect(dim.key.length).toBeGreaterThan(0);
            expect(dim.label.length).toBeGreaterThan(0);
            expect(dim.description.length).toBeGreaterThan(0);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('getReviewTemplate is referentially consistent with exported constants', () => {
    fc.assert(
      fc.property(
        fc.constant(null),
        () => {
          const studentResult = getReviewTemplate('STUDENT');
          const teacherResult = getReviewTemplate('TEACHER');
          expect(studentResult).toEqual(STUDENT_TEMPLATE);
          expect(teacherResult).toEqual(TEACHER_TEMPLATE);
        },
      ),
      { numRuns: 100 },
    );
  });
});
