// Feature: homework-app-integration, Property 5: Multimedia preview component selection by MIME type
/**
 * Property 5: Multimedia preview component selection by MIME type
 *
 * For any MIME type string, the preview component selector should return
 * 'image' for image/*, 'video' for video/*, 'pdf' for application/pdf,
 * and 'other' for all other types — with no MIME type left unhandled.
 *
 * **Validates: Requirements 2.5, 8.3**
 */

import { getMimeCategory, MimeCategory } from '@/components/files/fileUtils';
import * as fc from 'fast-check';

const validCategories: MimeCategory[] = ['image', 'video', 'pdf', 'other'];

/** Arbitrary for image MIME types */
const imageMimeArb = fc.stringMatching(/^image\/[a-z0-9.+-]{1,30}$/);

/** Arbitrary for video MIME types */
const videoMimeArb = fc.stringMatching(/^video\/[a-z0-9.+-]{1,30}$/);

/** Arbitrary for non-image, non-video, non-pdf MIME types */
const otherMimeArb = fc.oneof(
  fc.constantFrom(
    'application/json',
    'application/xml',
    'application/zip',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/html',
    'text/csv',
    'audio/mpeg',
    'audio/wav',
    'font/woff2',
    'multipart/form-data'
  )
);

describe('Property 5: Multimedia preview component selection by MIME type', () => {
  it('returns "image" for any image/* MIME type', () => {
    fc.assert(
      fc.property(imageMimeArb, (mimeType) => {
        expect(getMimeCategory(mimeType)).toBe('image');
      }),
      { numRuns: 100 }
    );
  });

  it('returns "video" for any video/* MIME type', () => {
    fc.assert(
      fc.property(videoMimeArb, (mimeType) => {
        expect(getMimeCategory(mimeType)).toBe('video');
      }),
      { numRuns: 100 }
    );
  });

  it('returns "pdf" for application/pdf', () => {
    expect(getMimeCategory('application/pdf')).toBe('pdf');
  });

  it('returns "other" for non-image, non-video, non-pdf MIME types', () => {
    fc.assert(
      fc.property(otherMimeArb, (mimeType) => {
        expect(getMimeCategory(mimeType)).toBe('other');
      }),
      { numRuns: 100 }
    );
  });

  it('always returns a valid MimeCategory for any string', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 0, maxLength: 100 }), (mimeType) => {
        const result = getMimeCategory(mimeType);
        expect(validCategories).toContain(result);
      }),
      { numRuns: 100 }
    );
  });

  it('is deterministic — same input always produces same output', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 0, maxLength: 100 }), (mimeType) => {
        const result1 = getMimeCategory(mimeType);
        const result2 = getMimeCategory(mimeType);
        expect(result1).toBe(result2);
      }),
      { numRuns: 100 }
    );
  });
});
