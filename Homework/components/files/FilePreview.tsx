/**
 * FilePreview Component
 *
 * Wrapper component that selects the appropriate preview component
 * based on the file's MIME type.
 *
 * - image/* → ImagePreview (thumbnail + full-screen viewer)
 * - video/* → VideoPreview (play icon + video player)
 * - application/pdf → PDFPreview (PDF icon + system viewer)
 * - everything else → FileIcon (generic icon + download)
 *
 * Validates: Requirements 8.3, 8.4, 2.5
 */

import React from 'react';

import { FileIcon } from './FileIcon';
import { ImagePreview } from './ImagePreview';
import { PDFPreview } from './PDFPreview';
import { VideoPreview } from './VideoPreview';
import { getMimeCategory } from './fileUtils';
import type { FilePreviewProps } from './types';

export function FilePreview(props: FilePreviewProps) {
  const category = getMimeCategory(props.mimeType);

  switch (category) {
    case 'image':
      return <ImagePreview {...props} />;
    case 'video':
      return <VideoPreview {...props} />;
    case 'pdf':
      return <PDFPreview {...props} />;
    case 'other':
    default:
      return <FileIcon {...props} />;
  }
}
