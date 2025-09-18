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
  orderId?: string;
  userId?: string;
}

export type LogisticsListResponse = Paginated<ShipmentRecord>;

export interface LogisticsStats {
  total: number;
  delivered: number;
  inTransit: number;
  pending: number;
  failed: number;
}

export interface CreateShipmentRequest {
  orderId: string;
  status?: ShipmentStatus;
  provider?: string;
  method?: string;
  trackingNumber?: string;
  destination?: Partial<ShipmentRecord['destination']>;
  estimatedDelivery?: string;
}

export interface UpdateShipmentRequest {
  status?: ShipmentStatus;
  provider?: string | null;
  method?: string | null;
  trackingNumber?: string | null;
  destination?: Partial<Record<keyof ShipmentRecord['destination'], string | null>> | null;
  estimatedDelivery?: string | null;
}

export interface DeleteShipmentResponse {
  success: boolean;
}

const normalizeShipmentResponse = (shipment: ShipmentRecord): ShipmentRecord => ({
  ...shipment,
  destination: {
    name: shipment.destination?.name ?? '',
    city: shipment.destination?.city ?? '',
    district: shipment.destination?.district ?? '',
    address: shipment.destination?.address ?? '',
  },
});

export class LogisticsService {
  static async getShipments(params: LogisticsListParams = {}): Promise<ApiResponse<LogisticsListResponse>> {
    const response = await logisticsApi.get('/v1/shipments', { params });
    return {
      ...response.data,
      data: {
        ...response.data.data,
        items: response.data.data.items.map(normalizeShipmentResponse),
      },
    };
  }

  static async getStats(): Promise<ApiResponse<LogisticsStats>> {
    const response = await logisticsApi.get('/v1/shipments/stats');
    return response.data;
  }

  static async getShipment(shipmentId: string): Promise<ApiResponse<ShipmentRecord>> {
    const response = await logisticsApi.get(`/v1/shipments/${shipmentId}`);
    if (response.data?.success) {
      return {
        ...response.data,
        data: normalizeShipmentResponse(response.data.data),
      };
    }
    return response.data;
  }

  static async createShipment(payload: CreateShipmentRequest): Promise<ApiResponse<ShipmentRecord>> {
    const response = await logisticsApi.post('/v1/shipments', payload);

    if (response.data?.success) {
      return {
        ...response.data,
        data: normalizeShipmentResponse(response.data.data),
      };
    }

    return response.data;
  }

  static async updateShipment(shipmentId: string, payload: UpdateShipmentRequest): Promise<ApiResponse<ShipmentRecord>> {
    const response = await logisticsApi.put(`/v1/shipments/${shipmentId}`, payload);

    if (response.data?.success) {
      return {
        ...response.data,
        data: normalizeShipmentResponse(response.data.data),
      };
    }

    return response.data;
  }

  static async deleteShipment(shipmentId: string): Promise<DeleteShipmentResponse> {
    const response = await logisticsApi.delete(`/v1/shipments/${shipmentId}`);
    return response.data;
  }
}

export default LogisticsService;
