/**
 * Uploads React Query Hooks
 *
 * Handles file upload with progress tracking via multipart/form-data.
 * Includes client-side file validation for size and MIME type.
 *
 * Validates: Requirements 10.1, 8.1, 8.2, 8.5, 1.3
 */

import { useMutation } from '@tanstack/react-query';
import { useCallback, useRef, useState } from 'react';

import api from '../../utils/api';

export type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

interface UploadResponse {
  fileUrl: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
}

export interface FileInput {
  uri: string;
  name: string;
  mimeType: string;
  size?: number;
}

export interface FileValidationError {
  code: 'FILE_TOO_LARGE' | 'INVALID_MIME_TYPE';
  message: string;
}

/** Maximum file size: 50MB (matches backend Multer config) */
export const MAX_FILE_SIZE = 50 * 1024 * 1024;

/** Allowed MIME types for upload */
export const ALLOWED_MIME_TYPES: readonly string[] = [
  // Images
  'image/jpeg',
  'image/png',
  'image/gif',
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  // Videos
  'video/mp4',
  'video/quicktime',
] as const;

/**
 * Validates a file against size and MIME type constraints.
 * Returns null if valid, or a FileValidationError if invalid.
 */
export function validateFile(file: FileInput): FileValidationError | null {
  // Check file size if available
  if (file.size != null && file.size > MAX_FILE_SIZE) {
    const maxMB = Math.round(MAX_FILE_SIZE / (1024 * 1024));
    const fileMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      code: 'FILE_TOO_LARGE',
      message: `File is too large (${fileMB}MB). Maximum allowed size is ${maxMB}MB.`,
    };
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.mimeType)) {
    return {
      code: 'INVALID_MIME_TYPE',
      message: `File type "${file.mimeType}" is not supported. Allowed types: images (jpg, png, gif), documents (pdf, doc, docx, xls, xlsx, ppt, pptx), and videos (mp4, mov).`,
    };
  }

  return null;
}

export function useFileUpload() {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [validationError, setValidationError] = useState<FileValidationError | null>(null);
  const uploadStartTime = useRef<number | null>(null);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number | null>(null);

  const mutation = useMutation({
    mutationFn: async (file: FileInput): Promise<UploadResponse> => {
      // Client-side validation before upload
      const error = validateFile(file);
      if (error) {
        setValidationError(error);
        throw new Error(error.message);
      }

      setValidationError(null);

      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        name: file.name,
        type: file.mimeType,
      } as unknown as Blob);

      setStatus('uploading');
      setProgress(0);
      setEstimatedTimeRemaining(null);
      uploadStartTime.current = Date.now();

      const { data } = await api.post<UploadResponse>('/uploads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (event) => {
          const total = event.total ?? 1;
          const loaded = event.loaded;
          const pct = Math.round((loaded * 100) / total);
          setProgress(pct);

          // Calculate estimated time remaining
          if (uploadStartTime.current && pct > 0 && pct < 100) {
            const elapsed = (Date.now() - uploadStartTime.current) / 1000; // seconds
            const rate = loaded / elapsed; // bytes per second
            const remaining = total - loaded;
            const eta = rate > 0 ? remaining / rate : null;
            setEstimatedTimeRemaining(eta);
          } else if (pct >= 100) {
            setEstimatedTimeRemaining(0);
          }
        },
      });

      setStatus('success');
      setEstimatedTimeRemaining(null);
      uploadStartTime.current = null;
      return data;
    },
    onError: () => {
      setStatus('error');
      setEstimatedTimeRemaining(null);
      uploadStartTime.current = null;
    },
  });

  const reset = useCallback(() => {
    setProgress(0);
    setStatus('idle');
    setValidationError(null);
    setEstimatedTimeRemaining(null);
    uploadStartTime.current = null;
    mutation.reset();
  }, [mutation]);

  return {
    upload: mutation.mutateAsync,
    progress,
    status,
    reset,
    isUploading: status === 'uploading',
    error: mutation.error,
    validationError,
    estimatedTimeRemaining,
  };
}
