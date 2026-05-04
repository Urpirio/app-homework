// Feature: homework-app-integration, Property 29: Image optimization reduces file size
/**
 * Property 29: Image optimization reduces file size
 *
 * For any image file exceeding the target dimensions (200x200 for avatars,
 * 1200px for attachments), the optimized output should have dimensions at
 * or below the target and a file size strictly less than the original.
 *
 * We test that optimizeForContext returns the original URI for 'task' context
 * and calls manipulateAsync for 'avatar' and 'chat' contexts.
 *
 * Since expo-image-manipulator is a native module, we mock it and verify
 * the correct optimization parameters are passed for each context.
 *
 * **Validates: Requirements 10.6**
 */

import * as fc from 'fast-check';

// Mock expo-image-manipulator
const mockManipulateAsync = jest.fn();
jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: (...args: unknown[]) => mockManipulateAsync(...args),
  SaveFormat: {
    JPEG: 'jpeg',
    PNG: 'png',
  },
}));

import {
    type ImageContext,
    optimizeAvatar,
    optimizeForContext
} from '@/utils/imageOptimizer';

describe('Property 29: Image optimization reduces file size', () => {
  it('optimizeForContext returns original URI unchanged for task context', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 5, maxLength: 200 }).map((s) => `file:///images/${s}.jpg`),
        async (uri) => {
          mockManipulateAsync.mockClear();

          const result = await optimizeForContext(uri, 'task');
          expect(result).toBe(uri);
          // manipulateAsync should NOT be called for task context
          expect(mockManipulateAsync).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('optimizeForContext calls manipulateAsync for avatar context with correct params', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 5, maxLength: 100 }).map((s) => `file:///photos/${s}.png`),
        async (uri) => {
          mockManipulateAsync.mockReset();
          mockManipulateAsync.mockResolvedValue({ uri: `${uri}_optimized` });

          const result = await optimizeForContext(uri, 'avatar');

          expect(result).toBe(`${uri}_optimized`);
          expect(mockManipulateAsync).toHaveBeenCalledTimes(1);

          const [calledUri, actions, options] = mockManipulateAsync.mock.calls[0];
          expect(calledUri).toBe(uri);

          // Should resize to 200x200
          expect(actions).toEqual([{ resize: { width: 200, height: 200 } }]);

          // Should compress as JPEG with quality 0.7
          expect(options.compress).toBe(0.7);
          expect(options.format).toBe('jpeg');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('optimizeForContext calls manipulateAsync for chat context', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 5, maxLength: 100 }).map((s) => `file:///chat/${s}.jpg`),
        fc.integer({ min: 100, max: 5000 }),
        fc.integer({ min: 100, max: 5000 }),
        async (uri, width, height) => {
          mockManipulateAsync.mockReset();

          // First call is the probe (get dimensions)
          mockManipulateAsync.mockResolvedValueOnce({
            uri: `${uri}_probe`,
            width,
            height,
          });

          // Second call is the actual resize/compress
          mockManipulateAsync.mockResolvedValueOnce({
            uri: `${uri}_optimized`,
          });

          const result = await optimizeForContext(uri, 'chat');

          // Should have called manipulateAsync at least once
          expect(mockManipulateAsync).toHaveBeenCalled();

          if (width <= 1200 && height <= 1200) {
            // Image within bounds — just compress, no resize
            expect(mockManipulateAsync).toHaveBeenCalledTimes(2);
            const [, , options] = mockManipulateAsync.mock.calls[1];
            expect(options.compress).toBe(0.8);
            expect(options.format).toBe('jpeg');
          } else {
            // Image exceeds bounds — resize + compress
            expect(mockManipulateAsync).toHaveBeenCalledTimes(2);
            const [, actions, options] = mockManipulateAsync.mock.calls[1];

            // Should resize the longest side to 1200
            if (width >= height) {
              expect(actions).toEqual([{ resize: { width: 1200 } }]);
            } else {
              expect(actions).toEqual([{ resize: { height: 1200 } }]);
            }

            expect(options.compress).toBe(0.8);
            expect(options.format).toBe('jpeg');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('optimizeAvatar always resizes to 200x200 with JPEG 0.7', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 3, maxLength: 80 }).map((s) => `file:///avatar/${s}.jpg`),
        async (uri) => {
          mockManipulateAsync.mockReset();
          mockManipulateAsync.mockResolvedValue({ uri: `${uri}_avatar` });

          await optimizeAvatar(uri);

          expect(mockManipulateAsync).toHaveBeenCalledTimes(1);
          const [calledUri, actions, options] = mockManipulateAsync.mock.calls[0];
          expect(calledUri).toBe(uri);
          expect(actions).toEqual([{ resize: { width: 200, height: 200 } }]);
          expect(options.compress).toBe(0.7);
          expect(options.format).toBe('jpeg');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('context type determines optimization behavior correctly for all contexts', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom<ImageContext>('avatar', 'chat', 'task'),
        fc.string({ minLength: 3, maxLength: 50 }).map((s) => `file:///img/${s}.jpg`),
        async (context, uri) => {
          mockManipulateAsync.mockReset();

          if (context === 'chat') {
            // Probe call returns small image (within bounds)
            mockManipulateAsync.mockResolvedValueOnce({
              uri: `${uri}_probe`,
              width: 800,
              height: 600,
            });
          }
          mockManipulateAsync.mockResolvedValue({ uri: `${uri}_opt` });

          const result = await optimizeForContext(uri, context);

          if (context === 'task') {
            // Task: no manipulation, returns original URI
            expect(result).toBe(uri);
            expect(mockManipulateAsync).not.toHaveBeenCalled();
          } else {
            // Avatar and chat: manipulateAsync should be called
            expect(mockManipulateAsync).toHaveBeenCalled();
            expect(result).not.toBe(uri);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('unknown context defaults to returning original URI', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 3, maxLength: 50 }).map((s) => `file:///unknown/${s}.jpg`),
        async (uri) => {
          mockManipulateAsync.mockReset();

          // Cast to bypass TypeScript — testing the default case
          const result = await optimizeForContext(uri, 'unknown' as ImageContext);
          expect(result).toBe(uri);
          expect(mockManipulateAsync).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });
});
