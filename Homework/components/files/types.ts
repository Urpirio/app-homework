/**
 * Shared types for file preview components.
 *
 * Validates: Requirements 8.3, 8.4, 2.5
 */

export interface FilePreviewProps {
  /** URL to the file resource */
  fileUrl: string;
  /** Display name of the file */
  fileName: string;
  /** MIME type of the file (e.g. 'image/png', 'video/mp4') */
  mimeType: string;
  /** File size in bytes (optional, used for display) */
  fileSize?: number;
}
