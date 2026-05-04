import {
    optimizeAvatar,
    optimizeChatAttachment,
    OPTIMIZED_IMAGE_DEFAULTS,
    optimizeForContext,
} from '../imageOptimizer';

// Mock expo-image-manipulator
jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn(),
  SaveFormat: { JPEG: 'jpeg', PNG: 'png', WEBP: 'webp' },
}));

import { manipulateAsync } from 'expo-image-manipulator';

const mockManipulateAsync = manipulateAsync as jest.MockedFunction<typeof manipulateAsync>;

beforeEach(() => {
  mockManipulateAsync.mockReset();
});

describe('optimizeAvatar', () => {
  it('should resize to 200x200 with JPEG quality 0.7', async () => {
    mockManipulateAsync.mockResolvedValue({
      uri: 'file:///optimized-avatar.jpg',
      width: 200,
      height: 200,
    });

    const result = await optimizeAvatar('file:///original.jpg');

    expect(result).toBe('file:///optimized-avatar.jpg');
    expect(mockManipulateAsync).toHaveBeenCalledWith(
      'file:///original.jpg',
      [{ resize: { width: 200, height: 200 } }],
      { compress: 0.7, format: 'jpeg' }
    );
  });
});

describe('optimizeChatAttachment', () => {
  it('should only compress when image is already within bounds', async () => {
    // First call: probe to get dimensions
    mockManipulateAsync
      .mockResolvedValueOnce({ uri: 'file:///probe.jpg', width: 800, height: 600 })
      // Second call: compress only
      .mockResolvedValueOnce({ uri: 'file:///compressed.jpg', width: 800, height: 600 });

    const result = await optimizeChatAttachment('file:///small-image.jpg');

    expect(result).toBe('file:///compressed.jpg');
    // Probe call (no actions, compress 1)
    expect(mockManipulateAsync).toHaveBeenNthCalledWith(1, 'file:///small-image.jpg', [], {
      format: 'jpeg',
      compress: 1,
    });
    // Compress-only call
    expect(mockManipulateAsync).toHaveBeenNthCalledWith(2, 'file:///small-image.jpg', [], {
      compress: 0.8,
      format: 'jpeg',
    });
  });

  it('should resize by width when width is the longest side', async () => {
    // Probe: landscape image wider than 1200
    mockManipulateAsync
      .mockResolvedValueOnce({ uri: 'file:///probe.jpg', width: 3000, height: 2000 })
      .mockResolvedValueOnce({ uri: 'file:///resized.jpg', width: 1200, height: 800 });

    const result = await optimizeChatAttachment('file:///large-landscape.jpg');

    expect(result).toBe('file:///resized.jpg');
    expect(mockManipulateAsync).toHaveBeenNthCalledWith(
      2,
      'file:///large-landscape.jpg',
      [{ resize: { width: 1200 } }],
      { compress: 0.8, format: 'jpeg' }
    );
  });

  it('should resize by height when height is the longest side', async () => {
    // Probe: portrait image taller than 1200
    mockManipulateAsync
      .mockResolvedValueOnce({ uri: 'file:///probe.jpg', width: 900, height: 1600 })
      .mockResolvedValueOnce({ uri: 'file:///resized.jpg', width: 675, height: 1200 });

    const result = await optimizeChatAttachment('file:///large-portrait.jpg');

    expect(result).toBe('file:///resized.jpg');
    expect(mockManipulateAsync).toHaveBeenNthCalledWith(
      2,
      'file:///large-portrait.jpg',
      [{ resize: { height: 1200 } }],
      { compress: 0.8, format: 'jpeg' }
    );
  });
});

describe('optimizeForContext', () => {
  it('should call optimizeAvatar for avatar context', async () => {
    mockManipulateAsync.mockResolvedValue({
      uri: 'file:///avatar-optimized.jpg',
      width: 200,
      height: 200,
    });

    const result = await optimizeForContext('file:///photo.jpg', 'avatar');

    expect(result).toBe('file:///avatar-optimized.jpg');
    expect(mockManipulateAsync).toHaveBeenCalledWith(
      'file:///photo.jpg',
      [{ resize: { width: 200, height: 200 } }],
      { compress: 0.7, format: 'jpeg' }
    );
  });

  it('should call optimizeChatAttachment for chat context', async () => {
    mockManipulateAsync
      .mockResolvedValueOnce({ uri: 'file:///probe.jpg', width: 2000, height: 1500 })
      .mockResolvedValueOnce({ uri: 'file:///chat-optimized.jpg', width: 1200, height: 900 });

    const result = await optimizeForContext('file:///photo.jpg', 'chat');

    expect(result).toBe('file:///chat-optimized.jpg');
  });

  it('should return original URI for task context', async () => {
    const result = await optimizeForContext('file:///resource.jpg', 'task');

    expect(result).toBe('file:///resource.jpg');
    expect(mockManipulateAsync).not.toHaveBeenCalled();
  });
});

describe('OPTIMIZED_IMAGE_DEFAULTS', () => {
  it('should have correct avatar display defaults', () => {
    expect(OPTIMIZED_IMAGE_DEFAULTS.avatar).toEqual({
      placeholder: { blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' },
      contentFit: 'cover',
      transition: 200,
      cachePolicy: 'disk',
    });
  });

  it('should have correct chat thumbnail display defaults', () => {
    expect(OPTIMIZED_IMAGE_DEFAULTS.chatThumbnail).toEqual({
      placeholder: { blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' },
      contentFit: 'cover',
      transition: 200,
      cachePolicy: 'memory-disk',
    });
  });

  it('should have correct full screen display defaults', () => {
    expect(OPTIMIZED_IMAGE_DEFAULTS.fullScreen).toEqual({
      contentFit: 'contain',
      transition: 300,
      cachePolicy: 'memory-disk',
    });
  });
});
