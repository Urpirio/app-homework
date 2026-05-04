// Feature: homework-app-integration, Property 17: CSV import parsing extracts valid user records
/**
 * Property 17: CSV import parsing extracts valid user records
 *
 * For any well-formed CSV string with columns fullName, email, and role,
 * the parser should extract exactly as many user records as there are
 * non-header rows, with each record containing non-empty fullName, valid
 * email format, and a role from the allowed enum.
 *
 * **Validates: Requirements 6.6, 12.3**
 */

import {
    parseAndValidateCSV,
    VALID_ROLES,
} from '@/utils/csvUserImport';
import * as fc from 'fast-check';

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/** Generate a non-empty name string (letters and spaces, no commas/newlines) */
const nameArb = fc.stringMatching(/^[a-zA-Z][a-zA-Z ]{1,18}[a-zA-Z]$/)
  .map((s) => s.trim())
  .filter((s) => s.length >= 2);

/** Generate a valid email address */
const emailArb = fc
  .tuple(
    fc.stringMatching(/^[a-z0-9]{2,10}$/),
    fc.stringMatching(/^[a-z]{2,8}$/),
    fc.constantFrom('com', 'org', 'edu', 'net'),
  )
  .map(([local, domain, tld]) => `${local}@${domain}.${tld}`);

/** Generate a valid role from the allowed enum */
const roleArb = fc.constantFrom(...VALID_ROLES);

/** Generate a single valid CSV data row (no header) */
const validRowArb = fc
  .tuple(nameArb, emailArb, roleArb)
  .map(([name, email, role]) => `${name},${email},${role}`);

/** Build a complete CSV string from an array of data rows */
function buildCSV(rows: string[]): string {
  return ['fullName,email,role', ...rows].join('\n');
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Property 17: CSV import parsing extracts valid user records', () => {
  it('extracts exactly as many records as non-header rows for valid CSV', () => {
    fc.assert(
      fc.property(
        fc.array(validRowArb, { minLength: 1, maxLength: 20 }).filter((rows) => {
          // Ensure unique emails so no duplicates
          const emails = rows.map((r) => r.split(',')[1].toLowerCase());
          return new Set(emails).size === emails.length;
        }),
        (rows) => {
          const csv = buildCSV(rows);
          const result = parseAndValidateCSV(csv);

          expect(result.totalRows).toBe(rows.length);
          expect(result.missingColumns).toHaveLength(0);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('all valid rows have non-empty fullName, valid email, and allowed role', () => {
    fc.assert(
      fc.property(
        fc.array(validRowArb, { minLength: 1, maxLength: 15 }).filter((rows) => {
          const emails = rows.map((r) => r.split(',')[1].toLowerCase());
          return new Set(emails).size === emails.length;
        }),
        (rows) => {
          const csv = buildCSV(rows);
          const result = parseAndValidateCSV(csv);

          for (const validated of result.rows) {
            if (validated.valid) {
              expect(validated.row.fullName.length).toBeGreaterThan(0);
              expect(validated.row.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
              expect(VALID_ROLES).toContain(validated.row.role);
            }
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('valid rows with unique emails all pass validation', () => {
    fc.assert(
      fc.property(
        fc.array(validRowArb, { minLength: 1, maxLength: 15 }).filter((rows) => {
          const emails = rows.map((r) => r.split(',')[1].toLowerCase());
          return new Set(emails).size === emails.length;
        }),
        (rows) => {
          const csv = buildCSV(rows);
          const result = parseAndValidateCSV(csv);

          expect(result.validCount).toBe(rows.length);
          expect(result.invalidCount).toBe(0);
          expect(result.duplicateCount).toBe(0);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('detects missing required columns', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('fullName,email', 'email,role', 'fullName,role', 'email'),
        fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 5 }),
        (header, dataRows) => {
          const csv = [header, ...dataRows].join('\n');
          const result = parseAndValidateCSV(csv);

          expect(result.missingColumns.length).toBeGreaterThan(0);
          expect(result.totalRows).toBe(0);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('detects duplicate emails within the CSV', () => {
    fc.assert(
      fc.property(
        nameArb,
        nameArb,
        emailArb,
        roleArb,
        roleArb,
        (name1, name2, email, role1, role2) => {
          const csv = buildCSV([
            `${name1},${email},${role1}`,
            `${name2},${email},${role2}`,
          ]);
          const result = parseAndValidateCSV(csv);

          expect(result.totalRows).toBe(2);
          expect(result.duplicateCount).toBeGreaterThanOrEqual(1);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('detects duplicate emails against existing users', () => {
    fc.assert(
      fc.property(nameArb, emailArb, roleArb, (name, email, role) => {
        const csv = buildCSV([`${name},${email},${role}`]);
        const existingEmails = new Set([email.toLowerCase()]);
        const result = parseAndValidateCSV(csv, existingEmails);

        expect(result.totalRows).toBe(1);
        expect(result.duplicateCount).toBe(1);
        expect(result.rows[0].duplicate).toBe(true);
      }),
      { numRuns: 100 },
    );
  });
});
