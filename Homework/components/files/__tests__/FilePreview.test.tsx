/**
 * Tests for FilePreview wrapper and individual preview components
 *
 * Validates: Requirements 8.3, 8.4, 2.5
 */

import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Alert, useColorScheme } from 'react-native';

import { FilePreview } from '../FilePreview';

// Mock native modules
jest.mock('react-native/Libraries/Utilities/useColorScheme');
jest.mock('expo-image', () => ({
  Image: 'Image',
}));
jest.mock('expo-av', () => ({
  Video: 'Video',
  ResizeMode: { CONTAIN: 'contain' },
}));
jest.mock('expo-web-browser', () => ({
  openBrowserAsync: jest.fn(),
}));
jest.mock('expo-file-system', () => ({
  cacheDirectory: '/cache/',
  downloadAsync: jest.fn().mockImplementation((_url: string, localPath: string) =>
    Promise.resolve({ uri: localPath })
  ),
}));
jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  shareAsync: jest.fn().mockResolvedValue(undefined),
}));

const mockedUseColorScheme = useColorScheme as jest.MockedFunction<typeof useColorScheme>;

beforeEach(() => {
  mockedUseColorScheme.mockReturnValue('dark');
  jest.clearAllMocks();
});

describe('FilePreview', () => {
  it('renders ImagePreview for image MIME types', () => {
    const { getByLabelText } = render(
      <FilePreview
        fileUrl="https://example.com/photo.jpg"
        fileName="photo.jpg"
        mimeType="image/jpeg"
      />
    );
    expect(getByLabelText('View image photo.jpg')).toBeTruthy();
  });

  it('renders VideoPreview for video MIME types', () => {
    const { getByLabelText } = render(
      <FilePreview
        fileUrl="https://example.com/clip.mp4"
        fileName="clip.mp4"
        mimeType="video/mp4"
      />
    );
    expect(getByLabelText('Play video clip.mp4')).toBeTruthy();
  });

  it('renders PDFPreview for application/pdf', () => {
    const { getByLabelText } = render(
      <FilePreview
        fileUrl="https://example.com/doc.pdf"
        fileName="doc.pdf"
        mimeType="application/pdf"
      />
    );
    expect(getByLabelText('Open PDF doc.pdf')).toBeTruthy();
  });

  it('renders FileIcon for other MIME types', () => {
    const { getByLabelText } = render(
      <FilePreview
        fileUrl="https://example.com/report.docx"
        fileName="report.docx"
        mimeType="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      />
    );
    expect(getByLabelText('Download file report.docx')).toBeTruthy();
  });

  it('displays file name in all preview types', () => {
    const { getByText } = render(
      <FilePreview
        fileUrl="https://example.com/notes.txt"
        fileName="notes.txt"
        mimeType="text/plain"
        fileSize={1024}
      />
    );
    expect(getByText('notes.txt')).toBeTruthy();
  });
});

describe('ImagePreview', () => {
  it('displays file name and size', () => {
    const { getByText } = render(
      <FilePreview
        fileUrl="https://example.com/photo.png"
        fileName="photo.png"
        mimeType="image/png"
        fileSize={2048}
      />
    );
    expect(getByText('photo.png')).toBeTruthy();
    expect(getByText('2.0 KB')).toBeTruthy();
  });
});

describe('PDFPreview', () => {
  it('opens browser on tap', () => {
    const WebBrowser = require('expo-web-browser');
    const { getByLabelText } = render(
      <FilePreview
        fileUrl="https://example.com/doc.pdf"
        fileName="doc.pdf"
        mimeType="application/pdf"
        fileSize={5000}
      />
    );
    fireEvent.press(getByLabelText('Open PDF doc.pdf'));
    expect(WebBrowser.openBrowserAsync).toHaveBeenCalledWith('https://example.com/doc.pdf');
  });

  it('displays PDF label with file size', () => {
    const { getByText } = render(
      <FilePreview
        fileUrl="https://example.com/doc.pdf"
        fileName="doc.pdf"
        mimeType="application/pdf"
        fileSize={5000}
      />
    );
    expect(getByText('PDF · 4.9 KB')).toBeTruthy();
  });
});

describe('FileIcon', () => {
  it('triggers download and share on tap', async () => {
    const FileSystem = require('expo-file-system');
    const Sharing = require('expo-sharing');

    const { getByLabelText } = render(
      <FilePreview
        fileUrl="https://example.com/report.docx"
        fileName="report.docx"
        mimeType="application/msword"
      />
    );

    fireEvent.press(getByLabelText('Download file report.docx'));

    // Wait for async operations
    await waitFor(() => {
      expect(FileSystem.downloadAsync).toHaveBeenCalledWith(
        'https://example.com/report.docx',
        '/cache/report.docx'
      );
    });
    expect(Sharing.shareAsync).toHaveBeenCalledWith('/cache/report.docx');
  });

  it('shows alert when sharing is not available', async () => {
    const Sharing = require('expo-sharing');
    Sharing.isAvailableAsync.mockResolvedValueOnce(false);
    jest.spyOn(Alert, 'alert');

    const { getByLabelText } = render(
      <FilePreview
        fileUrl="https://example.com/data.xlsx"
        fileName="data.xlsx"
        mimeType="application/vnd.ms-excel"
      />
    );

    fireEvent.press(getByLabelText('Download file data.xlsx'));
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Downloaded', expect.stringContaining('data.xlsx'));
    });
  });

  it('shows error alert on download failure', async () => {
    const FileSystem = require('expo-file-system');
    FileSystem.downloadAsync.mockRejectedValueOnce(new Error('Network error'));
    jest.spyOn(Alert, 'alert');

    const { getByLabelText } = render(
      <FilePreview
        fileUrl="https://example.com/fail.zip"
        fileName="fail.zip"
        mimeType="application/zip"
      />
    );

    fireEvent.press(getByLabelText('Download file fail.zip'));
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Download failed', expect.any(String));
    });
  });

  it('displays file extension label', () => {
    const { getByText } = render(
      <FilePreview
        fileUrl="https://example.com/report.docx"
        fileName="report.docx"
        mimeType="application/msword"
      />
    );
    expect(getByText('DOCX')).toBeTruthy();
  });
});
