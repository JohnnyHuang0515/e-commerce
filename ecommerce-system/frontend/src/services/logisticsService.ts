import { logisticsApi } from './api';

// 物流相關類型定義
export interface Shipment {
  _id: string;
  orderId: string;
  userId: string;
  trackingNumber: string;
  status: 'pending' | 'processing' | 'shipped' | 'in_transit' | 'delivered' | 'failed' | 'returned';
  shippingMethod: 'standard' | 'express' | 'overnight' | 'pickup';
  provider: 'black_cat' | 'hsinchu' | 'sf_express' | 'post_office' | 'custom';
  origin: {
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone?: string;
  };
  destination: {
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone?: string;
  };
  packageInfo: {
    weight: number;
    dimensions: {
      length: number;
      width: number;
      height: number;
    };
    description?: string;
  };
  estimatedDelivery?: string;
  actualDelivery?: string;
  cost: number;
  currency: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface TrackingEvent {
  _id: string;
  shipmentId: string;
  status: string;
  location: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface ShipmentCreateRequest {
  orderId: string;
  userId: string;
  shippingMethod: string;
  provider: string;
  origin: {
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone?: string;
  };
  destination: {
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone?: string;
  };
  packageInfo: {
    weight: number;
    dimensions: {
      length: number;
      width: number;
      height: number;
    };
    description?: string;
  };
  metadata?: Record<string, any>;
}

export interface ShipmentUpdateRequest {
  status?: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  actualDelivery?: string;
  metadata?: Record<string, any>;
}

export interface LogisticsStats {
  totalShipments: number;
  deliveredShipments: number;
  pendingShipments: number;
  failedShipments: number;
  averageDeliveryTime: number;
  shipmentsByStatus: Record<string, number>;
  shipmentsByProvider: Record<string, number>;
  shipmentsByMethod: Record<string, number>;
  dailyStats: Array<{
    date: string;
    count: number;
    delivered: number;
  }>;
}

export interface LogisticsSearchParams {
  page?: number;
  limit?: number;
  status?: string;
  provider?: string;
  shippingMethod?: string;
  userId?: string;
  orderId?: string;
  trackingNumber?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// 物流服務類
export class LogisticsService {
  // 獲取物流列表
  static async getShipments(params?: LogisticsSearchParams) {
    const response = await logisticsApi.get('/shipments', { params });
    return response.data;
  }

  // 獲取物流詳情
  static async getShipment(shipmentId: string) {
    const response = await logisticsApi.get(`/shipments/${shipmentId}`);
    return response.data;
  }

  // 創建物流
  static async createShipment(data: ShipmentCreateRequest) {
    const response = await logisticsApi.post('/shipments', data);
    return response.data;
  }

  // 更新物流
  static async updateShipment(shipmentId: string, data: ShipmentUpdateRequest) {
    const response = await logisticsApi.put(`/shipments/${shipmentId}`, data);
    return response.data;
  }

  // 刪除物流
  static async deleteShipment(shipmentId: string) {
    const response = await logisticsApi.delete(`/shipments/${shipmentId}`);
    return response.data;
  }

  // 追蹤物流
  static async trackShipment(trackingNumber: string) {
    const response = await logisticsApi.get(`/shipments/track/${trackingNumber}`);
    return response.data;
  }

  // 獲取追蹤事件
  static async getTrackingEvents(shipmentId: string) {
    const response = await logisticsApi.get(`/shipments/${shipmentId}/events`);
    return response.data;
  }

  // 更新物流狀態
  static async updateShipmentStatus(shipmentId: string, status: string, location?: string, description?: string) {
    const response = await logisticsApi.put(`/shipments/${shipmentId}/status`, {
      status,
      location,
      description
    });
    return response.data;
  }

  // 獲取物流統計
  static async getLogisticsStats(params?: { startDate?: string; endDate?: string }) {
    const response = await logisticsApi.get('/shipments/stats', { params });
    return response.data;
  }

  // 獲取物流概覽
  static async getLogisticsOverview() {
    const response = await logisticsApi.get('/shipments/overview');
    return response.data;
  }

  // 批量更新物流狀態
  static async batchUpdateStatus(updates: Array<{ shipmentId: string; status: string; location?: string; description?: string }>) {
    const response = await logisticsApi.put('/shipments/batch-status', { updates });
    return response.data;
  }
}

export default LogisticsService;
