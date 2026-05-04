// Feature: homework-app-integration, Property 22: File organization follows context-based path convention
/**
 * Property 22: File organization follows context-based path convention
 *
 * For any file upload with a context (task resource, student submission,
 * chat attachment, institution logo, user avatar), the generated storage path
 * should follow the pattern `/uploads/{contextType}/{contextId}/...`
 * matching the defined path convention.
 *
 * **Validates: Requirements 8.6**
 */

import {
    generateUploadPath,
    parseUploadPath,
    UploadContext,
    UploadContextType,
} from '@/utils/filePathConvention';
import * as fc from 'fast-check';

/** All valid upload context types */
const ALL_CONTEXT_TYPES: UploadContextType[] = [
  'task-resource',
  'submission',
  'chat-attachment',
  'institution-logo',
  'user-avatar',
];

/** Generator for valid context types */
const arbContextType = fc.constantFrom(...ALL_CONTEXT_TYPES);

/** Generator for valid IDs (non-empty, no slashes) */
const arbId = fc.uuid();

/** Generator for valid file names (non-empty, no slashes) */
const arbFileName = fc
  .tuple(
    fc.string({ minLength: 1, maxLength: 20 }).map((s) =>
      s.replace(/[^a-zA-Z0-9_-]/g, 'x').slice(0, 20) || 'file'
    ),
    fc.constantFrom('.pdf', '.jpg', '.png', '.docx', '.mp4', '.mov', '.xlsx')
  )
  .map(([name, ext]) => `${name}${ext}`);

/** Generator for valid upload contexts */
const arbUploadContext: fc.Arbitrary<UploadContext> = fc
  .record({
    type: arbContextType,
    contextId: arbId,
    secondaryId: fc.option(arbId, { nil: undefined }),
    fileName: arbFileName,
  })
  .map((ctx) => {
    // Ensure submission contexts always have a secondaryId
    if (ctx.type === 'submission' && !ctx.secondaryId) {
      return { ...ctx, secondaryId: 'student-fallback-id' };
    }
    return ctx;
  });

describe('Property 22: File organization follows context-based path convention', () => {
  it('generated path always starts with /uploads/', () => {
    fc.assert(
      fc.property(arbUploadContext, (ctx) => {
        const path = generateUploadPath(ctx);
        expect(path.startsWith('/uploads/')).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('generated path contains the contextId', () => {
    fc.assert(
      fc.property(arbUploadContext, (ctx) => {
        const path = generateUploadPath(ctx);
        expect(path).toContain(ctx.contextId);
      }),
      { numRuns: 100 }
    );
  });

  it('generated path contains the fileName', () => {
    fc.assert(
      fc.property(arbUploadContext, (ctx) => {
        const path = generateUploadPath(ctx);
        expect(path.endsWith(ctx.fileName)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('task-resource paths follow /uploads/tasks/{taskId}/resources/{fileName}', () => {
    fc.assert(
      fc.property(arbId, arbFileName, (taskId, fileName) => {
        const ctx: UploadContext = {
          type: 'task-resource',
          contextId: taskId,
          fileName,
        };
        const path = generateUploadPath(ctx);
        expect(path).toBe(`/uploads/tasks/${taskId}/resources/${fileName}`);
      }),
      { numRuns: 100 }
    );
  });

  it('submission paths follow /uploads/tasks/{taskId}/submissions/{studentId}/{fileName}', () => {
    fc.assert(
      fc.property(arbId, arbId, arbFileName, (taskId, studentId, fileName) => {
        const ctx: UploadContext = {
          type: 'submission',
          contextId: taskId,
          secondaryId: studentId,
          fileName,
        };
        const path = generateUploadPath(ctx);
        expect(path).toBe(
          `/uploads/tasks/${taskId}/submissions/${studentId}/${fileName}`
        );
      }),
      { numRuns: 100 }
    );
  });

  it('chat-attachment paths follow /uploads/messages/{messageId}/{fileName}', () => {
    fc.assert(
      fc.property(arbId, arbFileName, (messageId, fileName) => {
        const ctx: UploadContext = {
          type: 'chat-attachment',
          contextId: messageId,
          fileName,
        };
        const path = generateUploadPath(ctx);
        expect(path).toBe(`/uploads/messages/${messageId}/${fileName}`);
      }),
      { numRuns: 100 }
    );
  });

  it('institution-logo paths follow /uploads/institutions/{instId}/logo/{fileName}', () => {
    fc.assert(
      fc.property(arbId, arbFileName, (instId, fileName) => {
        const ctx: UploadContext = {
          type: 'institution-logo',
          contextId: instId,
          fileName,
        };
        const path = generateUploadPath(ctx);
        expect(path).toBe(`/uploads/institutions/${instId}/logo/${fileName}`);
      }),
      { numRuns: 100 }
    );
  });

  it('user-avatar paths follow /uploads/users/{userId}/avatar/{fileName}', () => {
    fc.assert(
      fc.property(arbId, arbFileName, (userId, fileName) => {
        const ctx: UploadContext = {
          type: 'user-avatar',
          contextId: userId,
          fileName,
        };
        const path = generateUploadPath(ctx);
        expect(path).toBe(`/uploads/users/${userId}/avatar/${fileName}`);
      }),
      { numRuns: 100 }
    );
  });

  it('round-trip: generateUploadPath then parseUploadPath recovers the original context', () => {
    fc.assert(
      fc.property(arbUploadContext, (ctx) => {
        const path = generateUploadPath(ctx);
        const parsed = parseUploadPath(path);

        expect(parsed).not.toBeNull();
        expect(parsed!.type).toBe(ctx.type);
        expect(parsed!.contextId).toBe(ctx.contextId);
        expect(parsed!.fileName).toBe(ctx.fileName);

        if (ctx.type === 'submission') {
          expect(parsed!.secondaryId).toBe(ctx.secondaryId);
        }
      }),
      { numRuns: 100 }
    );
  });
});
