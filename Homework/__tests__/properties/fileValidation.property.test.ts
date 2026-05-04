// Feature: homework-app-integration, Property 1: File validation accepts/rejects correctly by type and size
/**
 * Property 1: File validation accepts/rejects correctly by type and size
 *
 * For any file with a given MIME type and size, the client-side validation
 * function should accept the file if and only if the MIME type is in the
 * allowed list AND the size is ≤ 50MB.
 *
 * **Validates: Requirements 1.3, 8.2, 8.5**
 */

import {
    ALLOWED_MIME_TYPES,
    FileInput,
    MAX_FILE_SIZE,
    validateFile,
} from '@/hooks/api/useUploads';
import * as fc from 'fast-check';

const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE; // 50MB

const allowedMimeTypes: string[] = [...ALLOWED_MIME_TYPES];

const disallowedMimeTypes = [
  'text/plain',
  'text/html',
  'application/json',
  'application/xml',
  'application/zip',
  'audio/mpeg',
  'audio/wav',
  'application/octet-stream',
  'image/bmp',
  'image/tiff',
  'video/avi',
  'video/webm',
];

function makeFile(mimeType: string, size?: number): FileInput {
  return {
    uri: 'file:///tmp/test-file',
    name: 'test-file',
    mimeType,
    size,
  };
}

describe('Property 1: File validation accepts/rejects correctly by type and size', () => {
  it('accepts files with allowed MIME types and size ≤ 50MB', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...allowedMimeTypes),
        fc.integer({ min: 0, max: MAX_FILE_SIZE_BYTES }),
        (mimeType, size) => {
          const result = validateFile(makeFile(mimeType, size));
          expect(result).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('rejects files with disallowed MIME types regardless of size', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...disallowedMimeTypes),
        fc.integer({ min: 0, max: MAX_FILE_SIZE_BYTES }),
        (mimeType, size) => {
          const result = validateFile(makeFile(mimeType, size));
          expect(result).not.toBeNull();
          expect(result!.code).toBe('INVALID_MIME_TYPE');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('rejects files exceeding 50MB regardless of MIME type', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...allowedMimeTypes),
        fc.integer({ min: MAX_FILE_SIZE_BYTES + 1, max: MAX_FILE_SIZE_BYTES * 10 }),
        (mimeType, size) => {
          const result = validateFile(makeFile(mimeType, size));
          expect(result).not.toBeNull();
          expect(result!.code).toBe('FILE_TOO_LARGE');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('accepts files with allowed MIME type when size is undefined', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...allowedMimeTypes),
        (mimeType) => {
          const result = validateFile(makeFile(mimeType, undefined));
          expect(result).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('rejects arbitrary MIME type strings not in the allowed list', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }).filter(
          (s) => !allowedMimeTypes.includes(s)
        ),
        fc.integer({ min: 0, max: MAX_FILE_SIZE_BYTES }),
        (mimeType, size) => {
          const result = validateFile(makeFile(mimeType, size));
          expect(result).not.toBeNull();
          expect(result!.code).toBe('INVALID_MIME_TYPE');
        }
      ),
      { numRuns: 100 }
    );
  });
});
