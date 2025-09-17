import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { OrderService, OrderSearchParams } from '../services/orderService';

export const useOrders = (params?: OrderSearchParams) =>
  useQuery({
    queryKey: ['orders', params],
    queryFn: () => OrderService.getOrders(params),
    staleTime: 1 * 60 * 1000,
  });

export const useOrder = (orderId: string) =>
  useQuery({
    queryKey: ['orders', orderId],
    queryFn: () => OrderService.getOrder(orderId),
    enabled: !!orderId,
  });

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: ({ orderId, ...data }: any) => OrderService.updateOrder(orderId, data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders', variables.orderId] });
    },
  });
};

export const useOrderStats = () =>
  useQuery({
    queryKey: ['orders', 'stats'],
    queryFn: () => OrderService.getOrderStats(),
    staleTime: 5 * 60 * 1000,
  });

