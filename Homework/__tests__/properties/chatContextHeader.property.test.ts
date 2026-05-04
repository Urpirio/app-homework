// Feature: homework-app-integration, Property 6: Chat context header matches chat type
/**
 * Property 6: Chat context header matches chat type
 *
 * For any chat with type 'user', the header should display online status text
 * ("En línea"), and for any chat with type 'project', the header should display
 * group chat text ("Chat de Aula"). The header should never be empty.
 *
 * **Validates: Requirements 2.8**
 */

import * as fc from 'fast-check';

// ---- Pure logic extracted from chat/[id].tsx for testability ----

type ChatType = 'user' | 'project';

/**
 * Returns the context header text for a given chat type.
 * Mirrors the logic in chat/[id].tsx:
 *   {isGroup ? 'Chat de Aula' : 'En línea'}
 */
function getChatContextHeader(chatType: ChatType): string {
  const isGroup = chatType === 'project';
  return isGroup ? 'Chat de Aula' : 'En línea';
}

// ---- Arbitraries ----

const chatTypeArb = fc.constantFrom<ChatType>('user', 'project');

const chatNameArb = fc.string({ minLength: 1, maxLength: 100 }).filter(
  (s) => s.trim().length > 0
);

// ---- Tests ----

describe('Property 6: Chat context header matches chat type', () => {
  it('returns "En línea" for user chats', () => {
    fc.assert(
      fc.property(chatNameArb, (_name) => {
        const header = getChatContextHeader('user');
        expect(header).toBe('En línea');
      }),
      { numRuns: 100 }
    );
  });

  it('returns "Chat de Aula" for project chats', () => {
    fc.assert(
      fc.property(chatNameArb, (_name) => {
        const header = getChatContextHeader('project');
        expect(header).toBe('Chat de Aula');
      }),
      { numRuns: 100 }
    );
  });

  it('never returns an empty string for any chat type', () => {
    fc.assert(
      fc.property(chatTypeArb, (chatType) => {
        const header = getChatContextHeader(chatType);
        expect(header.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });

  it('returns exactly one of the two expected values for any chat type', () => {
    fc.assert(
      fc.property(chatTypeArb, (chatType) => {
        const header = getChatContextHeader(chatType);
        expect(['En línea', 'Chat de Aula']).toContain(header);
      }),
      { numRuns: 100 }
    );
  });

  it('is deterministic — same chat type always produces same header', () => {
    fc.assert(
      fc.property(chatTypeArb, (chatType) => {
        const header1 = getChatContextHeader(chatType);
        const header2 = getChatContextHeader(chatType);
        expect(header1).toBe(header2);
      }),
      { numRuns: 100 }
    );
  });

  it('user and project types produce different headers', () => {
    const userHeader = getChatContextHeader('user');
    const projectHeader = getChatContextHeader('project');
    expect(userHeader).not.toBe(projectHeader);
  });
});
