import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  InventoryService,
  InventoryListParams,
  InventoryAdjustRequest,
} from '../services/inventoryService';

export const useInventories = (params?: InventoryListParams) =>
  useQuery({
    queryKey: ['inventories', params],
    queryFn: () => InventoryService.getInventories(params),
    staleTime: 2 * 60 * 1000,
  });

export const useAdjustInventory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, data }: { productId: string; data: InventoryAdjustRequest }) =>
      InventoryService.adjustStock(productId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventories'] });
      queryClient.invalidateQueries({ queryKey: ['inventories', 'alerts', 'low-stock'] });
      queryClient.invalidateQueries({ queryKey: ['inventories', 'alerts', 'out-of-stock'] });
      queryClient.invalidateQueries({ queryKey: ['inventories', 'stats'] });
    },
  });
};

export const useLowStockAlerts = (threshold = 5) =>
  useQuery({
    queryKey: ['inventories', 'alerts', 'low-stock', threshold],
    queryFn: () => InventoryService.getLowStockAlerts(threshold),
    staleTime: 1 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });

export const useOutOfStockAlerts = () =>
  useQuery({
    queryKey: ['inventories', 'alerts', 'out-of-stock'],
    queryFn: () => InventoryService.getOutOfStockAlerts(),
    staleTime: 1 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });

export const useInventoryStats = () =>
  useQuery({
    queryKey: ['inventories', 'stats'],
    queryFn: () => InventoryService.getInventoryStats(),
    staleTime: 5 * 60 * 1000,
  });

// 兼容舊 API：直接返回錯誤提示
const notSupported = (action: string) => () =>
  Promise.reject(new Error(`${action} 尚未在後端實作`));

export const useCreateInventory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notSupported('新增庫存'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventories'] });
    },
  });
};

export const useUpdateInventory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notSupported('更新庫存'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventories'] });
    },
  });
};

export const useDeleteInventory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notSupported('刪除庫存'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventories'] });
    },
  });
};

export const useAdjustStock = useAdjustInventory;
