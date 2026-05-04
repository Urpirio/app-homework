/**
 * Messages React Query Hooks
 *
 * Handles chat history with useInfiniteQuery (50 per page, reverse chronological),
 * message sending, and chat history management.
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

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
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
    queryFn: async ({ pageParam = 1 }): Promise<PaginatedResponse<ChatMessage>> => {
      const { data } = await api.get<PaginatedResponse<ChatMessage>>(endpoint, {
        params: { page: pageParam, limit: 50 },
      });
      return data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const nextPage = lastPage.page + 1;
      return nextPage * lastPage.limit < lastPage.total ? nextPage : undefined;
    },
    enabled: !!id,
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
