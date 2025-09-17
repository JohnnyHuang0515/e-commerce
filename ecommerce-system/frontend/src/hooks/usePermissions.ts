import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  PermissionService,
  type PermissionDefinition,
  type PermissionStats,
  type RoleDefinition,
} from '../services/permissionService';
import type { ApiResponse } from '../types/api';

export const useCurrentPermissions = () =>
  useQuery<ApiResponse<{ permissions: string[]; count: number }>>({
    queryKey: ['permissions', 'current'],
    queryFn: () => PermissionService.getCurrentUserPermissions(),
    staleTime: 5 * 60 * 1000,
  });

export const usePermissionCatalog = () =>
  useQuery<ApiResponse<{ permissions: PermissionDefinition[] }>>({
    queryKey: ['permissions', 'catalog'],
    queryFn: () => PermissionService.getPermissionCatalog(),
    staleTime: 10 * 60 * 1000,
  });

export const useRoleCatalog = () =>
  useQuery<ApiResponse<{ roles: RoleDefinition[] }>>({
    queryKey: ['permissions', 'roles'],
    queryFn: () => PermissionService.getRoleCatalog(),
    staleTime: 10 * 60 * 1000,
  });

export const usePermissionStats = () =>
  useQuery<ApiResponse<PermissionStats>>({
    queryKey: ['permissions', 'stats'],
    queryFn: () => PermissionService.getStats(),
    staleTime: 10 * 60 * 1000,
  });

export const useCreateRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: PermissionService.createRole,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions', 'roles'] });
      queryClient.invalidateQueries({ queryKey: ['permissions', 'stats'] });
    },
  });
};

export const useUpdateRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: PermissionService.updateRole,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions', 'roles'] });
      queryClient.invalidateQueries({ queryKey: ['permissions', 'stats'] });
    },
  });
};

export const useDeleteRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: PermissionService.deleteRole,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions', 'roles'] });
      queryClient.invalidateQueries({ queryKey: ['permissions', 'stats'] });
    },
  });
};

export const useAssignRole = () => useMutation({ mutationFn: PermissionService.assignRole });

export type { PermissionDefinition, RoleDefinition };
