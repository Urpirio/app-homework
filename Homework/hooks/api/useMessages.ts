/**
 * Messages React Query Hooks
 *
 * Handles chat history with useInfiniteQuery (50 per page, reverse chronological),
 * message sending, and chat history management.
 *
 * NOTE: The backend returns a plain array (not paginated) for messages.
 * We wrap it in a consistent shape so the infinite query works correctly.
 *
 * Validates: Requirements 10.1, 10.2, 4.9
 */

import {
    useInfiniteQuery,
    useMutation,
    useQueryClient,
} from '@tanstack/react-query';

import type { ChatMessage } from '../../types/message';
import api from '../../utils/api';

export const messageKeys = {
  all: ['messages'] as const,
  conversation: (id: string, type: 'user' | 'project') =>
    ['messages', type, id] as const,
  projectChat: (projectId: string) =>
    ['messages', 'project', projectId] as const,
};

// The backend returns a plain array — we normalize it into this shape
interface MessagePage {
  data: ChatMessage[];
  page: number;
  limit: number;
  total: number;
}

interface SendMessagePayload {
  targetId: string;
  type: 'user' | 'project';
  text: string;
  attachmentUrl?: string;
}

export function useConversation(id: string, type: 'user' | 'project') {
  const endpoint = type === 'project' ? `/messages/project/${id}` : `/messages/${id}`;

  return useInfiniteQuery({
    queryKey: messageKeys.conversation(id, type),
    queryFn: async ({ pageParam = 1 }): Promise<MessagePage> => {
      const { data } = await api.get(endpoint, {
        params: { page: pageParam, limit: 50 },
      });

      // Backend may return a plain array or a paginated object
      if (Array.isArray(data)) {
        return {
          data: data as ChatMessage[],
          page: pageParam as number,
          limit: 50,
          // If it's a plain array, assume no more pages
          total: (data as ChatMessage[]).length,
        };
      }

      // Already paginated shape
      return {
        data: data.data ?? [],
        page: data.page ?? (pageParam as number),
        limit: data.limit ?? 50,
        total: data.total ?? (data.data?.length ?? 0),
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      // Only paginate if the backend supports it (total > items fetched so far)
      if (lastPage.total <= lastPage.limit) return undefined;
      const nextPage = lastPage.page + 1;
      return nextPage * lastPage.limit < lastPage.total ? nextPage : undefined;
    },
    enabled: !!id,
    // Keep data fresh — refetch when window regains focus
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      targetId,
      type,
      text,
      attachmentUrl,
    }: SendMessagePayload): Promise<ChatMessage> => {
      const { data } = await api.post<ChatMessage>(
        `/messages/${targetId}`,
        { text, attachmentUrl },
        { params: { type } }
      );
      return data;
    },
    onSuccess: (_data, variables) => {
      // Refetch the conversation to get the latest messages from the server
      queryClient.invalidateQueries({
        queryKey: messageKeys.conversation(variables.targetId, variables.type),
      });
    },
  });
}

export function useDeleteChatHistory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conversationId: string): Promise<void> => {
      await api.delete(`/messages/${conversationId}/history`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messageKeys.all });
    },
  });
}
