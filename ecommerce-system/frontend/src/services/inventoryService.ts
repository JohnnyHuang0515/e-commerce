import { inventoryApi } from './api';
import { ApiResponse } from '../types/api';

import type { InventoryItem, InventoryStats } from '../types/api';

export interface InventoryListParams {
  page?: number;
  limit?: number;
  search?: string;
  category_id?: string | number;
  low_stock?: boolean;
}

export interface InventoryListResponse {
  items: InventoryItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface InventoryAdjustRequest {
  adjustment: number;
  reason: string;
  notes?: string;
}

export interface InventoryAdjustmentResult {
  product_id: string;
  product_name: string;
  old_stock: number;
  adjustment: number;
  new_stock: number;
  reason: string;
  notes?: string;
  updated_at: string;
}

export class InventoryService {
  static async getInventories(params: InventoryListParams = {}): Promise<ApiResponse<InventoryListResponse>> {
    const queryParams: Record<string, string | number | undefined> = {
      page: params.page,
      limit: params.limit,
      search: params.search,
      category_id: params.category_id ? Number(params.category_id) : undefined,
    };

    if (typeof params.low_stock === 'boolean') {
      queryParams.low_stock = params.low_stock ? 'true' : 'false';
    }

    const response = await inventoryApi.get('/v1/inventory', {
      params: queryParams,
    });

    return response.data;
  }

  static async adjustStock(productPublicId: string, data: InventoryAdjustRequest): Promise<ApiResponse<InventoryAdjustmentResult>> {
    const response = await inventoryApi.post(`/v1/inventory/${productPublicId}/adjust`, data);
    return response.data;
  }

  static async getLowStockAlerts(threshold: number = 5): Promise<ApiResponse<InventoryItem[]>> {
    const response = await inventoryApi.get('/v1/inventory/alerts', {
      params: { threshold },
    });
    return response.data;
  }

  static async getOutOfStockAlerts(): Promise<ApiResponse<InventoryItem[]>> {
    const response = await this.getLowStockAlerts(0);

    return {
      ...response,
      data: response.data.filter((item) => item.stock_quantity === 0),
    };
  }

  static async getInventoryStats(): Promise<ApiResponse<InventoryStats>> {
    const response = await inventoryApi.get('/v1/inventory/statistics');
    return response.data;
  }

  static async createInventory(): Promise<never> {
    return Promise.reject(new Error('Inventory creation is not supported by the backend API.'));
  }

  static async updateInventory(): Promise<never> {
    return Promise.reject(new Error('Inventory update is not supported by the backend API.'));
  }

  static async deleteInventory(): Promise<never> {
    return Promise.reject(new Error('Inventory deletion is not supported by the backend API.'));
  }
}

export default InventoryService;
