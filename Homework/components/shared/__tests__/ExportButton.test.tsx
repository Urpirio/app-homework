/**
 * Tests for ExportButton component
 *
 * Validates: Requirements 14.9
 * Design: Analytics & Visualization Design — Data Export Design
 */

import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { useColorScheme } from 'react-native';

import { ExportButton } from '../ExportButton';

// ─── Mocks ───────────────────────────────────────────────────────────────────

jest.mock('react-native/Libraries/Utilities/useColorScheme');

const mockedUseColorScheme = useColorScheme as jest.MockedFunction<
  typeof useColorScheme
>;

const mockExportToCSV = jest.fn().mockResolvedValue({ success: true, filePath: '/cache/test.csv' });
const mockExportToExcel = jest.fn().mockResolvedValue({ success: true, filePath: '/cache/test.xlsx' });
const mockExportToPDF = jest.fn().mockResolvedValue({ success: true, filePath: '/cache/test.pdf' });

jest.mock('@/utils/dataExport', () => ({
  exportToCSV: (...args: unknown[]) => mockExportToCSV(...args),
  exportToExcel: (...args: unknown[]) => mockExportToExcel(...args),
  exportToPDF: (...args: unknown[]) => mockExportToPDF(...args),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockedUseColorScheme.mockReturnValue('light');
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('ExportButton', () => {
  const sampleData = [
    { name: 'Alice', grade: 90 },
    { name: 'Bob', grade: 75 },
  ];

  it('renders the export trigger button', () => {
    const { getByLabelText } = render(<ExportButton data={sampleData} />);
    expect(getByLabelText('Exportar datos')).toBeTruthy();
  });

  it('shows format dropdown when pressed', () => {
    const { getByLabelText, getByText } = render(
      <ExportButton data={sampleData} />,
    );

    fireEvent.press(getByLabelText('Exportar datos'));

    expect(getByText('Formato de exportación')).toBeTruthy();
    expect(getByText('CSV')).toBeTruthy();
    expect(getByText('Excel')).toBeTruthy();
    expect(getByText('PDF')).toBeTruthy();
  });

  it('calls exportToCSV when CSV option is selected', async () => {
    const onExportComplete = jest.fn();
    const { getByLabelText, getByText } = render(
      <ExportButton
        data={sampleData}
        filename="test-report"
        onExportComplete={onExportComplete}
      />,
    );

    fireEvent.press(getByLabelText('Exportar datos'));
    fireEvent.press(getByText('CSV'));

    await waitFor(() => {
      expect(mockExportToCSV).toHaveBeenCalledWith(sampleData, 'test-report');
      expect(onExportComplete).toHaveBeenCalledWith({
        success: true,
        filePath: '/cache/test.csv',
      });
    });
  });

  it('calls exportToExcel when Excel option is selected', async () => {
    const onExportComplete = jest.fn();
    const { getByLabelText, getByText } = render(
      <ExportButton
        data={sampleData}
        filename="test-report"
        onExportComplete={onExportComplete}
      />,
    );

    fireEvent.press(getByLabelText('Exportar datos'));
    fireEvent.press(getByText('Excel'));

    await waitFor(() => {
      expect(mockExportToExcel).toHaveBeenCalledWith(sampleData, 'test-report');
      expect(onExportComplete).toHaveBeenCalledWith({
        success: true,
        filePath: '/cache/test.xlsx',
      });
    });
  });

  it('calls exportToPDF with htmlContent when PDF option is selected', async () => {
    const html = '<html><body><h1>Report</h1></body></html>';
    const onExportComplete = jest.fn();
    const { getByLabelText, getByText } = render(
      <ExportButton
        htmlContent={html}
        filename="test-report"
        onExportComplete={onExportComplete}
      />,
    );

    fireEvent.press(getByLabelText('Exportar datos'));
    fireEvent.press(getByText('PDF'));

    await waitFor(() => {
      expect(mockExportToPDF).toHaveBeenCalledWith(html, 'test-report');
      expect(onExportComplete).toHaveBeenCalledWith({
        success: true,
        filePath: '/cache/test.pdf',
      });
    });
  });

  it('only shows specified formats', () => {
    const { getByLabelText, getByText, queryByText } = render(
      <ExportButton data={sampleData} formats={['csv', 'excel']} />,
    );

    fireEvent.press(getByLabelText('Exportar datos'));

    expect(getByText('CSV')).toBeTruthy();
    expect(getByText('Excel')).toBeTruthy();
    expect(queryByText('PDF')).toBeNull();
  });

  it('handles export error gracefully', async () => {
    mockExportToCSV.mockResolvedValueOnce({
      success: false,
      error: 'Disk full',
    });
    const onExportComplete = jest.fn();

    const { getByLabelText, getByText } = render(
      <ExportButton
        data={sampleData}
        onExportComplete={onExportComplete}
      />,
    );

    fireEvent.press(getByLabelText('Exportar datos'));
    fireEvent.press(getByText('CSV'));

    await waitFor(() => {
      expect(onExportComplete).toHaveBeenCalledWith({
        success: false,
        error: 'Disk full',
      });
    });
  });
});
