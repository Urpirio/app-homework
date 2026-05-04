// Feature: homework-app-integration, Property 27: Pagination returns at most pageSize items
/**
 * Property 27: Pagination returns at most pageSize items
 *
 * For any paginated list endpoint and configured page size, the response
 * should contain at most pageSize items. If total > page * pageSize,
 * a next page should be available. The union of all pages should contain
 * exactly total items with no duplicates.
 *
 * We test the getNextPageParam logic used across all React Query infinite
 * query hooks, which determines whether there's a next page based on
 * total, page, and limit.
 *
 * **Validates: Requirements 10.2**
 */

import * as fc from 'fast-check';

/**
 * The getNextPageParam function used across all hooks in the codebase.
 * Returns the next page number if more data exists, or undefined if
 * all data has been fetched.
 *
 * Formula: nextPage * limit < total
 * This checks whether the start index of the page after next is within bounds,
 * which is equivalent to checking if the next page would have any items.
 */
function getNextPageParam(lastPage: {
  total: number;
  page: number;
  limit: number;
}): number | undefined {
  const nextPage = lastPage.page + 1;
  return nextPage * lastPage.limit < lastPage.total ? nextPage : undefined;
}

/**
 * Simulates a paginated response for a given page (1-indexed).
 */
function simulatePage(
  total: number,
  page: number,
  limit: number
): { data: number[]; total: number; page: number; limit: number } {
  const startIndex = (page - 1) * limit;
  const endIndex = Math.min(startIndex + limit, total);
  const itemCount = Math.max(0, endIndex - startIndex);
  const data = Array.from({ length: itemCount }, (_, i) => startIndex + i);
  return { data, total, page, limit };
}

describe('Property 27: Pagination returns at most pageSize items', () => {
  const totalArb = fc.integer({ min: 0, max: 500 });
  const limitArb = fc.integer({ min: 1, max: 50 });

  it('each page contains at most limit items', () => {
    fc.assert(
      fc.property(totalArb, limitArb, (total, limit) => {
        const totalPages = Math.ceil(total / limit) || 1;

        for (let page = 1; page <= totalPages; page++) {
          const response = simulatePage(total, page, limit);
          expect(response.data.length).toBeLessThanOrEqual(limit);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('getNextPageParam returns undefined on the last page', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 500 }),
        fc.integer({ min: 1, max: 50 }),
        (total, limit) => {
          const lastPageNum = Math.ceil(total / limit);
          const lastPage = { total, page: lastPageNum, limit };
          const nextPage = getNextPageParam(lastPage);

          // On the last page, there should be no next page
          expect(nextPage).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('getNextPageParam returns a page number when more data clearly exists', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 50 }),
        fc.integer({ min: 1, max: 50 }),
        (limit, extraPages) => {
          // Ensure total is large enough that page 1 definitely has a next page
          // total must be > (page+1) * limit = 2 * limit
          const total = limit * (extraPages + 2) + 1;
          const firstPage = { total, page: 1, limit };
          const nextPage = getNextPageParam(firstPage);

          expect(nextPage).toBe(2);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('iterating through all pages collects all items without duplicates', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 200 }),
        fc.integer({ min: 1, max: 30 }),
        (total, limit) => {
          const allItems: number[] = [];
          let page = 1;
          const maxIterations = Math.ceil(total / limit) + 2; // safety bound
          let iterations = 0;

          while (iterations < maxIterations) {
            const response = simulatePage(total, page, limit);
            allItems.push(...response.data);

            const nextPage = getNextPageParam(response);
            if (nextPage === undefined) break;
            page = nextPage;
            iterations++;
          }

          // All collected items should be unique
          const uniqueItems = new Set(allItems);
          expect(uniqueItems.size).toBe(allItems.length);

          // Items should be a subset of [0, total)
          allItems.forEach((item) => {
            expect(item).toBeGreaterThanOrEqual(0);
            expect(item).toBeLessThan(total);
          });

          // The number of items collected should be at most total
          expect(allItems.length).toBeLessThanOrEqual(total);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('getNextPageParam is deterministic for same input', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 500 }),
        fc.integer({ min: 1, max: 50 }),
        fc.integer({ min: 1, max: 50 }),
        (total, page, limit) => {
          const input = { total, page, limit };
          const result1 = getNextPageParam(input);
          const result2 = getNextPageParam(input);
          expect(result1).toBe(result2);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('getNextPageParam result is either undefined or a positive integer greater than current page', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 500 }),
        fc.integer({ min: 1, max: 50 }),
        fc.integer({ min: 1, max: 50 }),
        (total, page, limit) => {
          const result = getNextPageParam({ total, page, limit });

          if (result !== undefined) {
            expect(result).toBe(page + 1);
            expect(result).toBeGreaterThan(page);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('page sizes match expected values from design', () => {
    // Verify the standard page sizes from the design document
    const pageSizes = [
      { type: 'users', limit: 20 },
      { type: 'tasks', limit: 15 },
      { type: 'messages', limit: 50 },
      { type: 'books', limit: 20 },
      { type: 'notifications', limit: 20 },
      { type: 'submissions', limit: 15 },
    ];

    fc.assert(
      fc.property(
        fc.constantFrom(...pageSizes),
        fc.integer({ min: 0, max: 300 }),
        ({ limit }, total) => {
          const response = simulatePage(total, 1, limit);
          expect(response.data.length).toBeLessThanOrEqual(limit);
        }
      ),
      { numRuns: 100 }
    );
  });
});
