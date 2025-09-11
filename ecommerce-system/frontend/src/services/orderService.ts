import { orderApi, ApiResponse, PaginatedResponse } from './api';

// 訂單相關類型定義
export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shippingCost: number;
  discount: number;
  total: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
  payment: {
    method: string;
    status: 'pending' | 'paid' | 'failed' | 'refunded';
    transactionId?: string;
    paidAt?: string;
  };
  shipping: {
    method: string;
    address: {
      name: string;
      phone: string;
      address: string;
      city: string;
      postalCode: string;
      country: string;
    };
    trackingNumber?: string;
    estimatedDelivery?: string;
  };
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  productImage?: string;
  sku: string;
  quantity: number;
  price: number;
  total: number;
}

export interface OrderCreateRequest {
  userId: string;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  shipping: {
    method: string;
    address: {
      name: string;
      phone: string;
      address: string;
      city: string;
      postalCode: string;
      country: string;
    };
  };
  payment: {
    method: string;
  };
  notes?: string;
}

export interface OrderUpdateRequest {
  status?: string;
  payment?: {
    status: string;
    transactionId?: string;
  };
  shipping?: {
    trackingNumber?: string;
    estimatedDelivery?: string;
  };
  notes?: string;
}

export interface OrderSearchParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
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
  static async getOrders(params?: OrderSearchParams): Promise<ApiResponse<PaginatedResponse<Order>>> {
    try {
      const response = await orderApi.get('/v1/orders', { params });
      return response.data;
    } catch (error) {
      console.error('獲取訂單列表失敗:', error);
      throw error;
    }
  }

  // 獲取訂單詳情
  static async getOrder(orderId: string): Promise<ApiResponse<Order>> {
    try {
      const response = await orderApi.get(`/v1/orders/${orderId}`);
      return response.data;
    } catch (error) {
      console.error('獲取訂單詳情失敗:', error);
      throw error;
    }
  }

  // 創建訂單
  static async createOrder(orderData: OrderCreateRequest): Promise<ApiResponse<Order>> {
    try {
      const response = await orderApi.post('/v1/orders', orderData);
      return response.data;
    } catch (error) {
      console.error('創建訂單失敗:', error);
      throw error;
    }
  }

  // 更新訂單
  static async updateOrder(orderId: string, orderData: OrderUpdateRequest): Promise<ApiResponse<Order>> {
    try {
      const response = await orderApi.put(`/v1/orders/${orderId}`, orderData);
      return response.data;
    } catch (error) {
      console.error('更新訂單失敗:', error);
      throw error;
    }
  }

  // 取消訂單
  static async cancelOrder(orderId: string, reason?: string): Promise<ApiResponse<Order>> {
    try {
      const response = await orderApi.put(`/v1/orders/${orderId}/cancel`, { reason });
      return response.data;
    } catch (error) {
      console.error('取消訂單失敗:', error);
      throw error;
    }
  }

  // 確認訂單
  static async confirmOrder(orderId: string): Promise<ApiResponse<Order>> {
    try {
      const response = await orderApi.put(`/v1/orders/${orderId}/confirm`);
      return response.data;
    } catch (error) {
      console.error('確認訂單失敗:', error);
      throw error;
    }
  }

  // 發貨
  static async shipOrder(orderId: string, trackingNumber: string): Promise<ApiResponse<Order>> {
    try {
      const response = await orderApi.put(`/v1/orders/${orderId}/ship`, { trackingNumber });
      return response.data;
    } catch (error) {
      console.error('發貨失敗:', error);
      throw error;
    }
  }

  // 完成訂單
  static async completeOrder(orderId: string): Promise<ApiResponse<Order>> {
    try {
      const response = await orderApi.put(`/v1/orders/${orderId}/complete`);
      return response.data;
    } catch (error) {
      console.error('完成訂單失敗:', error);
      throw error;
    }
  }

  // 退貨
  static async returnOrder(orderId: string, reason: string): Promise<ApiResponse<Order>> {
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
    recentOrders: Order[];
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
