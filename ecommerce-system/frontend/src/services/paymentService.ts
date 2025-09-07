import { paymentApi } from './api';

// 支付相關類型定義
export interface Payment {
  _id: string;
  orderId: string;
  userId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  paymentMethod: 'credit_card' | 'debit_card' | 'paypal' | 'line_pay' | 'bank_transfer';
  paymentProvider: 'stripe' | 'paypal' | 'line_pay' | 'bank';
  transactionId?: string;
  providerTransactionId?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  _id: string;
  paymentId: string;
  type: 'payment' | 'refund' | 'chargeback';
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  transactionId: string;
  providerTransactionId?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface PaymentCreateRequest {
  orderId: string;
  userId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  paymentProvider: string;
  metadata?: Record<string, any>;
}

export interface PaymentUpdateRequest {
  status?: string;
  transactionId?: string;
  providerTransactionId?: string;
  metadata?: Record<string, any>;
}

export interface RefundRequest {
  paymentId: string;
  amount: number;
  reason: string;
  metadata?: Record<string, any>;
}

export interface PaymentStats {
  totalPayments: number;
  totalAmount: number;
  successRate: number;
  averageAmount: number;
  paymentsByStatus: Record<string, number>;
  paymentsByMethod: Record<string, number>;
  paymentsByProvider: Record<string, number>;
  dailyStats: Array<{
    date: string;
    count: number;
    amount: number;
  }>;
}

export interface PaymentSearchParams {
  page?: number;
  limit?: number;
  status?: string;
  paymentMethod?: string;
  paymentProvider?: string;
  userId?: string;
  orderId?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// 支付服務類
export class PaymentService {
  // 獲取支付列表
  static async getPayments(params?: PaymentSearchParams) {
    const response = await paymentApi.get('/payments', { params });
    return response.data;
  }

  // 獲取支付詳情
  static async getPayment(paymentId: string) {
    const response = await paymentApi.get(`/payments/${paymentId}`);
    return response.data;
  }

  // 創建支付
  static async createPayment(data: PaymentCreateRequest) {
    const response = await paymentApi.post('/payments', data);
    return response.data;
  }

  // 更新支付
  static async updatePayment(paymentId: string, data: PaymentUpdateRequest) {
    const response = await paymentApi.put(`/payments/${paymentId}`, data);
    return response.data;
  }

  // 刪除支付
  static async deletePayment(paymentId: string) {
    const response = await paymentApi.delete(`/payments/${paymentId}`);
    return response.data;
  }

  // 處理支付
  static async processPayment(paymentId: string, data: any) {
    const response = await paymentApi.post(`/payments/${paymentId}/process`, data);
    return response.data;
  }

  // 退款
  static async refundPayment(data: RefundRequest) {
    const response = await paymentApi.post('/payments/refund', data);
    return response.data;
  }

  // 獲取交易記錄
  static async getTransactions(paymentId: string) {
    const response = await paymentApi.get(`/payments/${paymentId}/transactions`);
    return response.data;
  }

  // 獲取支付統計
  static async getPaymentStats(params?: { startDate?: string; endDate?: string }) {
    const response = await paymentApi.get('/payments/stats', { params });
    return response.data;
  }

  // 獲取支付概覽
  static async getPaymentOverview() {
    const response = await paymentApi.get('/payments/overview');
    return response.data;
  }
}

export default PaymentService;
