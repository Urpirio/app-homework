/**
 * Tests for useUploads hook — file validation logic
 *
 * Validates: Requirements 8.1, 8.2, 8.5, 1.3
 */

import {
    ALLOWED_MIME_TYPES,
    MAX_FILE_SIZE,
    validateFile,
    type FileInput,
} from '../useUploads';

describe('validateFile', () => {
  const validFile: FileInput = {
    uri: 'file:///test/photo.jpg',
    name: 'photo.jpg',
    mimeType: 'image/jpeg',
    size: 1024 * 1024, // 1MB
  };

  it('should accept a valid image file', () => {
    expect(validateFile(validFile)).toBeNull();
  });

  it('should accept a valid PDF file', () => {
    const file: FileInput = { ...validFile, mimeType: 'application/pdf', name: 'doc.pdf' };
    expect(validateFile(file)).toBeNull();
  });

  it('should accept a valid video file', () => {
    const file: FileInput = {
      ...validFile,
      mimeType: 'video/mp4',
      name: 'video.mp4',
      size: 40 * 1024 * 1024, // 40MB
    };
    expect(validateFile(file)).toBeNull();
  });

  it('should accept all allowed MIME types', () => {
    for (const mimeType of ALLOWED_MIME_TYPES) {
      const file: FileInput = { ...validFile, mimeType };
      expect(validateFile(file)).toBeNull();
    }
  });

  it('should reject a file exceeding 50MB', () => {
    const file: FileInput = {
      ...validFile,
      size: MAX_FILE_SIZE + 1,
    };
    const error = validateFile(file);
    expect(error).not.toBeNull();
    expect(error!.code).toBe('FILE_TOO_LARGE');
    expect(error!.message).toContain('50MB');
  });

  it('should accept a file exactly at 50MB', () => {
    const file: FileInput = {
      ...validFile,
      size: MAX_FILE_SIZE,
    };
    expect(validateFile(file)).toBeNull();
  });

  it('should reject an unsupported MIME type', () => {
    const file: FileInput = {
      ...validFile,
      mimeType: 'application/zip',
    };
    const error = validateFile(file);
    expect(error).not.toBeNull();
    expect(error!.code).toBe('INVALID_MIME_TYPE');
    expect(error!.message).toContain('not supported');
  });

  it('should reject text/plain MIME type', () => {
    const file: FileInput = {
      ...validFile,
      mimeType: 'text/plain',
    };
    const error = validateFile(file);
    expect(error).not.toBeNull();
    expect(error!.code).toBe('INVALID_MIME_TYPE');
  });

  it('should skip size check when size is undefined', () => {
    const file: FileInput = {
      uri: 'file:///test/photo.jpg',
      name: 'photo.jpg',
      mimeType: 'image/jpeg',
    };
    expect(validateFile(file)).toBeNull();
  });

  it('should check size before MIME type (size error takes priority)', () => {
    const file: FileInput = {
      ...validFile,
      mimeType: 'application/zip',
      size: MAX_FILE_SIZE + 1,
    };
    const error = validateFile(file);
    expect(error).not.toBeNull();
    expect(error!.code).toBe('FILE_TOO_LARGE');
  });
});

describe('ALLOWED_MIME_TYPES', () => {
  it('should include image types: jpeg, png, gif', () => {
    expect(ALLOWED_MIME_TYPES).toContain('image/jpeg');
    expect(ALLOWED_MIME_TYPES).toContain('image/png');
    expect(ALLOWED_MIME_TYPES).toContain('image/gif');
  });

  it('should include document types: pdf, doc, docx, xls, xlsx, ppt, pptx', () => {
    expect(ALLOWED_MIME_TYPES).toContain('application/pdf');
    expect(ALLOWED_MIME_TYPES).toContain('application/msword');
    expect(ALLOWED_MIME_TYPES).toContain('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    expect(ALLOWED_MIME_TYPES).toContain('application/vnd.ms-excel');
    expect(ALLOWED_MIME_TYPES).toContain('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    expect(ALLOWED_MIME_TYPES).toContain('application/vnd.ms-powerpoint');
    expect(ALLOWED_MIME_TYPES).toContain('application/vnd.openxmlformats-officedocument.presentationml.presentation');
  });

  it('should include video types: mp4, mov', () => {
    expect(ALLOWED_MIME_TYPES).toContain('video/mp4');
    expect(ALLOWED_MIME_TYPES).toContain('video/quicktime');
  });

  it('should have exactly 12 allowed types', () => {
    expect(ALLOWED_MIME_TYPES).toHaveLength(12);
  });
});

describe('MAX_FILE_SIZE', () => {
  it('should be 50MB in bytes', () => {
    expect(MAX_FILE_SIZE).toBe(50 * 1024 * 1024);
  });
});
