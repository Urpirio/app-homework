/**
 * Library React Query Hooks
 *
 * Handles books, categories, and loans with useInfiniteQuery (20 per page).
 *
 * Validates: Requirements 10.1, 10.2, 4.9
 */

import {
    useInfiniteQuery,
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';

import type { Book, BookCategory } from '../../types/library';
import api from '../../utils/api';

export const libraryKeys = {
  all: ['library'] as const,
  books: (params?: { search?: string; categoryId?: string }) =>
    ['library', 'books', params] as const,
  bookDetail: (id: string) => ['library', 'books', id] as const,
  categories: ['library', 'categories'] as const,
};

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export function useBooks(params?: { search?: string; categoryId?: string }) {
  return useInfiniteQuery({
    queryKey: libraryKeys.books(params),
    queryFn: async ({ pageParam = 1 }): Promise<PaginatedResponse<Book>> => {
      const { data } = await api.get<PaginatedResponse<Book>>('/library/books', {
        params: { page: pageParam, limit: 20, ...params },
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

export function useBookDetail(bookId: string) {
  return useQuery({
    queryKey: libraryKeys.bookDetail(bookId),
    queryFn: async (): Promise<Book> => {
      const { data } = await api.get<Book>(`/library/books/${bookId}`);
      return data;
    },
    enabled: !!bookId,
  });
}

export function useBookCategories() {
  return useQuery({
    queryKey: libraryKeys.categories,
    queryFn: async (): Promise<BookCategory[]> => {
      const { data } = await api.get<BookCategory[]>('/library/categories');
      return data;
    },
  });
}

export function useLoanBook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookId: string): Promise<void> => {
      await api.post(`/library/books/${bookId}/loan`);
    },
    onSuccess: (_data, bookId) => {
      queryClient.invalidateQueries({ queryKey: libraryKeys.bookDetail(bookId) });
      queryClient.invalidateQueries({ queryKey: libraryKeys.books() });
    },
  });
}

export function useReturnBook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (loanId: string): Promise<void> => {
      await api.patch(`/loans/${loanId}/return`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: libraryKeys.all });
    },
  });
}
