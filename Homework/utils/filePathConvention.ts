/**
 * File Organization by Context (Req 8.6)
 *
 * Generates storage paths following the context-based convention:
 *   /uploads/tasks/{taskId}/resources/          — teacher-uploaded task resources
 *   /uploads/tasks/{taskId}/submissions/{studentId}/  — student submission files
 *   /uploads/messages/{messageId}/              — chat attachment files
 *   /uploads/institutions/{instId}/logo/        — institution logos
 *   /uploads/users/{userId}/avatar/             — user profile avatars
 *
 * Validates: Requirements 8.6
 */

export type UploadContextType =
  | 'task-resource'
  | 'submission'
  | 'chat-attachment'
  | 'institution-logo'
  | 'user-avatar';

export interface UploadContext {
  type: UploadContextType;
  /** Primary context ID (taskId, messageId, instId, or userId) */
  contextId: string;
  /** Secondary context ID (studentId for submissions) */
  secondaryId?: string;
  /** Original file name */
  fileName: string;
}

/**
 * Generates a storage path for a file upload based on its context.
 *
 * @returns A path string starting with `/uploads/` following the convention.
 * @throws Error if contextId or fileName is empty, or if submission context
 *         is missing secondaryId.
 */
export function generateUploadPath(ctx: UploadContext): string {
  if (!ctx.contextId || ctx.contextId.trim().length === 0) {
    throw new Error('contextId is required');
  }
  if (!ctx.fileName || ctx.fileName.trim().length === 0) {
    throw new Error('fileName is required');
  }

  const id = ctx.contextId.trim();
  const file = ctx.fileName.trim();

  switch (ctx.type) {
    case 'task-resource':
      return `/uploads/tasks/${id}/resources/${file}`;

    case 'submission': {
      if (!ctx.secondaryId || ctx.secondaryId.trim().length === 0) {
        throw new Error('secondaryId (studentId) is required for submission context');
      }
      const studentId = ctx.secondaryId.trim();
      return `/uploads/tasks/${id}/submissions/${studentId}/${file}`;
    }

    case 'chat-attachment':
      return `/uploads/messages/${id}/${file}`;

    case 'institution-logo':
      return `/uploads/institutions/${id}/logo/${file}`;

    case 'user-avatar':
      return `/uploads/users/${id}/avatar/${file}`;
  }
}

/**
 * Parses a storage path back into its context type and IDs.
 * Returns null if the path doesn't match any known convention.
 */
export function parseUploadPath(
  path: string
): { type: UploadContextType; contextId: string; secondaryId?: string; fileName: string } | null {
  const taskResourceMatch = path.match(
    /^\/uploads\/tasks\/([^/]+)\/resources\/([^/]+)$/
  );
  if (taskResourceMatch) {
    return {
      type: 'task-resource',
      contextId: taskResourceMatch[1],
      fileName: taskResourceMatch[2],
    };
  }

  const submissionMatch = path.match(
    /^\/uploads\/tasks\/([^/]+)\/submissions\/([^/]+)\/([^/]+)$/
  );
  if (submissionMatch) {
    return {
      type: 'submission',
      contextId: submissionMatch[1],
      secondaryId: submissionMatch[2],
      fileName: submissionMatch[3],
    };
  }

  const messageMatch = path.match(
    /^\/uploads\/messages\/([^/]+)\/([^/]+)$/
  );
  if (messageMatch) {
    return {
      type: 'chat-attachment',
      contextId: messageMatch[1],
      fileName: messageMatch[2],
    };
  }

  const logoMatch = path.match(
    /^\/uploads\/institutions\/([^/]+)\/logo\/([^/]+)$/
  );
  if (logoMatch) {
    return {
      type: 'institution-logo',
      contextId: logoMatch[1],
      fileName: logoMatch[2],
    };
  }

  const avatarMatch = path.match(
    /^\/uploads\/users\/([^/]+)\/avatar\/([^/]+)$/
  );
  if (avatarMatch) {
    return {
      type: 'user-avatar',
      contextId: avatarMatch[1],
      fileName: avatarMatch[2],
    };
  }

  return null;
}
