import type { AxiosError } from 'axios';

import { logisticsApi } from './api';
import type { ApiResponse, Paginated } from '../types/api';

export type ShipmentStatus =
  | 'pending'
  | 'processing'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'failed'
  | 'returned'
  | 'cancelled';

export interface ShipmentRecord {
  id: string;
  orderId: string;
  userId: string;
  status: ShipmentStatus;
  provider: string;
  method: string;
  trackingNumber?: string;
  destination: {
    name: string;
    city: string;
    district: string;
    address: string;
  };
  estimatedDelivery?: string;
  updatedAt: string;
  createdAt: string;
}

export interface LogisticsListParams {
  page?: number;
  limit?: number;
  status?: ShipmentStatus;
  provider?: string;
  method?: string;
}

export type LogisticsListResponse = Paginated<ShipmentRecord>;

export interface LogisticsStats {
  total: number;
  delivered: number;
  inTransit: number;
  pending: number;
  failed: number;
}

const isAxiosError = (error: unknown): error is AxiosError =>
  typeof error === 'object' && error !== null && 'isAxiosError' in error;

const MOCK_SHIPMENTS: ShipmentRecord[] = [
  {
    id: 'ship-1001',
    orderId: 'order-001',
    userId: 'user-001',
    status: 'in_transit',
    provider: '黑貓宅急便',
    method: '宅配',
    trackingNumber: 'TC123456789',
    destination: {
      name: '王小明',
      city: '臺北市',
      district: '信義區',
      address: '松高路 12 號',
    },
    estimatedDelivery: '2024-03-08T00:00:00Z',
    createdAt: '2024-03-05T09:00:00Z',
    updatedAt: '2024-03-06T10:30:00Z',
  },
  {
    id: 'ship-1002',
    orderId: 'order-002',
    userId: 'user-002',
    status: 'delivered',
    provider: '新竹物流',
    method: '宅配',
    trackingNumber: 'HC987654321',
    destination: {
      name: '陳佳',
      city: '新北市',
      district: '板橋區',
      address: '文化路一段 100 號',
    },
    estimatedDelivery: '2024-03-06T00:00:00Z',
    createdAt: '2024-03-03T12:20:00Z',
    updatedAt: '2024-03-06T08:15:00Z',
  },
  {
    id: 'ship-1003',
    orderId: 'order-003',
    userId: 'user-003',
    status: 'pending',
    provider: '順豐速運',
    method: '超商取貨',
    destination: {
      name: '林宥',
      city: '桃園市',
      district: '桃園區',
      address: '中正路 88 號',
    },
    createdAt: '2024-03-07T07:45:00Z',
    updatedAt: '2024-03-07T07:45:00Z',
  },
];

const buildMockResponse = (params: LogisticsListParams = {}): LogisticsListResponse => {
  const { status, provider, method, page = 1, limit = 10 } = params;
  let filtered = [...MOCK_SHIPMENTS];

  if (status) {
    filtered = filtered.filter((shipment) => shipment.status === status);
  }

  if (provider) {
    filtered = filtered.filter((shipment) => shipment.provider === provider);
  }

  if (method) {
    filtered = filtered.filter((shipment) => shipment.method === method);
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

const buildMockStats = (shipments: ShipmentRecord[]): LogisticsStats => {
  return shipments.reduce(
    (accumulator, shipment) => {
      accumulator.total += 1;
      if (shipment.status === 'delivered') accumulator.delivered += 1;
      if (shipment.status === 'in_transit' || shipment.status === 'out_for_delivery') accumulator.inTransit += 1;
      if (shipment.status === 'pending' || shipment.status === 'processing') accumulator.pending += 1;
      if (shipment.status === 'failed' || shipment.status === 'returned' || shipment.status === 'cancelled') accumulator.failed += 1;
      return accumulator;
    },
    {
      total: 0,
      delivered: 0,
      inTransit: 0,
      pending: 0,
      failed: 0,
    } as LogisticsStats
  );
};

export class LogisticsService {
  static async getShipments(params: LogisticsListParams = {}): Promise<ApiResponse<LogisticsListResponse>> {
    try {
      const response = await logisticsApi.get('/v1/shipments', { params });
      if (response.data?.success) {
        return response.data;
      }
    } catch (error) {
      if (!isAxiosError(error)) {
        console.error('載入物流資料失敗:', error);
      }
    }

    return {
      success: true,
      data: buildMockResponse(params),
    };
  }

  static async getStats(): Promise<ApiResponse<LogisticsStats>> {
    try {
      const response = await logisticsApi.get('/v1/shipments/stats');
      if (response.data?.success) {
        return response.data;
      }
    } catch (error) {
      if (!isAxiosError(error)) {
        console.error('載入物流統計失敗:', error);
      }
    }

    return {
      success: true,
      data: buildMockStats(MOCK_SHIPMENTS),
    };
  }

  static async createShipment(): Promise<never> {
    return Promise.reject(new Error('物流建立尚未在前端支援。'));
  }

  static async updateShipment(): Promise<never> {
    return Promise.reject(new Error('物流更新尚未在前端支援。'));
  }

  static async deleteShipment(): Promise<never> {
    return Promise.reject(new Error('物流刪除尚未在前端支援。'));
  }
}

export default LogisticsService;
