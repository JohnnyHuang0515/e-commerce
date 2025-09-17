import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  InventoryService,
  InventoryListParams,
  InventoryAdjustRequest,
  InventoryListResponse,
  InventoryAdjustmentResult,
} from '../services/inventoryService';
import type { ApiResponse, InventoryItem, InventoryStats } from '../types/api';

export type { InventoryListParams, InventoryAdjustRequest };

const INVENTORY_STALE_TIME = 2 * 60 * 1000;
const ALERTS_STALE_TIME = 60 * 1000;

export const useInventories = (params?: InventoryListParams) =>
  useQuery<ApiResponse<InventoryListResponse>>({
    queryKey: ['inventories', params ?? {}],
    queryFn: () => InventoryService.getInventories(params),
    staleTime: INVENTORY_STALE_TIME,
  });

export const useInventoryStats = () =>
  useQuery<ApiResponse<InventoryStats>>({
    queryKey: ['inventories', 'stats'],
    queryFn: () => InventoryService.getInventoryStats(),
    staleTime: 5 * 60 * 1000,
  });

export const useAdjustStock = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ApiResponse<InventoryAdjustmentResult>,
    Error,
    { productId: string; data: InventoryAdjustRequest }
  >({
    mutationFn: ({ productId, data }) => InventoryService.adjustStock(productId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventories'] });
      queryClient.invalidateQueries({ queryKey: ['inventories', 'alerts', 'low-stock'] });
      queryClient.invalidateQueries({ queryKey: ['inventories', 'alerts', 'out-of-stock'] });
      queryClient.invalidateQueries({ queryKey: ['inventories', 'stats'] });
    },
  });
};

export const useLowStockAlerts = (threshold?: number) =>
  useQuery<ApiResponse<InventoryItem[]>>({
    queryKey: ['inventories', 'alerts', 'low-stock', threshold ?? 5],
    queryFn: () => InventoryService.getLowStockAlerts(threshold ?? 5),
    staleTime: ALERTS_STALE_TIME,
    refetchInterval: 5 * 60 * 1000,
  });

export const useOutOfStockAlerts = () =>
  useQuery<ApiResponse<InventoryItem[]>>({
    queryKey: ['inventories', 'alerts', 'out-of-stock'],
    queryFn: () => InventoryService.getOutOfStockAlerts(),
    staleTime: ALERTS_STALE_TIME,
    refetchInterval: 5 * 60 * 1000,
  });
