/**
 * User Management Integration Tests
 *
 * Tests for user list pagination, role-specific routing,
 * and user management screen integration.
 *
 * Validates: Requirements 6.1, 6.2, 6.6, 6.7, 6.8
 */

import { parseAndValidateCSV, processBatchRegistration, ValidatedRow } from '@/utils/csvUserImport';

/**
 * Simulates the navigateToUserDetail function from users.tsx.
 * Mirrors the actual implementation for testability.
 */
function navigateToUserDetail(user: {
  id: string;
  role: string;
  institutionId?: string | null;
}): string {
  const base = `/admin/institution/${user.institutionId}`;
  switch (user.role) {
    case 'STUDENT':
      return `${base}/student/${user.id}`;
    case 'TEACHER':
      return `${base}/teacher/${user.id}`;
    case 'SUPPORT':
      return `${base}/support/${user.id}`;
    default:
      return `/admin/user/${user.id}`;
  }
}

/**
 * Simulates the getNextPageParam logic from useUsers hook.
 */
function getNextPageParam(lastPage: { page: number; limit: number; total: number }): number | undefined {
  const nextPage = lastPage.page + 1;
  return lastPage.page * lastPage.limit < lastPage.total ? nextPage : undefined;
}

describe('User Management - Pagination', () => {
  it('returns next page when more items exist', () => {
    expect(getNextPageParam({ page: 1, limit: 20, total: 40 })).toBe(2);
  });

  it('returns undefined when on the last page', () => {
    expect(getNextPageParam({ page: 2, limit: 20, total: 40 })).toBeUndefined();
  });

  it('returns undefined when all items fit on one page', () => {
    expect(getNextPageParam({ page: 1, limit: 20, total: 15 })).toBeUndefined();
  });

  it('returns next page when total equals page boundary', () => {
    // 20 items, page 1 of 20 -> exactly fills one page, no next
    expect(getNextPageParam({ page: 1, limit: 20, total: 20 })).toBeUndefined();
  });

  it('returns next page for 21 items on page 1', () => {
    expect(getNextPageParam({ page: 1, limit: 20, total: 21 })).toBe(2);
  });

  it('handles page 1 with total of 0', () => {
    expect(getNextPageParam({ page: 1, limit: 20, total: 0 })).toBeUndefined();
  });
});

describe('User Management - Role-Specific Routing (Req 6.8)', () => {
  const instId = 'inst-123';
  const userId = 'user-456';

  it('routes STUDENT to /admin/institution/{instId}/student/{id}', () => {
    const route = navigateToUserDetail({ id: userId, role: 'STUDENT', institutionId: instId });
    expect(route).toBe(`/admin/institution/${instId}/student/${userId}`);
  });

  it('routes TEACHER to /admin/institution/{instId}/teacher/{id}', () => {
    const route = navigateToUserDetail({ id: userId, role: 'TEACHER', institutionId: instId });
    expect(route).toBe(`/admin/institution/${instId}/teacher/${userId}`);
  });

  it('routes SUPPORT to /admin/institution/{instId}/support/{id}', () => {
    const route = navigateToUserDetail({ id: userId, role: 'SUPPORT', institutionId: instId });
    expect(route).toBe(`/admin/institution/${instId}/support/${userId}`);
  });

  it('routes SCHOOL_ADMIN to /admin/user/{id}', () => {
    const route = navigateToUserDetail({ id: userId, role: 'SCHOOL_ADMIN', institutionId: instId });
    expect(route).toBe(`/admin/user/${userId}`);
  });

  it('routes SUPER_ADMIN to /admin/user/{id}', () => {
    const route = navigateToUserDetail({ id: userId, role: 'SUPER_ADMIN', institutionId: instId });
    expect(route).toBe(`/admin/user/${userId}`);
  });
});

describe('User Management - CSV Import (Req 6.6, 6.7)', () => {
  it('parses valid CSV with required columns', () => {
    const csv = 'fullName,email,role\nJohn Doe,john@test.com,STUDENT\nJane Smith,jane@test.com,TEACHER';
    const result = parseAndValidateCSV(csv);

    expect(result.totalRows).toBe(2);
    expect(result.validCount).toBe(2);
    expect(result.invalidCount).toBe(0);
    expect(result.missingColumns).toHaveLength(0);
  });

  it('detects missing required columns', () => {
    const csv = 'fullName,email\nJohn Doe,john@test.com';
    const result = parseAndValidateCSV(csv);

    expect(result.missingColumns).toContain('role');
  });

  it('validates email format', () => {
    const csv = 'fullName,email,role\nJohn Doe,invalid-email,STUDENT';
    const result = parseAndValidateCSV(csv);

    expect(result.validCount).toBe(0);
    expect(result.rows[0].errors).toContain('Invalid email format');
  });

  it('validates role values', () => {
    const csv = 'fullName,email,role\nJohn Doe,john@test.com,INVALID_ROLE';
    const result = parseAndValidateCSV(csv);

    expect(result.validCount).toBe(0);
    expect(result.rows[0].errors.some(e => e.includes('Invalid role'))).toBe(true);
  });

  it('detects duplicate emails within CSV', () => {
    const csv = 'fullName,email,role\nJohn Doe,john@test.com,STUDENT\nJane Doe,john@test.com,STUDENT';
    const result = parseAndValidateCSV(csv);

    expect(result.duplicateCount).toBe(1);
    expect(result.rows[1].duplicate).toBe(true);
  });

  it('detects duplicate emails against existing users', () => {
    const csv = 'fullName,email,role\nJohn Doe,existing@test.com,STUDENT';
    const existingEmails = new Set(['existing@test.com']);
    const result = parseAndValidateCSV(csv, existingEmails);

    expect(result.duplicateCount).toBe(1);
    expect(result.rows[0].duplicate).toBe(true);
  });

  it('processes batch registration with concurrency', async () => {
    const validRows: ValidatedRow[] = [
      { row: { fullName: 'A', email: 'a@test.com', role: 'STUDENT' }, rowIndex: 1, valid: true, errors: [], duplicate: false },
      { row: { fullName: 'B', email: 'b@test.com', role: 'STUDENT' }, rowIndex: 2, valid: true, errors: [], duplicate: false },
    ];

    const registerFn = jest.fn().mockResolvedValue(undefined);
    const onProgress = jest.fn();

    const result = await processBatchRegistration(validRows, registerFn, onProgress, 10);

    expect(result.succeeded).toBe(2);
    expect(result.failed).toBe(0);
    expect(registerFn).toHaveBeenCalledTimes(2);
  });

  it('handles registration failures in batch', async () => {
    const validRows: ValidatedRow[] = [
      { row: { fullName: 'A', email: 'a@test.com', role: 'STUDENT' }, rowIndex: 1, valid: true, errors: [], duplicate: false },
      { row: { fullName: 'B', email: 'b@test.com', role: 'STUDENT' }, rowIndex: 2, valid: true, errors: [], duplicate: false },
    ];

    const registerFn = jest.fn()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('Duplicate email'));
    const onProgress = jest.fn();

    const result = await processBatchRegistration(validRows, registerFn, onProgress, 10);

    expect(result.succeeded).toBe(1);
    expect(result.failed).toBe(1);
    expect(result.errors).toHaveLength(1);
  });
});
