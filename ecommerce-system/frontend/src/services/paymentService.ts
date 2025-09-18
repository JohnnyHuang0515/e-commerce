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

export interface CreatePaymentRequest {
  orderId: string;
  amount: number; // cents
  method: PaymentMethod;
  status?: PaymentStatus;
  currency?: string;
  provider?: string;
  transactionId?: string;
}

export interface UpdatePaymentRequest {
  amount?: number; // cents
  method?: PaymentMethod;
  status?: PaymentStatus;
  currency?: string;
  provider?: string | null;
  transactionId?: string | null;
}

export interface DeletePaymentResponse {
  success: boolean;
}

const toDecimalAmount = (amountInCents: number): number => {
  const amount = Number(amountInCents);
  if (!Number.isFinite(amount)) {
    return 0;
  }
  return Number((amount / 100).toFixed(2));
};

const normalizePaymentResponse = (payment: PaymentRecord): PaymentRecord => ({
  ...payment,
  amount: Number(payment.amount ?? 0),
});

export class PaymentService {
  static async getPayments(params: PaymentListParams = {}): Promise<ApiResponse<PaymentListResponse>> {
    const response = await paymentApi.get('/v1/payments', { params });
    return {
      ...response.data,
      data: {
        ...response.data.data,
        items: response.data.data.items.map(normalizePaymentResponse),
      },
    };
  }

  static async getStats(): Promise<ApiResponse<PaymentStats>> {
    const response = await paymentApi.get('/v1/payments/stats');
    return response.data;
  }

  static async getPayment(paymentId: string): Promise<ApiResponse<PaymentRecord>> {
    const response = await paymentApi.get(`/v1/payments/${paymentId}`);
    if (response.data?.success) {
      return {
        ...response.data,
        data: normalizePaymentResponse(response.data.data),
      };
    }
    return response.data;
  }

  static async createPayment(payload: CreatePaymentRequest): Promise<ApiResponse<PaymentRecord>> {
    const requestBody = {
      orderId: payload.orderId,
      amount: toDecimalAmount(payload.amount),
      method: payload.method,
      status: payload.status,
      currency: payload.currency,
      provider: payload.provider,
      transactionId: payload.transactionId,
    };

    const response = await paymentApi.post('/v1/payments', requestBody);

    if (response.data?.success) {
      return {
        ...response.data,
        data: normalizePaymentResponse(response.data.data),
      };
    }

    return response.data;
  }

  static async updatePayment(paymentId: string, payload: UpdatePaymentRequest): Promise<ApiResponse<PaymentRecord>> {
    const requestBody: Record<string, unknown> = {};

    if (payload.amount !== undefined) {
      requestBody.amount = toDecimalAmount(payload.amount);
    }
    if (payload.method) {
      requestBody.method = payload.method;
    }
    if (payload.status) {
      requestBody.status = payload.status;
    }
    if (payload.currency) {
      requestBody.currency = payload.currency;
    }
    if (payload.provider !== undefined) {
      requestBody.provider = payload.provider;
    }
    if (payload.transactionId !== undefined) {
      requestBody.transactionId = payload.transactionId;
    }

    const response = await paymentApi.put(`/v1/payments/${paymentId}`, requestBody);

    if (response.data?.success) {
      return {
        ...response.data,
        data: normalizePaymentResponse(response.data.data),
      };
    }

    return response.data;
  }

  static async deletePayment(paymentId: string): Promise<DeletePaymentResponse> {
    const response = await paymentApi.delete(`/v1/payments/${paymentId}`);
    return response.data;
  }
}

export default PaymentService;
