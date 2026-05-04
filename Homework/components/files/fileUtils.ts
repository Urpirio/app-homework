/**
 * Utility functions for file preview components.
 *
 * Validates: Requirements 8.3, 8.4
 */

/**
 * Extracts the file extension from a filename.
 * Returns an uppercase extension string (e.g. "PDF", "DOCX") or empty string.
 */
export function getFileExtension(fileName: string): string {
  const parts = fileName.split('.');
  if (parts.length < 2) return '';
  return (parts[parts.length - 1] ?? '').toUpperCase();
}

/**
 * Formats a file size in bytes to a human-readable string.
 * Examples: "1.2 MB", "340 KB", "12 B"
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

/**
 * Determines the MIME type category for preview component selection.
 */
export type MimeCategory = 'image' | 'video' | 'pdf' | 'other';

export function getMimeCategory(mimeType: string): MimeCategory {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType === 'application/pdf') return 'pdf';
  return 'other';
}
