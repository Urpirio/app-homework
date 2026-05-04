/**
 * Tickets React Query Hooks
 *
 * Handles support ticket CRUD operations.
 *
 * Validates: Requirements 10.1, 10.2, 4.9
 */

import {
    useInfiniteQuery,
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';

import type { Ticket } from '../../types/ticket';
import api from '../../utils/api';

export const ticketKeys = {
  all: ['tickets'] as const,
  list: ['tickets', 'list'] as const,
  detail: (id: string) => ['tickets', 'detail', id] as const,
  byUser: (userId: string) => ['tickets', 'user', userId] as const,
};

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

interface CreateTicketPayload {
  title: string;
  description: string;
  category: string;
  priority?: string;
}

export function useTickets() {
  return useInfiniteQuery({
    queryKey: ticketKeys.list,
    queryFn: async ({ pageParam = 1 }): Promise<PaginatedResponse<Ticket>> => {
      const { data } = await api.get<PaginatedResponse<Ticket>>('/tickets', {
        params: { page: pageParam, limit: 20 },
      });
      return data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const nextPage = lastPage.page + 1;
      return nextPage * lastPage.limit < lastPage.total ? nextPage : undefined;
    },
  });
}

export function useTicketDetail(ticketId: string) {
  return useQuery({
    queryKey: ticketKeys.detail(ticketId),
    queryFn: async (): Promise<Ticket> => {
      const { data } = await api.get<Ticket>(`/tickets/${ticketId}`);
      return data;
    },
    enabled: !!ticketId,
  });
}

export function useUserTickets(userId: string) {
  return useInfiniteQuery({
    queryKey: ticketKeys.byUser(userId),
    queryFn: async ({ pageParam = 1 }): Promise<PaginatedResponse<Ticket>> => {
      const { data } = await api.get<PaginatedResponse<Ticket>>(
        `/users/${userId}/tickets`,
        { params: { page: pageParam, limit: 20 } }
      );
      return data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const nextPage = lastPage.page + 1;
      return nextPage * lastPage.limit < lastPage.total ? nextPage : undefined;
    },
    enabled: !!userId,
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateTicketPayload): Promise<Ticket> => {
      // Only send fields that exist in the Ticket schema
      const { data } = await api.post<Ticket>('/tickets', {
        title: payload.title,
        description: payload.description,
        category: payload.category,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.all });
    },
  });
}

interface UpdateTicketPayload {
  status?: string;
  assignedToId?: string;
  escalationNote?: string;
}

export function useSelfAssignTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ticketId: string): Promise<Ticket> => {
      const { data } = await api.patch<Ticket>(`/tickets/${ticketId}/self-assign`);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.all });
      queryClient.setQueryData(ticketKeys.detail(data.id), data);
    },
  });
}

export function useUpdateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      ticketId,
      payload,
    }: {
      ticketId: string;
      payload: UpdateTicketPayload;
    }): Promise<Ticket> => {
      const { data } = await api.patch<Ticket>(`/tickets/${ticketId}`, payload);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.all });
      queryClient.setQueryData(ticketKeys.detail(data.id), data);
    },
  });
}

