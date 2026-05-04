/**
 * Unit tests for data export utilities (CSV, Excel, PDF).
 *
 * Validates: Requirements 14.9
 * Design: Analytics & Visualization Design — Data Export Design
 */

// ─── Mocks (must be before imports) ──────────────────────────────────────────

const mockWriteAsStringAsync = jest.fn().mockResolvedValue(undefined);
const mockMoveAsync = jest.fn().mockResolvedValue(undefined);

jest.mock('expo-file-system', () => ({
  cacheDirectory: '/cache/',
  EncodingType: { UTF8: 'utf8', Base64: 'base64' },
  writeAsStringAsync: (...args: unknown[]) => mockWriteAsStringAsync(...args),
  moveAsync: (...args: unknown[]) => mockMoveAsync(...args),
}));

const mockShareAsync = jest.fn().mockResolvedValue(undefined);

jest.mock('expo-sharing', () => ({
  shareAsync: (...args: unknown[]) => mockShareAsync(...args),
}));

const mockPrintToFileAsync = jest
  .fn()
  .mockResolvedValue({ uri: '/tmp/print-output.pdf' });

jest.mock('expo-print', () => ({
  printToFileAsync: (...args: unknown[]) => mockPrintToFileAsync(...args),
}));

// papaparse and xlsx use their real implementations — no mocking needed

import { exportToCSV, exportToExcel, exportToPDF } from '../dataExport';

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── CSV Export ──────────────────────────────────────────────────────────────

describe('exportToCSV', () => {
  const sampleData = [
    { name: 'Alice', grade: 90 },
    { name: 'Bob', grade: 75 },
  ];

  it('writes a CSV file and shares it', async () => {
    const result = await exportToCSV(sampleData, 'grades-report');

    expect(result.success).toBe(true);
    expect(result.filePath).toBe('/cache/grades-report.csv');

    // Verify file was written with CSV content
    expect(mockWriteAsStringAsync).toHaveBeenCalledTimes(1);
    const [filePath, content, options] = mockWriteAsStringAsync.mock.calls[0];
    expect(filePath).toBe('/cache/grades-report.csv');
    expect(content).toContain('name');
    expect(content).toContain('Alice');
    expect(content).toContain('Bob');
    expect(options.encoding).toBe('utf8');

    // Verify sharing was triggered
    expect(mockShareAsync).toHaveBeenCalledWith('/cache/grades-report.csv', {
      mimeType: 'text/csv',
      dialogTitle: 'Exportar grades-report',
      UTI: 'public.comma-separated-values-text',
    });
  });

  it('sanitizes the filename', async () => {
    const result = await exportToCSV(sampleData, 'my report/2024');

    expect(result.success).toBe(true);
    expect(result.filePath).toBe('/cache/my_report_2024.csv');
  });

  it('handles empty data array', async () => {
    const result = await exportToCSV([], 'empty');

    expect(result.success).toBe(true);
    expect(mockWriteAsStringAsync).toHaveBeenCalledTimes(1);
  });

  it('returns error on write failure', async () => {
    mockWriteAsStringAsync.mockRejectedValueOnce(new Error('Disk full'));

    const result = await exportToCSV(sampleData, 'fail');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Disk full');
  });
});

// ─── Excel Export ────────────────────────────────────────────────────────────

describe('exportToExcel', () => {
  const sampleData = [
    { name: 'Alice', grade: 90 },
    { name: 'Bob', grade: 75 },
  ];

  it('writes an xlsx file and shares it', async () => {
    const result = await exportToExcel(sampleData, 'grades');

    expect(result.success).toBe(true);
    expect(result.filePath).toBe('/cache/grades.xlsx');

    // Verify file was written as base64
    expect(mockWriteAsStringAsync).toHaveBeenCalledTimes(1);
    const [filePath, , options] = mockWriteAsStringAsync.mock.calls[0];
    expect(filePath).toBe('/cache/grades.xlsx');
    expect(options.encoding).toBe('base64');

    // Verify sharing was triggered with correct MIME type
    expect(mockShareAsync).toHaveBeenCalledWith('/cache/grades.xlsx', {
      mimeType:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      dialogTitle: 'Exportar grades',
      UTI: 'org.openxmlformats.spreadsheetml.sheet',
    });
  });

  it('supports multi-sheet export', async () => {
    const multiSheetData = {
      Students: [{ name: 'Alice' }],
      Grades: [{ subject: 'Math', grade: 90 }],
    };

    const result = await exportToExcel(multiSheetData, 'report');

    expect(result.success).toBe(true);
    expect(result.filePath).toBe('/cache/report.xlsx');
    expect(mockWriteAsStringAsync).toHaveBeenCalledTimes(1);
  });

  it('returns error on failure', async () => {
    mockWriteAsStringAsync.mockRejectedValueOnce(new Error('Write error'));

    const result = await exportToExcel(sampleData, 'fail');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Write error');
  });
});

// ─── PDF Export ──────────────────────────────────────────────────────────────

describe('exportToPDF', () => {
  const html = '<html><body><h1>Report</h1></body></html>';

  it('generates a PDF from HTML and shares it', async () => {
    const result = await exportToPDF(html, 'report');

    expect(result.success).toBe(true);
    expect(result.filePath).toBe('/cache/report.pdf');

    // Verify expo-print was called with the HTML
    expect(mockPrintToFileAsync).toHaveBeenCalledWith({ html });

    // Verify the file was moved to the desired path
    expect(mockMoveAsync).toHaveBeenCalledWith({
      from: '/tmp/print-output.pdf',
      to: '/cache/report.pdf',
    });

    // Verify sharing was triggered
    expect(mockShareAsync).toHaveBeenCalledWith('/cache/report.pdf', {
      mimeType: 'application/pdf',
      dialogTitle: 'Exportar report',
      UTI: 'com.adobe.pdf',
    });
  });

  it('returns error when printToFileAsync fails', async () => {
    mockPrintToFileAsync.mockRejectedValueOnce(new Error('Print failed'));

    const result = await exportToPDF(html, 'fail');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Print failed');
  });

  it('returns error when sharing fails', async () => {
    mockShareAsync.mockRejectedValueOnce(new Error('Share cancelled'));

    const result = await exportToPDF(html, 'report');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Share cancelled');
  });
});
