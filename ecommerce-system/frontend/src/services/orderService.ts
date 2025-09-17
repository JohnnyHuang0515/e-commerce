import { orderApi } from './api';

import { ApiResponse, PaginatedResponse, OrderSummary, OrderDetail, OrderItemSummary } from '../types/api';

// 訂單相關類型定義
export type Order = OrderDetail;

export type OrderItem = OrderItemSummary;

export interface OrderCreateRequest {
  user_id: string;
  items: Array<{
    product_id: string;
    quantity: number;
  }>;
  shipping_method?: string;
  shipping_address?: {
    name?: string;
    phone?: string;
    address?: string;
    city?: string;
    postal_code?: string;
    country?: string;
  };
  payment_method?: string;
  notes?: string;
}

export interface OrderUpdateRequest {
  status?: string;
  payment_status?: string;
  tracking_number?: string;
  estimated_delivery?: string;
  notes?: string;
}

export interface OrderSearchParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  user_id?: string;
  date_from?: string;
  date_to?: string;
  min_amount?: number;
  max_amount?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface OrderStats {
  total: number;
  pending: number;
  confirmed: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  returned: number;
  totalRevenue: number;
  averageOrderValue: number;
}

// 訂單 API 服務類
export class OrderService {
  // 獲取訂單列表
  static async getOrders(params?: OrderSearchParams): Promise<PaginatedResponse<OrderSummary>> {
    try {
      const response = await orderApi.get('/v1/orders', { params });
      return response.data;
    } catch (error) {
      console.error('獲取訂單列表失敗:', error);
      throw error;
    }
  }

  // 獲取訂單詳情
  static async getOrder(orderId: string): Promise<ApiResponse<OrderDetail>> {
    try {
      const response = await orderApi.get(`/v1/orders/${orderId}`);
      return response.data;
    } catch (error) {
      console.error('獲取訂單詳情失敗:', error);
      throw error;
    }
  }

  // 創建訂單
  static async createOrder(orderData: OrderCreateRequest): Promise<ApiResponse<OrderDetail>> {
    try {
      const response = await orderApi.post('/v1/orders', orderData);
      return response.data;
    } catch (error) {
      console.error('創建訂單失敗:', error);
      throw error;
    }
  }

  // 更新訂單
  static async updateOrder(orderId: string, orderData: OrderUpdateRequest): Promise<ApiResponse<OrderDetail>> {
    try {
      const response = await orderApi.put(`/v1/orders/${orderId}`, orderData);
      return response.data;
    } catch (error) {
      console.error('更新訂單失敗:', error);
      throw error;
    }
  }

  // 取消訂單
  static async cancelOrder(orderId: string, reason?: string): Promise<ApiResponse<OrderDetail>> {
    try {
      const response = await orderApi.put(`/v1/orders/${orderId}/cancel`, { reason });
      return response.data;
    } catch (error) {
      console.error('取消訂單失敗:', error);
      throw error;
    }
  }

  // 確認訂單
  static async confirmOrder(orderId: string): Promise<ApiResponse<OrderDetail>> {
    try {
      const response = await orderApi.put(`/v1/orders/${orderId}/confirm`);
      return response.data;
    } catch (error) {
      console.error('確認訂單失敗:', error);
      throw error;
    }
  }

  // 發貨
  static async shipOrder(orderId: string, trackingNumber: string): Promise<ApiResponse<OrderDetail>> {
    try {
      const response = await orderApi.put(`/v1/orders/${orderId}/ship`, { tracking_number: trackingNumber });
      return response.data;
    } catch (error) {
      console.error('發貨失敗:', error);
      throw error;
    }
  }

  // 完成訂單
  static async completeOrder(orderId: string): Promise<ApiResponse<OrderDetail>> {
    try {
      const response = await orderApi.put(`/v1/orders/${orderId}/complete`);
      return response.data;
    } catch (error) {
      console.error('完成訂單失敗:', error);
      throw error;
    }
  }

  // 退貨
  static async returnOrder(orderId: string, reason: string): Promise<ApiResponse<OrderDetail>> {
    try {
      const response = await orderApi.put(`/v1/orders/${orderId}/return`, { reason });
      return response.data;
    } catch (error) {
      console.error('退貨失敗:', error);
      throw error;
    }
  }

  // 獲取訂單統計
  static async getOrderStats(): Promise<ApiResponse<OrderStats>> {
    try {
      const response = await orderApi.get('/v1/orders/stats');
      return response.data;
    } catch (error) {
      console.error('獲取訂單統計失敗:', error);
      throw error;
    }
  }

  // 獲取訂單概覽
  static async getOrderOverview(): Promise<ApiResponse<{
    recentOrders: OrderDetail[];
    pendingOrders: number;
    totalRevenue: number;
    orderTrend: Array<{
      date: string;
      orders: number;
      revenue: number;
    }>;
  }>> {
    try {
      const response = await orderApi.get('/v1/orders/overview');
      return response.data;
    } catch (error) {
      console.error('獲取訂單概覽失敗:', error);
      throw error;
    }
  }

  // 導出訂單
  static async exportOrders(params?: OrderSearchParams): Promise<Blob> {
    try {
      const response = await orderApi.get('/v1/orders/export', {
        params,
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('導出訂單失敗:', error);
      throw error;
    }
  }

  // 批量更新訂單狀態
  static async batchUpdateStatus(orderIds: string[], status: string): Promise<ApiResponse<void>> {
    try {
      const response = await orderApi.put('/v1/orders/batch-status', {
        orderIds,
        status
      });
      return response.data;
    } catch (error) {
      console.error('批量更新訂單狀態失敗:', error);
      throw error;
    }
  }
}

export default OrderService;
