import { useQuery } from '@tanstack/react-query';

import { UtilityService, type SystemUtilityStats, type MaintenanceTask } from '../services/utilityService';
import type { ApiResponse } from '../types/api';

export const useUtilityStats = () =>
  useQuery<ApiResponse<SystemUtilityStats>>({
    queryKey: ['utility', 'stats'],
    queryFn: () => UtilityService.getStats(),
    staleTime: 5 * 60 * 1000,
  });

export const useMaintenanceTasks = () =>
  useQuery<ApiResponse<MaintenanceTask[]>>({
    queryKey: ['utility', 'tasks'],
    queryFn: () => UtilityService.getMaintenanceTasks(),
    staleTime: 5 * 60 * 1000,
  });
