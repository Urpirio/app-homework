/**
 * Message Type Definitions
 *
 * Matches the backend Prisma Message and Attachment models
 * and API response contracts.
 *
 * Validates: Requirements 4.8, 9.1
 */

export interface ChatAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  fileSize?: number;
}

export interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  receiverId?: string;
  projectId?: string;
  attachment?: ChatAttachment;
  createdAt: string;
  sender?: {
    id: string;
    fullName: string;
    avatarUrl?: string;
  };
}
