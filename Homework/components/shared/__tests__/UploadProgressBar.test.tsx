/**
 * Tests for UploadProgressBar component
 *
 * Validates: Requirements 8.2, 1.3
 */

import { render } from '@testing-library/react-native';
import React from 'react';
import { useColorScheme } from 'react-native';

import { UploadProgressBar, formatTimeRemaining } from '../UploadProgressBar';

jest.mock('react-native/Libraries/Utilities/useColorScheme');

const mockedUseColorScheme = useColorScheme as jest.MockedFunction<typeof useColorScheme>;

describe('formatTimeRemaining', () => {
  it('should return null for null input', () => {
    expect(formatTimeRemaining(null)).toBeNull();
  });

  it('should return null for undefined input', () => {
    expect(formatTimeRemaining(undefined)).toBeNull();
  });

  it('should return null for negative values', () => {
    expect(formatTimeRemaining(-5)).toBeNull();
  });

  it('should return "< 1s" for zero', () => {
    expect(formatTimeRemaining(0)).toBe('< 1s');
  });

  it('should ceil fractional values below 1 to 1s', () => {
    expect(formatTimeRemaining(0.5)).toBe('1s');
  });

  it('should format seconds correctly', () => {
    expect(formatTimeRemaining(1)).toBe('1s');
    expect(formatTimeRemaining(30)).toBe('30s');
    expect(formatTimeRemaining(59)).toBe('59s');
  });

  it('should format minutes and seconds correctly', () => {
    expect(formatTimeRemaining(60)).toBe('1m');
    expect(formatTimeRemaining(90)).toBe('1m 30s');
    expect(formatTimeRemaining(125)).toBe('2m 5s');
  });

  it('should format exact minutes without seconds', () => {
    expect(formatTimeRemaining(120)).toBe('2m');
    expect(formatTimeRemaining(300)).toBe('5m');
  });

  it('should ceil fractional seconds', () => {
    expect(formatTimeRemaining(1.2)).toBe('2s');
    expect(formatTimeRemaining(59.1)).toBe('1m');
  });
});

describe('UploadProgressBar', () => {
  beforeEach(() => {
    mockedUseColorScheme.mockReturnValue('dark');
  });

  it('should render percentage text while uploading', () => {
    const { getByText } = render(
      <UploadProgressBar progress={45} status="uploading" />
    );
    expect(getByText('45%')).toBeTruthy();
  });

  it('should render "Upload complete" on success', () => {
    const { getByText } = render(
      <UploadProgressBar progress={100} status="success" />
    );
    expect(getByText('Upload complete')).toBeTruthy();
  });

  it('should render "Upload failed" on error', () => {
    const { getByText } = render(
      <UploadProgressBar progress={30} status="error" />
    );
    expect(getByText('Upload failed')).toBeTruthy();
  });

  it('should show estimated time remaining while uploading', () => {
    const { getByText } = render(
      <UploadProgressBar progress={50} status="uploading" estimatedTimeRemaining={45} />
    );
    expect(getByText('45s remaining')).toBeTruthy();
  });

  it('should not show ETA when status is not uploading', () => {
    const { queryByText } = render(
      <UploadProgressBar progress={100} status="success" estimatedTimeRemaining={10} />
    );
    expect(queryByText(/remaining/)).toBeNull();
  });

  it('should not show ETA when estimatedTimeRemaining is null', () => {
    const { queryByText } = render(
      <UploadProgressBar progress={50} status="uploading" estimatedTimeRemaining={null} />
    );
    expect(queryByText(/remaining/)).toBeNull();
  });

  it('should clamp progress to 0-100 range', () => {
    const { getByText } = render(
      <UploadProgressBar progress={-10} status="uploading" />
    );
    // Should show 0% since progress is clamped (but text shows the status text)
    // The bar width is clamped, text shows the status
    expect(getByText('0%')).toBeTruthy();
  });

  it('should render with light theme', () => {
    mockedUseColorScheme.mockReturnValue('light');
    const { getByText } = render(
      <UploadProgressBar progress={75} status="uploading" />
    );
    expect(getByText('75%')).toBeTruthy();
  });
});
