/**
 * CSV User Import Utility
 *
 * Parses CSV files for bulk user enrollment, validates rows,
 * and processes registrations in batched concurrent requests.
 *
 * Validates: Requirements 6.6, 6.7
 */

import Papa from 'papaparse';

/** Required columns in the CSV file */
export const REQUIRED_COLUMNS = ['fullName', 'email', 'role'] as const;

/** Optional columns that may be present */
export const OPTIONAL_COLUMNS = [
  'classroomId',
  'institutionId',
  'parentName',
  'parentPhone',
] as const;

/** All recognized columns */
export const ALL_COLUMNS = [...REQUIRED_COLUMNS, ...OPTIONAL_COLUMNS] as const;

/** Valid roles for CSV import */
export const VALID_ROLES = ['STUDENT', 'TEACHER', 'SUPPORT', 'SCHOOL_ADMIN'] as const;

export interface CSVUserRow {
  fullName: string;
  email: string;
  role: string;
  classroomId?: string;
  institutionId?: string;
  parentName?: string;
  parentPhone?: string;
}

export interface ValidatedRow {
  row: CSVUserRow;
  rowIndex: number;
  valid: boolean;
  errors: string[];
  duplicate: boolean;
}

export interface CSVParseResult {
  rows: ValidatedRow[];
  totalRows: number;
  validCount: number;
  invalidCount: number;
  duplicateCount: number;
  missingColumns: string[];
}

export interface ImportProgress {
  total: number;
  completed: number;
  succeeded: number;
  failed: number;
  skipped: number;
  errors: Array<{ rowIndex: number; email: string; error: string }>;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Parse a CSV string and validate each row for user import.
 *
 * @param csvContent - Raw CSV string content
 * @param existingEmails - Set of emails already in the system for duplicate detection
 * @returns Parsed and validated rows with summary counts
 */
export function parseAndValidateCSV(
  csvContent: string,
  existingEmails: Set<string> = new Set()
): CSVParseResult {
  const parsed = Papa.parse<Record<string, string>>(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  });

  const headers = parsed.meta.fields || [];
  const missingColumns = REQUIRED_COLUMNS.filter(
    (col) => !headers.includes(col)
  );

  if (missingColumns.length > 0) {
    return {
      rows: [],
      totalRows: 0,
      validCount: 0,
      invalidCount: 0,
      duplicateCount: 0,
      missingColumns,
    };
  }

  const seenEmails = new Set<string>();
  const rows: ValidatedRow[] = parsed.data.map((rawRow, index) => {
    const row: CSVUserRow = {
      fullName: (rawRow.fullName || '').trim(),
      email: (rawRow.email || '').trim().toLowerCase(),
      role: (rawRow.role || '').trim().toUpperCase(),
      classroomId: rawRow.classroomId?.trim() || undefined,
      institutionId: rawRow.institutionId?.trim() || undefined,
      parentName: rawRow.parentName?.trim() || undefined,
      parentPhone: rawRow.parentPhone?.trim() || undefined,
    };

    const errors: string[] = [];

    // Validate required fields
    if (!row.fullName) {
      errors.push('fullName is required');
    }
    if (!row.email) {
      errors.push('email is required');
    } else if (!EMAIL_REGEX.test(row.email)) {
      errors.push('Invalid email format');
    }
    if (!row.role) {
      errors.push('role is required');
    } else if (!VALID_ROLES.includes(row.role as (typeof VALID_ROLES)[number])) {
      errors.push(`Invalid role: ${row.role}. Must be one of: ${VALID_ROLES.join(', ')}`);
    }

    // Check for duplicates within the CSV itself
    const isDuplicateInCSV = seenEmails.has(row.email);
    if (row.email) {
      seenEmails.add(row.email);
    }

    // Check for duplicates against existing users
    const isDuplicateExisting = existingEmails.has(row.email);
    const duplicate = isDuplicateInCSV || isDuplicateExisting;

    if (isDuplicateInCSV) {
      errors.push('Duplicate email within CSV');
    }
    if (isDuplicateExisting) {
      errors.push('User already exists');
    }

    return {
      row,
      rowIndex: index + 1, // 1-based for display
      valid: errors.length === 0 && !duplicate,
      errors,
      duplicate,
    };
  });

  const validCount = rows.filter((r) => r.valid).length;
  const invalidCount = rows.filter((r) => !r.valid && !r.duplicate).length;
  const duplicateCount = rows.filter((r) => r.duplicate).length;

  return {
    rows,
    totalRows: rows.length,
    validCount,
    invalidCount,
    duplicateCount,
    missingColumns: [],
  };
}

/**
 * Process validated rows by sending batched registration requests.
 * Processes up to `concurrency` requests at a time.
 *
 * @param validRows - Array of validated rows to register
 * @param registerFn - Function that registers a single user (e.g., POST /auth/register)
 * @param onProgress - Callback for progress updates
 * @param concurrency - Max concurrent requests (default: 10)
 */
export async function processBatchRegistration(
  validRows: ValidatedRow[],
  registerFn: (row: CSVUserRow) => Promise<void>,
  onProgress: (progress: ImportProgress) => void,
  concurrency: number = 10
): Promise<ImportProgress> {
  const progress: ImportProgress = {
    total: validRows.length,
    completed: 0,
    succeeded: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };

  onProgress({ ...progress });

  // Process in batches of `concurrency`
  for (let i = 0; i < validRows.length; i += concurrency) {
    const batch = validRows.slice(i, i + concurrency);

    const results = await Promise.allSettled(
      batch.map(async (validatedRow) => {
        try {
          await registerFn(validatedRow.row);
          return { success: true, row: validatedRow };
        } catch (error: any) {
          return {
            success: false,
            row: validatedRow,
            error: error.response?.data?.message || error.message || 'Registration failed',
          };
        }
      })
    );

    for (const result of results) {
      progress.completed++;
      if (result.status === 'fulfilled') {
        if (result.value.success) {
          progress.succeeded++;
        } else {
          progress.failed++;
          progress.errors.push({
            rowIndex: result.value.row.rowIndex,
            email: result.value.row.row.email,
            error: result.value.error || 'Unknown error',
          });
        }
      } else {
        progress.failed++;
      }
    }

    onProgress({ ...progress });
  }

  return progress;
}
