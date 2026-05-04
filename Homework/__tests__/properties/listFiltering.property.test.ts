// Feature: homework-app-integration, Property 18: List filtering returns only matching items
/**
 * Property 18: List filtering returns only matching items
 *
 * For any list of items and any combination of filter parameters (role,
 * status, category, institutionId, search text), every item in the response
 * should satisfy all applied filter criteria. No item violating any filter
 * should appear in the results.
 *
 * **Validates: Requirements 6.2, 15.4, 18.2, 18.4**
 */

import { filterItems, type Filterable, type FilterCriteria } from '@/utils/listFiltering';
import * as fc from 'fast-check';

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const roles = ['STUDENT', 'TEACHER', 'SUPPORT', 'SCHOOL_ADMIN', 'SUPER_ADMIN'] as const;
const statuses = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'ACTIVE', 'RETURNED'] as const;
const categories = ['TECHNICAL', 'ACADEMIC', 'ADMINISTRATIVE', 'FICTION', 'SCIENCE', 'HISTORY'] as const;

const nameArb = fc.stringMatching(/^[a-zA-Z][a-zA-Z ]{1,18}[a-zA-Z]$/)
  .map((s) => s.trim())
  .filter((s) => s.length >= 2);

const itemArb: fc.Arbitrary<Filterable> = fc.record({
  role: fc.constantFrom(...roles),
  status: fc.constantFrom(...statuses),
  category: fc.constantFrom(...categories),
  institutionId: fc.uuid(),
  fullName: nameArb,
  email: fc.tuple(
    fc.stringMatching(/^[a-z0-9]{2,8}$/),
    fc.constantFrom('test.com', 'school.edu', 'org.net'),
  ).map(([local, domain]) => `${local}@${domain}`),
  title: fc.option(nameArb, { nil: undefined }),
});

const criteriaArb: fc.Arbitrary<FilterCriteria> = fc.record({
  role: fc.option(fc.constantFrom(...roles), { nil: undefined }),
  status: fc.option(fc.constantFrom(...statuses), { nil: undefined }),
  category: fc.option(fc.constantFrom(...categories), { nil: undefined }),
  institutionId: fc.option(fc.uuid(), { nil: undefined }),
  search: fc.option(nameArb, { nil: undefined }),
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Property 18: List filtering returns only matching items', () => {
  it('every returned item satisfies all applied filter criteria', () => {
    fc.assert(
      fc.property(
        fc.array(itemArb, { minLength: 0, maxLength: 30 }),
        criteriaArb,
        (items, criteria) => {
          const result = filterItems(items, criteria);

          for (const item of result) {
            if (criteria.role) {
              expect(item.role?.toUpperCase()).toBe(criteria.role.toUpperCase());
            }
            if (criteria.status) {
              expect(item.status?.toUpperCase()).toBe(criteria.status.toUpperCase());
            }
            if (criteria.category) {
              expect(item.category?.toUpperCase()).toBe(criteria.category.toUpperCase());
            }
            if (criteria.institutionId) {
              expect(item.institutionId).toBe(criteria.institutionId);
            }
            if (criteria.search && criteria.search.trim()) {
              const searchLower = criteria.search.trim().toLowerCase();
              const fields = [item.fullName, item.name, item.title, item.email].filter(Boolean) as string[];
              const matches = fields.some((f) => f.toLowerCase().includes(searchLower));
              expect(matches).toBe(true);
            }
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('no item violating any filter appears in the results', () => {
    fc.assert(
      fc.property(
        fc.array(itemArb, { minLength: 1, maxLength: 30 }),
        criteriaArb,
        (items, criteria) => {
          const result = filterItems(items, criteria);
          const resultSet = new Set(result);

          for (const item of items) {
            if (!resultSet.has(item)) {
              // This item was excluded — verify it violates at least one criterion
              let violates = false;

              if (criteria.role && criteria.role.trim()) {
                if (!item.role || item.role.toUpperCase() !== criteria.role.toUpperCase()) {
                  violates = true;
                }
              }
              if (criteria.status && criteria.status.trim()) {
                if (!item.status || item.status.toUpperCase() !== criteria.status.toUpperCase()) {
                  violates = true;
                }
              }
              if (criteria.category && criteria.category.trim()) {
                if (!item.category || item.category.toUpperCase() !== criteria.category.toUpperCase()) {
                  violates = true;
                }
              }
              if (criteria.institutionId && criteria.institutionId.trim()) {
                if (item.institutionId !== criteria.institutionId) {
                  violates = true;
                }
              }
              if (criteria.search && criteria.search.trim()) {
                const searchLower = criteria.search.trim().toLowerCase();
                const fields = [item.fullName, item.name, item.title, item.email].filter(Boolean) as string[];
                if (!fields.some((f) => f.toLowerCase().includes(searchLower))) {
                  violates = true;
                }
              }

              expect(violates).toBe(true);
            }
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('result is a subset of the original list', () => {
    fc.assert(
      fc.property(
        fc.array(itemArb, { minLength: 0, maxLength: 30 }),
        criteriaArb,
        (items, criteria) => {
          const result = filterItems(items, criteria);
          expect(result.length).toBeLessThanOrEqual(items.length);

          for (const item of result) {
            expect(items).toContain(item);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('empty criteria returns all items', () => {
    fc.assert(
      fc.property(
        fc.array(itemArb, { minLength: 0, maxLength: 20 }),
        (items) => {
          const result = filterItems(items, {});
          expect(result).toHaveLength(items.length);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('filtering is idempotent — filtering twice gives the same result', () => {
    fc.assert(
      fc.property(
        fc.array(itemArb, { minLength: 0, maxLength: 20 }),
        criteriaArb,
        (items, criteria) => {
          const first = filterItems(items, criteria);
          const second = filterItems(first, criteria);
          expect(second).toEqual(first);
        },
      ),
      { numRuns: 100 },
    );
  });
});
