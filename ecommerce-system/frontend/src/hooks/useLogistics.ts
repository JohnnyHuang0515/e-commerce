import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  LogisticsService,
  type LogisticsListParams,
  type LogisticsListResponse,
  type LogisticsStats,
  type CreateShipmentRequest,
  type UpdateShipmentRequest,
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

export const useShipment = (shipmentId?: string) =>
  useQuery({
    queryKey: ['logistics', shipmentId],
    queryFn: () => LogisticsService.getShipment(shipmentId as string),
    enabled: Boolean(shipmentId),
  });

export const useCreateShipment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateShipmentRequest) => LogisticsService.createShipment(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logistics'] });
      queryClient.invalidateQueries({ queryKey: ['logistics', 'stats'] });
    },
  });
};

export const useUpdateShipment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ shipmentId, payload }: { shipmentId: string; payload: UpdateShipmentRequest }) =>
      LogisticsService.updateShipment(shipmentId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['logistics'] });
      queryClient.invalidateQueries({ queryKey: ['logistics', variables.shipmentId] });
      queryClient.invalidateQueries({ queryKey: ['logistics', 'stats'] });
    },
  });
};

export const useDeleteShipment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (shipmentId: string) => LogisticsService.deleteShipment(shipmentId),
    onSuccess: (_, shipmentId) => {
      queryClient.invalidateQueries({ queryKey: ['logistics'] });
      queryClient.removeQueries({ queryKey: ['logistics', shipmentId] });
      queryClient.invalidateQueries({ queryKey: ['logistics', 'stats'] });
    },
  });
};
