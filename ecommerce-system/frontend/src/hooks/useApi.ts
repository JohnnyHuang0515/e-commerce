import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardService } from '../services/dashboardService';
import { ProductService, ProductSearchParams } from '../services/productService';
import { OrderService, OrderSearchParams } from '../services/orderService';
import { AuthService } from '../services/authService';
import { ImageService, ImageSearchParams } from '../services/imageService';
import { PaymentService, PaymentSearchParams } from '../services/paymentService';
import { LogisticsService, LogisticsSearchParams } from '../services/logisticsService';
import { InventoryService, InventorySearchParams } from '../services/inventoryService';
import { PermissionService, PermissionSearchParams, RoleSearchParams, UserRoleSearchParams } from '../services/permissionService';

// Dashboard 相關 hooks
export const useDashboardOverview = () => {
  return useQuery({
    queryKey: ['dashboard', 'overview'],
    queryFn: () => DashboardService.getOverview(),
    staleTime: 5 * 60 * 1000, // 5 分鐘
    retry: 3,
  });
};

export const useDashboardRealtime = () => {
  return useQuery({
    queryKey: ['dashboard', 'realtime'],
    queryFn: () => DashboardService.getRealtime(),
    refetchInterval: 30 * 1000, // 30 秒自動刷新
    staleTime: 10 * 1000, // 10 秒
  });
};

export const useDashboardAnalytics = (period?: string) => {
  return useQuery({
    queryKey: ['dashboard', 'analytics', period],
    queryFn: () => DashboardService.getAnalytics('sales', period),
    staleTime: 10 * 60 * 1000, // 10 分鐘
  });
};

// 商品相關 hooks
export const useProducts = (params?: ProductSearchParams) => {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => ProductService.getProducts(params),
    staleTime: 2 * 60 * 1000, // 2 分鐘
  });
};

export const useProduct = (productId: string) => {
  return useQuery({
    queryKey: ['products', productId],
    queryFn: () => ProductService.getProduct(productId),
    enabled: !!productId,
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ProductService.createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, ...data }: any) => ProductService.updateProduct({ id, ...data }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products', variables.id] });
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ProductService.deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

// 訂單相關 hooks
export const useOrders = (params?: OrderSearchParams) => {
  return useQuery({
    queryKey: ['orders', params],
    queryFn: () => OrderService.getOrders(params),
    staleTime: 1 * 60 * 1000, // 1 分鐘
  });
};

export const useOrder = (orderId: string) => {
  return useQuery({
    queryKey: ['orders', orderId],
    queryFn: () => OrderService.getOrder(orderId),
    enabled: !!orderId,
  });
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: OrderService.createOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};

export const useUpdateOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ orderId, ...data }: any) => OrderService.updateOrder(orderId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders', variables.orderId] });
    },
  });
};

export const useOrderStats = () => {
  return useQuery({
    queryKey: ['orders', 'stats'],
    queryFn: () => OrderService.getOrderStats(),
    staleTime: 5 * 60 * 1000, // 5 分鐘
  });
};

// 用戶相關 hooks (現在由 AuthService 處理)
export const useUsers = (params?: UserSearchParams) => {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => AuthService.getUsers(params),
    staleTime: 2 * 60 * 1000, // 2 分鐘
  });
};

export const useUser = (userId: string) => {
  return useQuery({
    queryKey: ['users', userId],
    queryFn: () => AuthService.getUser(userId),
    enabled: !!userId,
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: AuthService.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, ...data }: any) => AuthService.updateUser({ id, ...data }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['users', variables.id] });
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: AuthService.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useUserStats = () => {
  return useQuery({
    queryKey: ['users', 'stats'],
    queryFn: () => AuthService.getUserStats(),
    staleTime: 5 * 60 * 1000, // 5 分鐘
  });
};

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

export const useProfile = () => {
  return useQuery({
    queryKey: ['auth', 'profile'],
    queryFn: AuthService.getProfile,
    enabled: AuthService.isAuthenticated(),
    staleTime: 10 * 60 * 1000, // 10 分鐘
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: AuthService.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'profile'] });
    },
  });
};

// 通用 hooks
export const useRefreshData = () => {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.invalidateQueries();
  };
};

// 圖片相關 hooks
export const useImages = (params?: ImageSearchParams) => {
  return useQuery({
    queryKey: ['images', params],
    queryFn: () => ImageService.getImages(params),
    staleTime: 2 * 60 * 1000, // 2 分鐘
  });
};

export const useImage = (imageId: string) => {
  return useQuery({
    queryKey: ['images', imageId],
    queryFn: () => ImageService.getImage(imageId),
    enabled: !!imageId,
  });
};

export const useImagesByEntity = (
  entityType: 'product' | 'user' | 'category',
  entityId: string
) => {
  return useQuery({
    queryKey: ['images', entityType, entityId],
    queryFn: () => ImageService.getImagesByEntity(entityType, entityId),
    enabled: !!entityId,
    staleTime: 2 * 60 * 1000, // 2 分鐘
  });
};

export const useUploadImage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ file, request }: { file: File; request: any }) => 
      ImageService.uploadImage(file, request),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['images'] });
      queryClient.invalidateQueries({ 
        queryKey: ['images', variables.request.entityType, variables.request.entityId] 
      });
    },
  });
};

export const useUploadImages = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ files, request }: { files: File[]; request: any }) => 
      ImageService.uploadImages(files, request),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['images'] });
      queryClient.invalidateQueries({ 
        queryKey: ['images', variables.request.entityType, variables.request.entityId] 
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

export const useImageStats = () => {
  return useQuery({
    queryKey: ['images', 'stats'],
    queryFn: () => ImageService.getImageStats(),
    staleTime: 5 * 60 * 1000, // 5 分鐘
  });
};

// Payment 相關 hooks
export const usePayments = (params?: PaymentSearchParams) => {
  return useQuery({
    queryKey: ['payments', params],
    queryFn: () => PaymentService.getPayments(params),
    staleTime: 2 * 60 * 1000, // 2 分鐘
  });
};

export const usePayment = (paymentId: string) => {
  return useQuery({
    queryKey: ['payments', paymentId],
    queryFn: () => PaymentService.getPayment(paymentId),
    enabled: !!paymentId,
  });
};

export const useCreatePayment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: PaymentService.createPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });
};

export const useUpdatePayment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ paymentId, data }: { paymentId: string; data: any }) =>
      PaymentService.updatePayment(paymentId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['payments', variables.paymentId] });
    },
  });
};

export const useDeletePayment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: PaymentService.deletePayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });
};

export const useRefundPayment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: PaymentService.refundPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });
};

export const usePaymentStats = (params?: { startDate?: string; endDate?: string }) => {
  return useQuery({
    queryKey: ['payments', 'stats', params],
    queryFn: () => PaymentService.getPaymentStats(params),
    staleTime: 5 * 60 * 1000, // 5 分鐘
  });
};

export const usePaymentOverview = () => {
  return useQuery({
    queryKey: ['payments', 'overview'],
    queryFn: () => PaymentService.getPaymentOverview(),
    staleTime: 2 * 60 * 1000, // 2 分鐘
  });
};

// Logistics 相關 hooks
export const useShipments = (params?: LogisticsSearchParams) => {
  return useQuery({
    queryKey: ['shipments', params],
    queryFn: () => LogisticsService.getShipments(params),
    staleTime: 2 * 60 * 1000, // 2 分鐘
  });
};

export const useShipment = (shipmentId: string) => {
  return useQuery({
    queryKey: ['shipments', shipmentId],
    queryFn: () => LogisticsService.getShipment(shipmentId),
    enabled: !!shipmentId,
  });
};

export const useCreateShipment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: LogisticsService.createShipment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
    },
  });
};

export const useUpdateShipment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ shipmentId, data }: { shipmentId: string; data: any }) =>
      LogisticsService.updateShipment(shipmentId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
      queryClient.invalidateQueries({ queryKey: ['shipments', variables.shipmentId] });
    },
  });
};

export const useDeleteShipment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: LogisticsService.deleteShipment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
    },
  });
};

export const useTrackShipment = (trackingNumber: string) => {
  return useQuery({
    queryKey: ['shipments', 'track', trackingNumber],
    queryFn: () => LogisticsService.trackShipment(trackingNumber),
    enabled: !!trackingNumber,
    refetchInterval: 30 * 1000, // 30 秒自動刷新
  });
};

export const useLogisticsStats = (params?: { startDate?: string; endDate?: string }) => {
  return useQuery({
    queryKey: ['logistics', 'stats', params],
    queryFn: () => LogisticsService.getLogisticsStats(params),
    staleTime: 5 * 60 * 1000, // 5 分鐘
  });
};

export const useLogisticsOverview = () => {
  return useQuery({
    queryKey: ['logistics', 'overview'],
    queryFn: () => LogisticsService.getLogisticsOverview(),
    staleTime: 2 * 60 * 1000, // 2 分鐘
  });
};

// Inventory 相關 hooks
export const useInventories = (params?: InventorySearchParams) => {
  return useQuery({
    queryKey: ['inventories', params],
    queryFn: () => InventoryService.getInventories(params),
    staleTime: 2 * 60 * 1000, // 2 分鐘
  });
};

export const useInventory = (inventoryId: string) => {
  return useQuery({
    queryKey: ['inventories', inventoryId],
    queryFn: () => InventoryService.getInventory(inventoryId),
    enabled: !!inventoryId,
  });
};

export const useCreateInventory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: InventoryService.createInventory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventories'] });
    },
  });
};

export const useUpdateInventory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ inventoryId, data }: { inventoryId: string; data: any }) =>
      InventoryService.updateInventory(inventoryId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['inventories'] });
      queryClient.invalidateQueries({ queryKey: ['inventories', variables.inventoryId] });
    },
  });
};

export const useDeleteInventory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: InventoryService.deleteInventory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventories'] });
    },
  });
};

export const useAdjustStock = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: InventoryService.adjustStock,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventories'] });
    },
  });
};

export const useReserveStock = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: InventoryService.reserveStock,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventories'] });
    },
  });
};

export const useInventoryStats = (params?: { startDate?: string; endDate?: string }) => {
  return useQuery({
    queryKey: ['inventories', 'stats', params],
    queryFn: () => InventoryService.getInventoryStats(params),
    staleTime: 5 * 60 * 1000, // 5 分鐘
  });
};

export const useInventoryOverview = () => {
  return useQuery({
    queryKey: ['inventories', 'overview'],
    queryFn: () => InventoryService.getInventoryOverview(),
    staleTime: 2 * 60 * 1000, // 2 分鐘
  });
};

export const useLowStockAlerts = () => {
  return useQuery({
    queryKey: ['inventories', 'alerts', 'low-stock'],
    queryFn: () => InventoryService.getLowStockAlerts(),
    staleTime: 1 * 60 * 1000, // 1 分鐘
    refetchInterval: 5 * 60 * 1000, // 5 分鐘自動刷新
  });
};

export const useOutOfStockAlerts = () => {
  return useQuery({
    queryKey: ['inventories', 'alerts', 'out-of-stock'],
    queryFn: () => InventoryService.getOutOfStockAlerts(),
    staleTime: 1 * 60 * 1000, // 1 分鐘
    refetchInterval: 5 * 60 * 1000, // 5 分鐘自動刷新
  });
};

// Permission 相關 hooks
export const usePermissions = (params?: PermissionSearchParams) => {
  return useQuery({
    queryKey: ['permissions', params],
    queryFn: () => PermissionService.getPermissions(params),
    staleTime: 5 * 60 * 1000, // 5 分鐘
  });
};

export const usePermission = (permissionId: string) => {
  return useQuery({
    queryKey: ['permissions', permissionId],
    queryFn: () => PermissionService.getPermissionById(permissionId),
    enabled: !!permissionId,
  });
};

export const useCreatePermission = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: PermissionService.createPermission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
    },
  });
};

export const useUpdatePermission = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, permission }: { id: string; permission: any }) => 
      PermissionService.updatePermission(id, permission),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      queryClient.invalidateQueries({ queryKey: ['permissions', id] });
    },
  });
};

export const useDeletePermission = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: PermissionService.deletePermission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
    },
  });
};

export const useRoles = (params?: RoleSearchParams) => {
  return useQuery({
    queryKey: ['roles', params],
    queryFn: () => PermissionService.getRoles(params),
    staleTime: 5 * 60 * 1000, // 5 分鐘
  });
};

export const useRole = (roleId: string) => {
  return useQuery({
    queryKey: ['roles', roleId],
    queryFn: () => PermissionService.getRoleById(roleId),
    enabled: !!roleId,
  });
};

export const useCreateRole = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: PermissionService.createRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });
};

export const useUpdateRole = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: any }) => 
      PermissionService.updateRole(id, role),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['roles', id] });
    },
  });
};

export const useDeleteRole = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: PermissionService.deleteRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });
};

export const useAssignPermissionsToRole = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ roleId, permissionIds }: { roleId: string; permissionIds: string[] }) => 
      PermissionService.assignPermissionsToRole(roleId, permissionIds),
    onSuccess: (_, { roleId }) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['roles', roleId] });
    },
  });
};

export const useRemovePermissionsFromRole = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ roleId, permissionIds }: { roleId: string; permissionIds: string[] }) => 
      PermissionService.removePermissionsFromRole(roleId, permissionIds),
    onSuccess: (_, { roleId }) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['roles', roleId] });
    },
  });
};

export const useUserRoles = (params?: UserRoleSearchParams) => {
  return useQuery({
    queryKey: ['user-roles', params],
    queryFn: () => PermissionService.getUserRoles(params),
    staleTime: 2 * 60 * 1000, // 2 分鐘
  });
};

export const useUserRolesByUserId = (userId: string) => {
  return useQuery({
    queryKey: ['user-roles', 'user', userId],
    queryFn: () => PermissionService.getUserRolesByUserId(userId),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 分鐘
  });
};

export const useAssignUserRole = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, roleId, expiresAt }: { userId: string; roleId: string; expiresAt?: string }) => 
      PermissionService.assignUserRole(userId, roleId, expiresAt),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
      queryClient.invalidateQueries({ queryKey: ['user-roles', 'user', userId] });
    },
  });
};

export const useRemoveUserRole = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: PermissionService.removeUserRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
    },
  });
};

export const useCheckPermission = () => {
  return useMutation({
    mutationFn: PermissionService.checkPermission,
  });
};

export const useUserPermissions = (userId: string) => {
  return useQuery({
    queryKey: ['permissions', 'user', userId],
    queryFn: () => PermissionService.getUserPermissions(userId),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 分鐘
  });
};

export const usePermissionStats = () => {
  return useQuery({
    queryKey: ['permissions', 'stats'],
    queryFn: () => PermissionService.getPermissionStats(),
    staleTime: 10 * 60 * 1000, // 10 分鐘
  });
};

export const useInitializeDefaultData = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: PermissionService.initializeDefaultData,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
    },
  });
};

// 通用 hooks
export const useOptimisticUpdate = <T>(
  queryKey: string[],
  updateFn: (oldData: T, newData: Partial<T>) => T
) => {
  const queryClient = useQueryClient();
  
  return (newData: Partial<T>) => {
    queryClient.setQueryData(queryKey, (oldData: T) => 
      oldData ? updateFn(oldData, newData) : oldData
    );
  };
};
