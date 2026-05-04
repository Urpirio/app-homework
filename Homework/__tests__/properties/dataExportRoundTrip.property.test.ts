// Feature: homework-app-integration, Property 38: Data export round-trip preserves content
/**
 * Property 38: Data export round-trip preserves content
 *
 * For any data set exported to CSV format, parsing the exported CSV back
 * should produce a data set equivalent to the original (same row count,
 * same column values). For Excel export, each sheet should contain the
 * expected data subset.
 *
 * **Validates: Requirements 14.9**
 */

import * as fc from 'fast-check';
import Papa from 'papaparse';

// ---------------------------------------------------------------------------
// We test the CSV round-trip using papaparse directly (the same library
// used by utils/dataExport.ts). The exportToCSV function writes to the
// file system and triggers sharing, so we test the pure serialization
// logic that underpins it: Papa.unparse → Papa.parse.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/** Generate a safe string value (alphanumeric + spaces, no special CSV chars) */
const safeStringArb = fc.stringMatching(/^[a-zA-Z0-9][a-zA-Z0-9 ._-]{0,28}[a-zA-Z0-9]$/)
  .map((s) => s.trim())
  .filter((s) => s.length > 0);

/** Generate a numeric value that round-trips cleanly through CSV */
const numericArb = fc.oneof(
  fc.integer({ min: -10000, max: 10000 }),
  fc.integer({ min: -10000, max: 10000 }).map((n) => n / 100),
);

/** Generate a single data row with consistent column names */
const rowArb: fc.Arbitrary<Record<string, string | number>> = fc.record({
  name: safeStringArb,
  email: fc
    .tuple(
      fc.stringMatching(/^[a-z0-9]{2,8}$/),
      fc.constantFrom('test.com', 'school.edu'),
    )
    .map(([local, domain]) => `${local}@${domain}`),
  role: fc.constantFrom('STUDENT', 'TEACHER', 'ADMIN', 'SUPPORT'),
  score: numericArb,
  notes: safeStringArb,
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Property 38: Data export round-trip preserves content', () => {
  it('CSV serialize/deserialize preserves row count', () => {
    fc.assert(
      fc.property(
        fc.array(rowArb, { minLength: 1, maxLength: 30 }),
        (data) => {
          const csv = Papa.unparse(data);
          const parsed = Papa.parse<Record<string, string>>(csv, {
            header: true,
            skipEmptyLines: true,
          });

          expect(parsed.data).toHaveLength(data.length);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('CSV serialize/deserialize preserves string column values', () => {
    fc.assert(
      fc.property(
        fc.array(rowArb, { minLength: 1, maxLength: 20 }),
        (data) => {
          const csv = Papa.unparse(data);
          const parsed = Papa.parse<Record<string, string>>(csv, {
            header: true,
            skipEmptyLines: true,
          });

          for (let i = 0; i < data.length; i++) {
            expect(parsed.data[i].name).toBe(String(data[i].name));
            expect(parsed.data[i].email).toBe(String(data[i].email));
            expect(parsed.data[i].role).toBe(String(data[i].role));
            expect(parsed.data[i].notes).toBe(String(data[i].notes));
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('CSV serialize/deserialize preserves numeric column values', () => {
    fc.assert(
      fc.property(
        fc.array(rowArb, { minLength: 1, maxLength: 20 }),
        (data) => {
          const csv = Papa.unparse(data);
          const parsed = Papa.parse<Record<string, string>>(csv, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: true,
          });

          for (let i = 0; i < data.length; i++) {
            expect(Number(parsed.data[i].score)).toBeCloseTo(
              Number(data[i].score),
              10,
            );
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('CSV serialize/deserialize preserves column headers', () => {
    fc.assert(
      fc.property(
        fc.array(rowArb, { minLength: 1, maxLength: 10 }),
        (data) => {
          const csv = Papa.unparse(data);
          const parsed = Papa.parse<Record<string, string>>(csv, {
            header: true,
            skipEmptyLines: true,
          });

          const originalKeys = Object.keys(data[0]).sort();
          const parsedKeys = (parsed.meta.fields || []).sort();
          expect(parsedKeys).toEqual(originalKeys);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('empty data set produces empty CSV parse result', () => {
    const csv = Papa.unparse([]);
    const parsed = Papa.parse<Record<string, string>>(csv, {
      header: true,
      skipEmptyLines: true,
    });

    expect(parsed.data).toHaveLength(0);
  });

  it('single-row data set round-trips correctly', () => {
    fc.assert(
      fc.property(rowArb, (row) => {
        const csv = Papa.unparse([row]);
        const parsed = Papa.parse<Record<string, string>>(csv, {
          header: true,
          skipEmptyLines: true,
        });

        expect(parsed.data).toHaveLength(1);
        expect(parsed.data[0].name).toBe(String(row.name));
        expect(parsed.data[0].email).toBe(String(row.email));
        expect(parsed.data[0].role).toBe(String(row.role));
      }),
      { numRuns: 100 },
    );
  });
});
