import { paymentApi, ApiResponse, PaginatedResponse } from './api';

// 支付相關類型定義
export interface Payment {
  _id: string;
  paymentId: string;
  orderId: string;
  userId: string;
  paymentInfo: {
    method: 'stripe' | 'paypal' | 'line_pay' | 'bank_transfer' | 'cash_on_delivery';
    amount: number;
    currency: string;
    status: 'pending' | 'processing' | 'success' | 'failed' | 'cancelled' | 'refunded';
    transactionId?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Refund {
    refundId: string;
    amount: number;
    reason: string;
    status: 'pending' | 'processing' | 'success' | 'failed';
    processedAt?: string;
}

export interface PaymentCreateRequest {
  orderId: string;
  userId: string;
  amount: number;
  currency: string;
  method: 'stripe' | 'paypal' | 'line_pay' | 'bank_transfer' | 'cash_on_delivery';
  metadata?: Record<string, any>;
}

export interface RefundRequest {
  amount: number;
  reason: string;
}

export interface PaymentConfirmRequest {
    transactionId: string;
    amount: number;
    currency: string;
}

export interface PaymentSearchParams {
  page?: number;
  limit?: number;
  status?: string;
  method?: string;
  userId?: string;
  orderId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// 支付服務類
export class PaymentService {
  // 獲取支付列表
  static async getPayments(params?: PaymentSearchParams): Promise<ApiResponse<PaginatedResponse<Payment>>> {
    const response = await paymentApi.get('/v1/payments', { params });
    return response.data;
  }

  // 獲取支付詳情
  static async getPayment(paymentId: string): Promise<ApiResponse<Payment>> {
    const response = await paymentApi.get(`/v1/payments/${paymentId}`);
    return response.data;
  }

  // 創建支付
  static async createPayment(data: PaymentCreateRequest): Promise<ApiResponse<Payment>> {
    const response = await paymentApi.post('/v1/payments', data);
    return response.data;
  }

  // 確認支付
  static async confirmPayment(paymentId: string, data: PaymentConfirmRequest): Promise<ApiResponse<Payment>> {
      const response = await paymentApi.post(`/v1/payments/${paymentId}/confirm`, data);
      return response.data;
  }

  // 取消支付
  static async cancelPayment(paymentId: string): Promise<ApiResponse<Payment>> {
      const response = await paymentApi.post(`/v1/payments/${paymentId}/cancel`);
      return response.data;
  }

  // 退款
  static async refundPayment(paymentId: string, data: RefundRequest): Promise<ApiResponse<Payment>> {
    const response = await paymentApi.post(`/v1/payments/${paymentId}/refund`, data);
    return response.data;
  }

  // Webhook 處理 (通常由後端調用，前端可能不需要直接使用)
  static async handleWebhook(provider: string, payload: any): Promise<ApiResponse<any>> {
      const response = await paymentApi.post(`/v1/payments/webhook/${provider}`, payload);
      return response.data;
  }
}

export default PaymentService;
