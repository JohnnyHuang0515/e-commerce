import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  PaymentService,
  type PaymentListParams,
  type PaymentListResponse,
  type PaymentStats,
  type CreatePaymentRequest,
  type UpdatePaymentRequest,
} from '../services/paymentService';
import type { ApiResponse } from '../types/api';

const PAYMENT_STALE_TIME = 2 * 60 * 1000;

export const usePayments = (params?: PaymentListParams) =>
  useQuery<ApiResponse<PaymentListResponse>>({
    queryKey: ['payments', params ?? {}],
    queryFn: () => PaymentService.getPayments(params),
    staleTime: PAYMENT_STALE_TIME,
  });

export const usePaymentStats = () =>
  useQuery<ApiResponse<PaymentStats>>({
    queryKey: ['payments', 'stats'],
    queryFn: () => PaymentService.getStats(),
    staleTime: 5 * 60 * 1000,
  });

export type { PaymentListParams };

export const usePayment = (paymentId?: string) =>
  useQuery({
    queryKey: ['payments', paymentId],
    queryFn: () => PaymentService.getPayment(paymentId as string),
    enabled: Boolean(paymentId),
  });

export const useCreatePayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreatePaymentRequest) => PaymentService.createPayment(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['payments', 'stats'] });
    },
  });
};

export const useUpdatePayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ paymentId, payload }: { paymentId: string; payload: UpdatePaymentRequest }) =>
      PaymentService.updatePayment(paymentId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['payments', variables.paymentId] });
      queryClient.invalidateQueries({ queryKey: ['payments', 'stats'] });
    },
  });
};

export const useDeletePayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (paymentId: string) => PaymentService.deletePayment(paymentId),
    onSuccess: (_, paymentId) => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.removeQueries({ queryKey: ['payments', paymentId] });
      queryClient.invalidateQueries({ queryKey: ['payments', 'stats'] });
    },
  });
};
