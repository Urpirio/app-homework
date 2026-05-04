/**
 * Tests for file utility functions
 *
 * Validates: Requirements 8.3, 8.4
 */

import { formatFileSize, getFileExtension, getMimeCategory } from '../fileUtils';

describe('getFileExtension', () => {
  it('returns uppercase extension from filename', () => {
    expect(getFileExtension('report.pdf')).toBe('PDF');
    expect(getFileExtension('photo.jpg')).toBe('JPG');
    expect(getFileExtension('document.docx')).toBe('DOCX');
  });

  it('returns the last extension for multiple dots', () => {
    expect(getFileExtension('my.file.name.txt')).toBe('TXT');
  });

  it('returns empty string for no extension', () => {
    expect(getFileExtension('README')).toBe('');
  });
});

describe('formatFileSize', () => {
  it('formats bytes', () => {
    expect(formatFileSize(500)).toBe('500 B');
  });

  it('formats kilobytes', () => {
    expect(formatFileSize(2048)).toBe('2.0 KB');
  });

  it('formats megabytes', () => {
    expect(formatFileSize(5 * 1024 * 1024)).toBe('5.0 MB');
  });

  it('formats gigabytes', () => {
    expect(formatFileSize(2 * 1024 * 1024 * 1024)).toBe('2.0 GB');
  });
});

describe('getMimeCategory', () => {
  it('returns "image" for image MIME types', () => {
    expect(getMimeCategory('image/jpeg')).toBe('image');
    expect(getMimeCategory('image/png')).toBe('image');
    expect(getMimeCategory('image/gif')).toBe('image');
    expect(getMimeCategory('image/webp')).toBe('image');
  });

  it('returns "video" for video MIME types', () => {
    expect(getMimeCategory('video/mp4')).toBe('video');
    expect(getMimeCategory('video/quicktime')).toBe('video');
  });

  it('returns "pdf" for application/pdf', () => {
    expect(getMimeCategory('application/pdf')).toBe('pdf');
  });

  it('returns "other" for document MIME types', () => {
    expect(getMimeCategory('application/msword')).toBe('other');
    expect(getMimeCategory('application/vnd.openxmlformats-officedocument.wordprocessingml.document')).toBe('other');
  });

  it('returns "other" for unknown MIME types', () => {
    expect(getMimeCategory('application/octet-stream')).toBe('other');
    expect(getMimeCategory('text/plain')).toBe('other');
  });
});
