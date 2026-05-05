/**
 * Auth React Query Hooks
 *
 * Handles login, profile fetching, profile updates, and token refresh.
 *
 * Validates: Requirements 10.1, 7.1, 7.2
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';

import type { LoginCredentials, User } from '../../types/auth';
import api from '../../utils/api';

export const authKeys = {
  profile: ['auth', 'profile'] as const,
};

interface LoginResponse {
  access_token: string;
  user: User;
}

interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: LoginCredentials): Promise<LoginResponse> => {
      const { data } = await api.post<LoginResponse>('/auth/login', credentials);
      return data;
    },
    onSuccess: async (data) => {
      await SecureStore.setItemAsync('userToken', data.access_token);
      queryClient.setQueryData(authKeys.profile, data.user);
    },
  });
}

export function useProfile() {
  return useQuery({
    queryKey: authKeys.profile,
    queryFn: async (): Promise<User> => {
      const { data } = await api.get<User>('/auth/profile');
      return data;
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<User>): Promise<User> => {
      const { data } = await api.patch<User>('/auth/profile', updates);
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(authKeys.profile, data);
    },
  });
}

export function useRefreshToken() {
  return useMutation({
    mutationFn: async (): Promise<RefreshResponse> => {
      const refreshToken = await SecureStore.getItemAsync('refreshToken');
      const { data } = await api.post<RefreshResponse>('/auth/refresh', { refreshToken });
      return data;
    },
    onSuccess: async (data) => {
      await SecureStore.setItemAsync('userToken', data.accessToken);
      await SecureStore.setItemAsync('refreshToken', data.refreshToken);
    },
  });
}
