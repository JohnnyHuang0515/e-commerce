import type { AxiosError } from 'axios';

import { paymentApi } from './api';
import type { ApiResponse, Paginated } from '../types/api';

export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'refunded';

export type PaymentMethod =
  | 'credit_card'
  | 'paypal'
  | 'line_pay'
  | 'bank_transfer'
  | 'cash_on_delivery';

export interface PaymentRecord {
  id: string;
  orderId: string;
  userId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  provider?: string;
  status: PaymentStatus;
  transactionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentListParams {
  page?: number;
  limit?: number;
  status?: PaymentStatus;
  method?: PaymentMethod;
  userId?: string;
  orderId?: string;
  startDate?: string;
  endDate?: string;
}

export type PaymentListResponse = Paginated<PaymentRecord>;

export interface PaymentStats {
  total: number;
  completed: number;
  refunded: number;
  pending: number;
  processing: number;
  failed: number;
  cancelled: number;
  totalAmount: number;
}

const isAxiosError = (error: unknown): error is AxiosError =>
  typeof error === 'object' && error !== null && 'isAxiosError' in error;

const MOCK_PAYMENTS: PaymentRecord[] = [
  {
    id: 'pay-mock-1001',
    orderId: 'order-001',
    userId: 'user-001',
    amount: 5280,
    currency: 'TWD',
    method: 'credit_card',
    provider: 'stripe',
    status: 'completed',
    transactionId: 'txn_123456',
    createdAt: '2024-03-01T09:15:00Z',
    updatedAt: '2024-03-01T09:16:00Z',
  },
  {
    id: 'pay-mock-1002',
    orderId: 'order-002',
    userId: 'user-002',
    amount: 2480,
    currency: 'TWD',
    method: 'paypal',
    provider: 'paypal',
    status: 'pending',
    createdAt: '2024-03-02T11:20:00Z',
    updatedAt: '2024-03-02T11:20:00Z',
  },
  {
    id: 'pay-mock-1003',
    orderId: 'order-003',
    userId: 'user-003',
    amount: 1890,
    currency: 'TWD',
    method: 'line_pay',
    provider: 'line_pay',
    status: 'refunded',
    transactionId: 'txn_789012',
    createdAt: '2024-03-03T08:05:00Z',
    updatedAt: '2024-03-04T08:05:00Z',
  },
  {
    id: 'pay-mock-1004',
    orderId: 'order-004',
    userId: 'user-004',
    amount: 3280,
    currency: 'TWD',
    method: 'bank_transfer',
    provider: 'bank_transfer',
    status: 'failed',
    createdAt: '2024-03-04T14:30:00Z',
    updatedAt: '2024-03-04T14:45:00Z',
  },
];

const buildMockResponse = (params: PaymentListParams = {}): PaymentListResponse => {
  const { status, method, page = 1, limit = 10, userId, orderId } = params;
  let filtered = [...MOCK_PAYMENTS];

  if (status) {
    filtered = filtered.filter((payment) => payment.status === status);
  }

  if (method) {
    filtered = filtered.filter((payment) => payment.method === method);
  }

  if (userId) {
    filtered = filtered.filter((payment) => payment.userId.includes(userId));
  }

  if (orderId) {
    filtered = filtered.filter((payment) => payment.orderId.includes(orderId));
  }

  const start = (page - 1) * limit;
  const items = filtered.slice(start, start + limit);

  return {
    items,
    total: filtered.length,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(filtered.length / limit)),
  };
};

const buildMockStats = (payments: PaymentRecord[]): PaymentStats => {
  return payments.reduce(
    (accumulator, payment) => {
      accumulator.total += 1;
      accumulator.totalAmount += payment.amount;

      switch (payment.status) {
        case 'completed':
          accumulator.completed += 1;
          break;
        case 'refunded':
          accumulator.refunded += 1;
          break;
        case 'pending':
          accumulator.pending += 1;
          break;
        case 'processing':
          accumulator.processing += 1;
          break;
        case 'cancelled':
          accumulator.cancelled += 1;
          break;
        case 'failed':
          accumulator.failed += 1;
          break;
        default:
          break;
      }

      return accumulator;
    },
    {
      total: 0,
      completed: 0,
      refunded: 0,
      pending: 0,
      processing: 0,
      failed: 0,
      cancelled: 0,
      totalAmount: 0,
    } satisfies PaymentStats
  );
};

export class PaymentService {
  static async getPayments(params: PaymentListParams = {}): Promise<ApiResponse<PaymentListResponse>> {
    try {
      const response = await paymentApi.get('/v1/payments', { params });
      if (response.data?.success) {
        return response.data;
      }
    } catch (error) {
      if (!isAxiosError(error)) {
        console.error('載入支付資料失敗:', error);
      }
    }

    return {
      success: true,
      data: buildMockResponse(params),
    };
  }

  static async getStats(): Promise<ApiResponse<PaymentStats>> {
    try {
      const response = await paymentApi.get('/v1/payments/stats');
      if (response.data?.success) {
        return response.data;
      }
    } catch (error) {
      if (!isAxiosError(error)) {
        console.error('載入支付統計失敗:', error);
      }
    }

    return {
      success: true,
      data: buildMockStats(MOCK_PAYMENTS),
    };
  }

  static async createPayment(): Promise<never> {
    return Promise.reject(new Error('支付建立尚未在前端支援。'));
  }

  static async updatePayment(): Promise<never> {
    return Promise.reject(new Error('支付更新尚未在前端支援。'));
  }

  static async deletePayment(): Promise<never> {
    return Promise.reject(new Error('支付刪除尚未在前端支援。'));
  }

  static async refundPayment(): Promise<never> {
    return Promise.reject(new Error('退款功能尚未在前端支援。'));
  }
}

export default PaymentService;
