import { inventoryApi } from './api';

import { ApiResponse, PaginatedResponse, InventoryItem, InventoryStats } from '../types/api';

export interface InventoryListParams {
  page?: number;
  limit?: number;
  search?: string;
  category_id?: number;
  low_stock?: boolean;
}

export interface InventoryAdjustRequest {
  adjustment: number;
  reason: string;
  notes?: string;
}

export type InventoryAlert = InventoryItem & {
  alert_level: 'critical' | 'high' | 'medium' | 'low';
  created_at: string;
};

export class InventoryService {
  static async getInventories(
    params?: InventoryListParams,
  ): Promise<PaginatedResponse<InventoryItem>> {
    const response = await inventoryApi.get('/v1/inventory', { params });
    return response.data;
  }

  static async adjustStock(
    productPublicId: string,
    payload: InventoryAdjustRequest,
  ): Promise<ApiResponse<{ new_stock: number }>> {
    const response = await inventoryApi.post(
      `/v1/inventory/${productPublicId}/adjust`,
      payload,
    );
    return response.data;
  }

  static async getLowStockAlerts(
    threshold = 5,
  ): Promise<ApiResponse<InventoryAlert[]>> {
    const response = await inventoryApi.get('/v1/inventory/alerts', {
      params: { threshold },
    });
    return response.data;
  }

  static async getOutOfStockAlerts(): Promise<ApiResponse<InventoryAlert[]>> {
    return this.getLowStockAlerts(0);
  }

  static async getInventoryStats(): Promise<ApiResponse<InventoryStats>> {
    const response = await inventoryApi.get('/v1/inventory/statistics');
    return response.data;
  }

  static async createInventory(): Promise<never> {
    return Promise.reject(new Error('Inventory creation is not supported by the API.'));
  }

  static async updateInventory(): Promise<never> {
    return Promise.reject(new Error('Inventory update is not supported by the API.'));
  }

  static async deleteInventory(): Promise<never> {
    return Promise.reject(new Error('Inventory deletion is not supported by the API.'));
  }
}

export default InventoryService;
