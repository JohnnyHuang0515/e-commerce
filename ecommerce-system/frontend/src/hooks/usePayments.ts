import { useQuery } from '@tanstack/react-query';

import {
  PaymentService,
  type PaymentListParams,
  type PaymentListResponse,
  type PaymentStats,
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
