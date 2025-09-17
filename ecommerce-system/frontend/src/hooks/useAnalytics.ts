import { useQuery } from '@tanstack/react-query';

import { AnalyticsService, type AnalyticsDashboard } from '../services/analyticsService';
import type { ApiResponse } from '../types/api';

export const useAnalyticsDashboard = () =>
  useQuery<ApiResponse<AnalyticsDashboard>>({
    queryKey: ['analytics', 'dashboard'],
    queryFn: () => AnalyticsService.getDashboard(),
    staleTime: 5 * 60 * 1000,
  });
