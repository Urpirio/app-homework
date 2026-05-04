// Feature: homework-app-integration, Property 7: Teacher student roster contains no duplicates
/**
 * Property 7: Teacher student roster contains no duplicates
 *
 * For any teacher with students across multiple subjects and classrooms,
 * the student list returned by GET /teachers/{id}/students should contain
 * no duplicate student IDs, even when the same student appears in multiple subjects.
 *
 * **Validates: Requirements 3.6**
 */

import * as fc from 'fast-check';
import { deduplicateStudents } from '../../utils/gradingStats';

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

interface StudentRecord {
  id: string;
  fullName: string;
  email: string;
  classroomId: string;
  classroomName: string;
}

const studentArb: fc.Arbitrary<StudentRecord> = fc.record({
  id: fc.uuid(),
  fullName: fc.string({ minLength: 1, maxLength: 30 }),
  email: fc.emailAddress(),
  classroomId: fc.uuid(),
  classroomName: fc.string({ minLength: 1, maxLength: 20 }),
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Property 7: Teacher student roster contains no duplicates', () => {
  it('deduplicateStudents removes all duplicate IDs', () => {
    fc.assert(
      fc.property(
        fc.array(studentArb, { minLength: 0, maxLength: 30 }),
        (students) => {
          const result = deduplicateStudents(students);
          const ids = result.map((s) => s.id);
          const uniqueIds = new Set(ids);
          expect(uniqueIds.size).toBe(ids.length);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('deduplicateStudents preserves all unique students', () => {
    fc.assert(
      fc.property(
        fc.array(studentArb, { minLength: 0, maxLength: 30 }),
        (students) => {
          const result = deduplicateStudents(students);
          const inputUniqueIds = new Set(students.map((s) => s.id));
          const outputIds = new Set(result.map((s) => s.id));
          // Every unique ID from input should appear in output
          expect(outputIds.size).toBe(inputUniqueIds.size);
          for (const id of inputUniqueIds) {
            expect(outputIds.has(id)).toBe(true);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('deduplicateStudents keeps first occurrence of each duplicate', () => {
    fc.assert(
      fc.property(
        fc.array(studentArb, { minLength: 1, maxLength: 20 }),
        (students) => {
          const result = deduplicateStudents(students);
          // For each student in result, it should be the first occurrence in input
          for (const student of result) {
            const firstInInput = students.find((s) => s.id === student.id);
            expect(firstInInput).toBeDefined();
            expect(student.fullName).toBe(firstInInput!.fullName);
            expect(student.email).toBe(firstInInput!.email);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('deduplicateStudents handles lists with all duplicates', () => {
    fc.assert(
      fc.property(
        studentArb,
        fc.integer({ min: 2, max: 10 }),
        (student, count) => {
          const duplicates = Array.from({ length: count }, () => ({ ...student }));
          const result = deduplicateStudents(duplicates);
          expect(result).toHaveLength(1);
          expect(result[0].id).toBe(student.id);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('deduplicateStudents returns empty array for empty input', () => {
    const result = deduplicateStudents([]);
    expect(result).toHaveLength(0);
  });
});
