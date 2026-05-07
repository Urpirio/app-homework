import { API_URL } from './api';

/**
 * Resolves a relative media path to a full URL.
 * If the path is already a full URL or is empty, it returns it as is.
 * 
 * @param path The relative or absolute path to the media file.
 * @returns The full URL to the media file.
 */
export const getFullUrl = (path?: string | null): string => {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('file://') || path.startsWith('content://') || path.startsWith('data:')) return path;
  
  // Ensure the path starts with a slash if it doesn't have one
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${API_URL}${normalizedPath}`;
};
