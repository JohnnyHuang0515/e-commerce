import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { AuthService } from '../services/authService';
import { ImageService, type ImageSearchParams } from '../services/imageService';
import { LogService, type LogQueryParams } from '../services/logService';

export { useDashboardOverview, useDashboardRealtime, useDashboardAnalytics } from './useDashboard';
export { useProducts, useProductStats } from './useProducts';
export { useOrders, useOrder, useCreateOrder, useUpdateOrder, useOrderStats } from './useOrders';
export { useUsers, useUserStats } from './useUsers';
export {
  useInventories,
  useAdjustStock,
  useLowStockAlerts,
  useOutOfStockAlerts,
  useInventoryStats,
} from './useInventory';
export {
  useNotifications,
  useNotificationStats,
  useSendNotification,
  useCreateNotification,
  useUpdateNotification,
  useDeleteNotification,
} from './useNotifications';
export {
  useCurrentPermissions,
  usePermissionCatalog,
  useRoleCatalog,
  usePermissionStats,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
  useAssignRole,
} from './usePermissions';
export {
  useRecommendations,
  usePopularRecommendations,
  useSimilarRecommendations,
  useRefreshRecommendations,
} from './useRecommendations';
export { usePayments, usePaymentStats } from './usePayments';
export { useShipments, useLogisticsStats } from './useLogistics';
export { useAnalyticsDashboard } from './useAnalytics';
export { useUtilityStats, useMaintenanceTasks } from './useUtility';

// 認證相關 hooks
export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: AuthService.login,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'profile'] });
    },
  });
};

export const useRegister = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: AuthService.register,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'profile'] });
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: AuthService.logout,
    onSuccess: () => {
      queryClient.clear();
    },
  });
};

export const useProfile = () =>
  useQuery({
    queryKey: ['auth', 'profile'],
    queryFn: AuthService.getProfile,
    enabled: AuthService.isAuthenticated(),
    staleTime: 10 * 60 * 1000,
  });

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: AuthService.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'profile'] });
    },
  });
};

export const useRefreshData = () => {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries();
  };
};

// 圖片相關 hooks
export const useImages = (params?: ImageSearchParams) =>
  useQuery({
    queryKey: ['images', params],
    queryFn: () => ImageService.getImages(params),
    staleTime: 2 * 60 * 1000,
  });

export const useImage = (imageId: string) =>
  useQuery({
    queryKey: ['images', imageId],
    queryFn: () => ImageService.getImage(imageId),
    enabled: Boolean(imageId),
  });

export const useImagesByEntity = (
  entityType: 'product' | 'user' | 'category',
  entityId: string,
) =>
  useQuery({
    queryKey: ['images', entityType, entityId],
    queryFn: () => ImageService.getImagesByEntity(entityType, entityId),
    enabled: Boolean(entityId),
    staleTime: 2 * 60 * 1000,
  });

export const useUploadImage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, request }: { file: File; request: import('../services/imageService').ImageUploadRequest }) =>
      ImageService.uploadImage(file, request),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['images'] });
      queryClient.invalidateQueries({
        queryKey: ['images', variables.request.entityType, variables.request.entityId],
      });
    },
  });
};

export const useUploadImages = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ files, request }: { files: File[]; request: import('../services/imageService').ImageUploadRequest }) =>
      ImageService.uploadImages(files, request),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['images'] });
      queryClient.invalidateQueries({
        queryKey: ['images', variables.request.entityType, variables.request.entityId],
      });
    },
  });
};

export const useDeleteImage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ImageService.deleteImage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['images'] });
    },
  });
};

export const useImageStats = () =>
  useQuery({
    queryKey: ['images', 'stats'],
    queryFn: () => ImageService.getImageStats(),
    staleTime: 5 * 60 * 1000,
  });

// 日誌相關 hooks
export const useLogs = (params?: LogQueryParams) =>
  useQuery({
    queryKey: ['logs', params],
    queryFn: () => LogService.getLogs(params),
    staleTime: 60 * 1000,
  });

export const useLogStats = () =>
  useQuery({
    queryKey: ['logs', 'stats'],
    queryFn: () => LogService.getLogStats(),
    staleTime: 5 * 60 * 1000,
  });
