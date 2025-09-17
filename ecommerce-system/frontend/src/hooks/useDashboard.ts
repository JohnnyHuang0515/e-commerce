import { useQuery } from '@tanstack/react-query';

import { DashboardService } from '../services/dashboardService';

const FIVE_MINUTES = 5 * 60 * 1000;
const TEN_SECONDS = 10 * 1000;
const TEN_MINUTES = 10 * 60 * 1000;

export const useDashboardOverview = () =>
  useQuery({
    queryKey: ['dashboard', 'overview'],
    queryFn: () => DashboardService.getOverview(),
    staleTime: FIVE_MINUTES,
    retry: 3,
  });

export const useDashboardRealtime = () =>
  useQuery({
    queryKey: ['dashboard', 'realtime'],
    queryFn: () => DashboardService.getRealtime(),
    refetchInterval: 30 * 1000,
    staleTime: TEN_SECONDS,
  });

export const useDashboardAnalytics = (period?: string) =>
  useQuery({
    queryKey: ['dashboard', 'analytics', period],
    queryFn: () => DashboardService.getAnalytics('sales', period),
    staleTime: TEN_MINUTES,
  });
