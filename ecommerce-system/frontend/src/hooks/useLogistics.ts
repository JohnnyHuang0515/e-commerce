import { useQuery } from '@tanstack/react-query';

import {
  LogisticsService,
  type LogisticsListParams,
  type LogisticsListResponse,
  type LogisticsStats,
} from '../services/logisticsService';
import type { ApiResponse } from '../types/api';

export const useShipments = (params?: LogisticsListParams) =>
  useQuery<ApiResponse<LogisticsListResponse>>({
    queryKey: ['logistics', params ?? {}],
    queryFn: () => LogisticsService.getShipments(params),
    staleTime: 2 * 60 * 1000,
  });

export const useLogisticsStats = () =>
  useQuery<ApiResponse<LogisticsStats>>({
    queryKey: ['logistics', 'stats'],
    queryFn: () => LogisticsService.getStats(),
    staleTime: 5 * 60 * 1000,
  });

export type { LogisticsListParams };
