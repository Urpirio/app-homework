// Feature: homework-app-integration, Property 4: Chat message round-trip
/**
 * Property 4: Chat message round-trip
 *
 * For any valid message text and optional attachment, sending a message and
 * receiving it back preserves the text and attachment metadata. Tests the
 * message data transformation logic (ChatMessage → DisplayMessage).
 *
 * **Validates: Requirements 2.3, 2.4**
 */

import * as fc from 'fast-check';

// ---- Pure logic extracted from chat/[id].tsx for testability ----

interface ChatAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  fileSize?: number;
}

interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  receiverId?: string;
  projectId?: string;
  attachment?: ChatAttachment;
  createdAt: string;
  sender?: { id: string; fullName: string; avatarUrl?: string };
}

interface DisplayAttachment {
  type: 'image' | 'video' | 'document';
  uri: string;
  name: string;
  mimeType?: string;
}

interface DisplayMessage {
  id: string;
  text: string;
  sender: 'me' | 'other';
  senderName?: string;
  timestamp: string;
  attachment?: DisplayAttachment;
}

const API_URL = 'https://app-homework-production.up.railway.app';

function getFullUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  if (path.startsWith('file://')) return path;
  return `${API_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}

function classifyMimeType(mimeType: string): 'image' | 'video' | 'document' {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  return 'document';
}

function chatMessageToDisplayMessage(
  msg: ChatMessage,
  myId: string
): DisplayMessage {
  return {
    id: msg.id,
    text: msg.text || '',
    sender: msg.senderId === myId || msg.sender?.id === myId ? 'me' : 'other',
    senderName: msg.sender?.fullName,
    timestamp: new Date(msg.createdAt).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    }),
    attachment: msg.attachment
      ? {
          type: classifyMimeType(msg.attachment.mimeType),
          uri: getFullUrl(msg.attachment.fileUrl),
          name: msg.attachment.fileName,
          mimeType: msg.attachment.mimeType,
        }
      : undefined,
  };
}

// ---- Arbitraries ----

const uuidArb = fc.uuid();

const mimeTypeArb = fc.oneof(
  fc.constant('image/jpeg'),
  fc.constant('image/png'),
  fc.constant('image/gif'),
  fc.constant('video/mp4'),
  fc.constant('video/quicktime'),
  fc.constant('application/pdf'),
  fc.constant('application/msword'),
  fc.constant('text/plain')
);

const attachmentArb = fc.record({
  id: uuidArb,
  fileName: fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
  fileUrl: fc.oneof(
    fc.constant('/uploads/file1.jpg'),
    fc.constant('/uploads/doc.pdf'),
    fc.constant('https://cdn.example.com/file.png')
  ),
  mimeType: mimeTypeArb,
  fileSize: fc.option(fc.nat({ max: 50_000_000 }), { nil: undefined }),
});

const chatMessageArb = (myId: string) =>
  fc.record({
    id: uuidArb,
    text: fc.string({ minLength: 0, maxLength: 500 }),
    senderId: fc.oneof(fc.constant(myId), uuidArb),
    receiverId: fc.option(uuidArb, { nil: undefined }),
    projectId: fc.option(uuidArb, { nil: undefined }),
    attachment: fc.option(attachmentArb, { nil: undefined }),
    createdAt: fc.integer({ min: 1704067200000, max: 1767225600000 }).map((ts) => new Date(ts).toISOString()),
    sender: fc.option(
      fc.record({
        id: fc.oneof(fc.constant(myId), uuidArb),
        fullName: fc.string({ minLength: 1, maxLength: 50 }),
        avatarUrl: fc.option(fc.webUrl(), { nil: undefined }),
      }),
      { nil: undefined }
    ),
  });

// ---- Tests ----

describe('Property 4: Chat message round-trip', () => {
  const MY_ID = '00000000-0000-0000-0000-000000000001';

  it('preserves message text through ChatMessage → DisplayMessage transformation', () => {
    fc.assert(
      fc.property(chatMessageArb(MY_ID), (msg) => {
        const display = chatMessageToDisplayMessage(msg, MY_ID);
        expect(display.text).toBe(msg.text || '');
        expect(display.id).toBe(msg.id);
      }),
      { numRuns: 100 }
    );
  });

  it('preserves attachment metadata (fileName, mimeType) through transformation', () => {
    fc.assert(
      fc.property(
        chatMessageArb(MY_ID).filter((m) => m.attachment !== undefined),
        (msg) => {
          const display = chatMessageToDisplayMessage(msg, MY_ID);
          expect(display.attachment).toBeDefined();
          expect(display.attachment!.name).toBe(msg.attachment!.fileName);
          expect(display.attachment!.mimeType).toBe(msg.attachment!.mimeType);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('correctly classifies attachment type based on MIME type', () => {
    fc.assert(
      fc.property(
        chatMessageArb(MY_ID).filter((m) => m.attachment !== undefined),
        (msg) => {
          const display = chatMessageToDisplayMessage(msg, MY_ID);
          const mime = msg.attachment!.mimeType;
          if (mime.startsWith('image/')) {
            expect(display.attachment!.type).toBe('image');
          } else if (mime.startsWith('video/')) {
            expect(display.attachment!.type).toBe('video');
          } else {
            expect(display.attachment!.type).toBe('document');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('correctly identifies sender as "me" when senderId matches myId', () => {
    fc.assert(
      fc.property(
        chatMessageArb(MY_ID).map((m) => ({ ...m, senderId: MY_ID })),
        (msg) => {
          const display = chatMessageToDisplayMessage(msg, MY_ID);
          expect(display.sender).toBe('me');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('correctly identifies sender as "other" when senderId does not match myId', () => {
    const OTHER_ID = '00000000-0000-0000-0000-000000000099';
    fc.assert(
      fc.property(
        chatMessageArb(MY_ID).map((m) => ({
          ...m,
          senderId: OTHER_ID,
          sender: m.sender ? { ...m.sender, id: OTHER_ID } : undefined,
        })),
        (msg) => {
          const display = chatMessageToDisplayMessage(msg, MY_ID);
          expect(display.sender).toBe('other');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('messages without attachment have undefined attachment in DisplayMessage', () => {
    fc.assert(
      fc.property(
        chatMessageArb(MY_ID).map((m) => ({ ...m, attachment: undefined })),
        (msg) => {
          const display = chatMessageToDisplayMessage(msg, MY_ID);
          expect(display.attachment).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('resolves relative fileUrl paths to full API URLs', () => {
    fc.assert(
      fc.property(
        chatMessageArb(MY_ID).filter(
          (m) =>
            m.attachment !== undefined &&
            !m.attachment.fileUrl.startsWith('http') &&
            !m.attachment.fileUrl.startsWith('file://')
        ),
        (msg) => {
          const display = chatMessageToDisplayMessage(msg, MY_ID);
          expect(display.attachment!.uri).toContain(API_URL);
          expect(display.attachment!.uri).toContain(msg.attachment!.fileUrl);
        }
      ),
      { numRuns: 100 }
    );
  });
});
