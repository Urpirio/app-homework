/**
 * Data Export Utilities
 *
 * Functions for exporting data to CSV, Excel, and PDF formats.
 * Uses expo-file-system for writing and expo-sharing for sharing.
 *
 * Validates: Requirements 14.9
 * Design: Analytics & Visualization Design — Data Export Design
 */

import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export type ExportFormat = 'csv' | 'excel' | 'pdf';

export interface ExportResult {
  success: boolean;
  filePath?: string;
  error?: string;
}

/**
 * Export data to CSV format using papaparse, write to cache, and share.
 *
 * @param data - Array of objects to serialize. Each object becomes a row;
 *               keys become column headers.
 * @param filename - Base filename without extension.
 * @returns ExportResult indicating success or failure.
 */
export async function exportToCSV(
  data: Record<string, unknown>[],
  filename: string,
): Promise<ExportResult> {
  try {
    const csvString = Papa.unparse(data);
    const filePath = `${FileSystem.cacheDirectory}${sanitizeFilename(filename)}.csv`;

    await FileSystem.writeAsStringAsync(filePath, csvString, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    await Sharing.shareAsync(filePath, {
      mimeType: 'text/csv',
      dialogTitle: `Exportar ${filename}`,
      UTI: 'public.comma-separated-values-text',
    });

    return { success: true, filePath };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al exportar CSV',
    };
  }
}

/**
 * Export data to Excel (.xlsx) format using SheetJS, write to cache, and share.
 *
 * Supports multiple sheets: pass a record where each key is a sheet name
 * and each value is an array of row objects. For a single-sheet export,
 * pass a plain array and it will be placed in a sheet named "Datos".
 *
 * @param data - Row objects or a map of sheet-name → row objects.
 * @param filename - Base filename without extension.
 * @returns ExportResult indicating success or failure.
 */
export async function exportToExcel(
  data: Record<string, unknown>[] | Record<string, Record<string, unknown>[]>,
  filename: string,
): Promise<ExportResult> {
  try {
    const workbook = XLSX.utils.book_new();

    const sheets: Record<string, Record<string, unknown>[]> = Array.isArray(data)
      ? { Datos: data }
      : data;

    for (const [sheetName, rows] of Object.entries(sheets)) {
      const worksheet = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    }

    // Write workbook to base64 string
    const wbOut = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
    const filePath = `${FileSystem.cacheDirectory}${sanitizeFilename(filename)}.xlsx`;

    await FileSystem.writeAsStringAsync(filePath, wbOut, {
      encoding: FileSystem.EncodingType.Base64,
    });

    await Sharing.shareAsync(filePath, {
      mimeType:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      dialogTitle: `Exportar ${filename}`,
      UTI: 'org.openxmlformats.spreadsheetml.sheet',
    });

    return { success: true, filePath };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al exportar Excel',
    };
  }
}

/**
 * Export HTML content to PDF via expo-print, write to cache, and share.
 *
 * The caller is responsible for building the HTML string (including any
 * chart images encoded as base64 data URIs captured via react-native-view-shot).
 *
 * @param htmlContent - Full HTML string to render as PDF.
 * @param filename - Base filename without extension.
 * @returns ExportResult indicating success or failure.
 */
export async function exportToPDF(
  htmlContent: string,
  filename: string,
): Promise<ExportResult> {
  try {
    const { uri } = await Print.printToFileAsync({ html: htmlContent });

    // Move from expo-print's temp location to our cache with the desired name
    const filePath = `${FileSystem.cacheDirectory}${sanitizeFilename(filename)}.pdf`;
    await FileSystem.moveAsync({ from: uri, to: filePath });

    await Sharing.shareAsync(filePath, {
      mimeType: 'application/pdf',
      dialogTitle: `Exportar ${filename}`,
      UTI: 'com.adobe.pdf',
    });

    return { success: true, filePath };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al exportar PDF',
    };
  }
}

/**
 * Sanitize a filename by removing characters that are unsafe for file systems.
 */
function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9_\-]/g, '_');
}
