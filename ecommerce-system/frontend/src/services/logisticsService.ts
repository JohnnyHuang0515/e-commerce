import { logisticsApi, ApiResponse, PaginatedResponse } from './api';

// 物流相關類型定義
export interface Shipment {
  _id: string;
  shipmentId: string;
  orderId: string;
  userId: string;
  status: 'pending' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'failed' | 'returned' | 'cancelled';
  shippingAddress: {
    name: string;
    phone: string;
    city: string;
    district: string;
    address: string;
    zipCode: string;
  };
  packageInfo: {
    weight: number;
    dimensions: {
      length: number;
      width: number;
      height: number;
    };
    value: number;
    description: string;
  };
  shippingInfo: {
    method: string;
    provider: string;
    trackingNumber: string;
    estimatedDelivery?: string;
    actualDelivery?: string;
  };
  costInfo: {
    totalFee: number;
    currency: string;
  };
  trackingEvents: TrackingEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface TrackingEvent {
  status: string;
  description: string;
  location?: string;
  timestamp: string;
}

export interface ShipmentCreateRequest {
  orderId: string;
  userId: string;
  shippingAddress: {
    name: string;
    phone: string;
    city: string;
    district: string;
    address: string;
    zipCode: string;
  };
  packageInfo: {
    weight: number;
    dimensions: {
      length: number;
      width: number;
      height: number;
    };
    value: number;
    description: string;
  };
  shippingMethod: 'home_delivery' | 'convenience_store' | 'post_office' | 'express';
}

export interface CostCalculationRequest {
    packageInfo: {
        weight: number;
        dimensions: {
            length: number;
            width: number;
            height: number;
        };
        value: number;
    };
    shippingMethod: string;
    shippingAddress: {
        city: string;
        district: string;
    };
}

export interface LogisticsStats {
  totalShipments: number;
  deliveredShipments: number;
  pendingShipments: number;
  failedShipments: number;
  averageDeliveryTime: number;
}

export interface LogisticsSearchParams {
  page?: number;
  limit?: number;
  status?: string;
  method?: string;
  userId?: string;
  orderId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// 物流服務類
export class LogisticsService {
  // 獲取配送列表
  static async getShipments(params?: LogisticsSearchParams): Promise<ApiResponse<PaginatedResponse<Shipment>>> {
    const response = await logisticsApi.get('/v1/shipments', { params });
    return response.data;
  }

  // 獲取配送詳情
  static async getShipment(shipmentId: string): Promise<ApiResponse<Shipment>> {
    const response = await logisticsApi.get(`/v1/shipments/${shipmentId}`);
    return response.data;
  }

  // 建立配送
  static async createShipment(data: ShipmentCreateRequest): Promise<ApiResponse<Shipment>> {
    const response = await logisticsApi.post('/v1/shipments', data);
    return response.data;
  }

  // 取消配送
  static async cancelShipment(shipmentId: string, reason: string): Promise<ApiResponse<any>> {
      const response = await logisticsApi.post(`/v1/shipments/${shipmentId}/cancel`, { reason });
      return response.data;
  }

  // 追蹤配送
  static async trackShipment(shipmentId: string): Promise<ApiResponse<TrackingEvent[]>> {
    const response = await logisticsApi.get(`/v1/shipments/${shipmentId}/track`);
    return response.data;
  }

  // 計算配送費用
  static async calculateCost(data: CostCalculationRequest): Promise<ApiResponse<{ cost: number; currency: string }>> {
      const response = await logisticsApi.post('/v1/calculate-cost', data);
      return response.data;
  }

  // 獲取配送統計
  static async getStats(params?: { period?: string; startDate?: string; endDate?: string }): Promise<ApiResponse<LogisticsStats>> {
    const response = await logisticsApi.get('/v1/stats', { params });
    return response.data;
  }
}

export default LogisticsService;
