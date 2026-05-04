/**
 * List Filtering Utilities
 *
 * Pure filtering functions for client-side list filtering across
 * users, tickets, books, and notifications.
 *
 * Feature: homework-app-integration, Property 18: List filtering returns only matching items
 * Validates: Requirements 6.2, 15.4, 18.2, 18.4
 */

export interface FilterCriteria {
  role?: string;
  status?: string;
  category?: string;
  institutionId?: string;
  search?: string;
}

export interface Filterable {
  role?: string;
  status?: string;
  category?: string;
  institutionId?: string;
  fullName?: string;
  name?: string;
  title?: string;
  email?: string;
  [key: string]: unknown;
}

/**
 * Apply filter criteria to a list of items.
 * Every item in the result satisfies ALL applied filter criteria.
 * Empty or undefined filter values are ignored.
 *
 * @param items - Array of items to filter
 * @param criteria - Filter criteria to apply
 * @returns Filtered array where every item matches all non-empty criteria
 */
export function filterItems<T extends Filterable>(
  items: T[],
  criteria: FilterCriteria,
): T[] {
  return items.filter((item) => {
    // Role filter: exact match (case-insensitive)
    if (criteria.role && criteria.role.trim()) {
      if (!item.role || item.role.toUpperCase() !== criteria.role.toUpperCase()) {
        return false;
      }
    }

    // Status filter: exact match (case-insensitive)
    if (criteria.status && criteria.status.trim()) {
      if (!item.status || item.status.toUpperCase() !== criteria.status.toUpperCase()) {
        return false;
      }
    }

    // Category filter: exact match (case-insensitive)
    if (criteria.category && criteria.category.trim()) {
      if (!item.category || item.category.toUpperCase() !== criteria.category.toUpperCase()) {
        return false;
      }
    }

    // Institution filter: exact match
    if (criteria.institutionId && criteria.institutionId.trim()) {
      if (item.institutionId !== criteria.institutionId) {
        return false;
      }
    }

    // Search text: case-insensitive substring match against searchable fields
    if (criteria.search && criteria.search.trim()) {
      const searchLower = criteria.search.trim().toLowerCase();
      const searchableFields = [
        item.fullName,
        item.name,
        item.title,
        item.email,
      ].filter(Boolean) as string[];

      const matchesSearch = searchableFields.some((field) =>
        field.toLowerCase().includes(searchLower),
      );

      if (!matchesSearch) {
        return false;
      }
    }

    return true;
  });
}
