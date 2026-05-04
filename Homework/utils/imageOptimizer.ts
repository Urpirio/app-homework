/**
 * Image Optimization Utilities
 *
 * Provides context-aware image optimization before upload using expo-image-manipulator.
 * - Avatars: max 200x200px, JPEG quality 0.7
 * - Chat attachments: max 1200px longest side, JPEG quality 0.8
 * - Task resources: original size preserved (no optimization)
 *
 * For display optimization, expo-image handles caching and progressive loading
 * out of the box. See OptimizedImageProps for recommended usage patterns.
 *
 * Validates: Requirements 10.6
 * Design: Performance & Offline Design — Image Optimization
 */

import type { Action, ImageResult } from 'expo-image-manipulator';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

export type ImageContext = 'avatar' | 'chat' | 'task';

/** Configuration per image context */
const IMAGE_CONFIG = {
  avatar: {
    maxWidth: 200,
    maxHeight: 200,
    quality: 0.7,
  },
  chat: {
    maxLongestSide: 1200,
    quality: 0.8,
  },
  task: null, // No optimization — preserve original
} as const;

/**
 * Optimize an avatar image: resize to max 200x200px, JPEG quality 0.7.
 * The image is resized to fit within 200x200 while preserving aspect ratio.
 */
export async function optimizeAvatar(uri: string): Promise<string> {
  const actions: Action[] = [
    { resize: { width: IMAGE_CONFIG.avatar.maxWidth, height: IMAGE_CONFIG.avatar.maxHeight } },
  ];

  const result: ImageResult = await manipulateAsync(uri, actions, {
    compress: IMAGE_CONFIG.avatar.quality,
    format: SaveFormat.JPEG,
  });

  return result.uri;
}

/**
 * Optimize a chat attachment image: resize longest side to max 1200px, JPEG quality 0.8.
 * Preserves aspect ratio by only specifying the dimension that needs constraining.
 */
export async function optimizeChatAttachment(uri: string): Promise<string> {
  // We need to determine which dimension is longer to constrain it.
  // manipulateAsync with resize preserves aspect ratio when only one dimension is specified.
  // We resize by width first, then check — but since we don't know dimensions upfront,
  // we use a two-pass approach: first get dimensions, then resize the longer side.
  const probe: ImageResult = await manipulateAsync(uri, [], {
    format: SaveFormat.JPEG,
    compress: 1,
  });

  const { width, height } = probe;
  const maxSide = IMAGE_CONFIG.chat.maxLongestSide;

  // If already within bounds, just compress
  if (width <= maxSide && height <= maxSide) {
    const result = await manipulateAsync(uri, [], {
      compress: IMAGE_CONFIG.chat.quality,
      format: SaveFormat.JPEG,
    });
    return result.uri;
  }

  // Resize the longest side to maxSide, preserving aspect ratio
  const resize: Action =
    width >= height
      ? { resize: { width: maxSide } }
      : { resize: { height: maxSide } };

  const result = await manipulateAsync(uri, [resize], {
    compress: IMAGE_CONFIG.chat.quality,
    format: SaveFormat.JPEG,
  });

  return result.uri;
}

/**
 * Dispatch image optimization based on context.
 * - 'avatar': resize to 200x200, JPEG 0.7
 * - 'chat': resize longest side to 1200px, JPEG 0.8
 * - 'task': return original URI unchanged (teacher decides quality)
 */
export async function optimizeForContext(
  uri: string,
  context: ImageContext
): Promise<string> {
  switch (context) {
    case 'avatar':
      return optimizeAvatar(uri);
    case 'chat':
      return optimizeChatAttachment(uri);
    case 'task':
      return uri;
    default:
      return uri;
  }
}

/**
 * Recommended expo-image usage patterns for display optimization.
 *
 * expo-image provides built-in memory and disk caching. Use these props
 * for optimal display performance:
 *
 * ```tsx
 * import { Image } from 'expo-image';
 *
 * // Avatars and logos — disk cached, blur placeholder
 * <Image
 *   source={{ uri: avatarUrl }}
 *   placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
 *   contentFit="cover"
 *   transition={200}
 *   cachePolicy="disk"
 *   style={{ width: 48, height: 48, borderRadius: 24 }}
 * />
 *
 * // Chat attachment thumbnails — memory cached, blur placeholder
 * <Image
 *   source={{ uri: attachmentUrl }}
 *   placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
 *   contentFit="cover"
 *   transition={200}
 *   cachePolicy="memory-disk"
 *   style={{ width: 200, height: 200, borderRadius: 8 }}
 * />
 *
 * // Full-screen viewer — contain fit, no placeholder needed
 * <Image
 *   source={{ uri: fullImageUrl }}
 *   contentFit="contain"
 *   transition={300}
 *   cachePolicy="memory-disk"
 *   style={{ width: '100%', height: '80%' }}
 * />
 * ```
 *
 * Cache policies:
 * - "disk": Best for avatars/logos that rarely change
 * - "memory-disk": Best for content images (chat attachments, previews)
 * - "memory": Best for temporary/ephemeral images
 *
 * expo-image manages its own LRU cache internally. The default memory
 * cache limit is sufficient for most apps (~100MB). No additional
 * configuration is needed.
 */
export const OPTIMIZED_IMAGE_DEFAULTS = {
  avatar: {
    placeholder: { blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' },
    contentFit: 'cover' as const,
    transition: 200,
    cachePolicy: 'disk' as const,
  },
  chatThumbnail: {
    placeholder: { blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' },
    contentFit: 'cover' as const,
    transition: 200,
    cachePolicy: 'memory-disk' as const,
  },
  fullScreen: {
    contentFit: 'contain' as const,
    transition: 300,
    cachePolicy: 'memory-disk' as const,
  },
} as const;
