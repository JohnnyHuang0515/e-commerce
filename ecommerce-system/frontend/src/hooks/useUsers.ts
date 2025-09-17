import { useQuery } from '@tanstack/react-query';

import {
  UserService,
  type UserListParams,
  type UserListResponse,
  type UserStats,
} from '../services/userService';
import type { ApiResponse } from '../types/api';

export const useUsers = (params?: UserListParams) =>
  useQuery<ApiResponse<UserListResponse>>({
    queryKey: ['users', params ?? {}],
    queryFn: () => UserService.getUsers(params),
    staleTime: 2 * 60 * 1000,
  });

export const useUserStats = () =>
  useQuery<ApiResponse<UserStats>>({
    queryKey: ['users', 'stats'],
    queryFn: () => UserService.getStats(),
    staleTime: 5 * 60 * 1000,
  });

export type { UserListParams };
