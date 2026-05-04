/**
 * Reviews React Query Hooks
 *
 * Handles review CRUD and technician stats.
 *
 * Validates: Requirements 10.1, 4.9
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { Review } from '../../types/review';
import api from '../../utils/api';

export const reviewKeys = {
  all: ['reviews'] as const,
  detail: (id: string) => ['reviews', 'detail', id] as const,
  byTechnician: (techId: string) => ['reviews', 'technician', techId] as const,
  technicianStats: (techId: string) =>
    ['reviews', 'technician', techId, 'stats'] as const,
};

interface CreateReviewPayload {
  rating: number;
  comment?: string;
  ticketId: string;
}

interface TechnicianStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>;
}

export function useReview(reviewId: string) {
  return useQuery({
    queryKey: reviewKeys.detail(reviewId),
    queryFn: async (): Promise<Review> => {
      const { data } = await api.get<Review>(`/reviews/${reviewId}`);
      return data;
    },
    enabled: !!reviewId,
  });
}

export function useTechnicianReviews(techId: string) {
  return useQuery({
    queryKey: reviewKeys.byTechnician(techId),
    queryFn: async (): Promise<Review[]> => {
      const { data } = await api.get<Review[]>(`/reviews/technician/${techId}`);
      return data;
    },
    enabled: !!techId,
  });
}

export function useTechnicianStats(techId: string) {
  return useQuery({
    queryKey: reviewKeys.technicianStats(techId),
    queryFn: async (): Promise<TechnicianStats> => {
      const { data } = await api.get<TechnicianStats>(
        `/reviews/technician/${techId}/stats`
      );
      return data;
    },
    enabled: !!techId,
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateReviewPayload): Promise<Review> => {
      const { data } = await api.post<Review>('/reviews', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.all });
    },
  });
}
