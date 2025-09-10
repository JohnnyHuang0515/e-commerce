import { inventoryApi, ApiResponse, PaginatedResponse } from './api';

// 庫存相關類型定義
export interface Inventory {
  _id: string;
  productId: string;
  sku: string;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  minStock: number;
  maxStock: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'discontinued';
  location: {
    warehouse: string;
    zone?: string;
    shelf?: string;
    position?: string;
  };
  unitCost: number;
  totalValue: number;
  lastUpdated: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryTransaction {
  _id: string;
  transactionId: string;
  productId: string;
  type: 'purchase' | 'sale' | 'return' | 'adjustment' | 'transfer';
  quantity: number;
  previousStock: number;
  newStock: number;
  referenceId?: string;
  notes?: string;
  performedBy: string;
  performedAt: string;
}

export interface InventoryCreateRequest {
  productId: string;
  sku: string;
  initialStock: number;
  minStock: number;
  maxStock: number;
  unitCost: number;
  location: {
    warehouse: string;
    zone?: string;
    shelf?: string;
    position?: string;
  };
}

export interface InventoryUpdateRequest {
  quantity: number;
  type: 'purchase' | 'sale' | 'adjustment';
  reason: string;
  referenceId?: string;
  notes?: string;
}

export interface StockReservationRequest {
  quantity: number;
  orderId: string;
}

export interface InventoryStats {
    totalProducts: number;
    totalStock: number;
    totalValue: number;
    lowStockProducts: number;
    outOfStockProducts: number;
}

export interface InventorySearchParams {
  page?: number;
  limit?: number;
  status?: string;
  lowStock?: boolean;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// 庫存服務類
export class InventoryService {
  // 獲取庫存列表
  static async getInventories(params?: InventorySearchParams): Promise<ApiResponse<PaginatedResponse<Inventory>>> {
    const response = await inventoryApi.get('/', { params });
    return response.data;
  }

  // 獲取庫存詳情
  static async getInventory(productId: string): Promise<ApiResponse<Inventory>> {
    const response = await inventoryApi.get(`/${productId}`);
    return response.data;
  }

  // 創建庫存
  static async createInventory(data: InventoryCreateRequest): Promise<ApiResponse<Inventory>> {
    const response = await inventoryApi.post('/', data);
    return response.data;
  }

  // 更新庫存
  static async updateInventory(productId: string, data: InventoryUpdateRequest): Promise<ApiResponse<Inventory>> {
    const response = await inventoryApi.put(`/${productId}`, data);
    return response.data;
  }

  // 批量更新庫存
  static async bulkUpdateInventory(updates: Array<{ productId: string; quantity: number; type: string; reason: string; referenceId?: string }>): Promise<ApiResponse<any>> {
      const response = await inventoryApi.post('/bulk', { updates });
      return response.data;
  }

  // 預留庫存
  static async reserveStock(productId: string, data: StockReservationRequest): Promise<ApiResponse<any>> {
    const response = await inventoryApi.post(`/${productId}/reserve`, data);
    return response.data;
  }

  // 釋放庫存
  static async releaseStock(productId: string, data: { quantity: number; orderId: string }): Promise<ApiResponse<any>> {
    const response = await inventoryApi.post(`/${productId}/release`, data);
    return response.data;
  }

  // 確認出庫
  static async shipStock(productId: string, data: { quantity: number; orderId: string }): Promise<ApiResponse<any>> {
      const response = await inventoryApi.post(`/${productId}/ship`, data);
      return response.data;
  }

  // 獲取庫存交易記錄
  static async getInventoryTransactions(productId: string, params?: { page?: number; limit?: number; type?: string }): Promise<ApiResponse<PaginatedResponse<InventoryTransaction>>> {
    const response = await inventoryApi.get(`/${productId}/transactions`, { params });
    return response.data;
  }

  // 獲取庫存統計
  static async getInventoryStats(params?: { period?: string; startDate?: string; endDate?: string }): Promise<ApiResponse<InventoryStats>> {
    const response = await inventoryApi.get('/stats', { params });
    return response.data;
  }

  // 獲取低庫存警告
  static async getLowStockAlerts(params?: { threshold?: number }): Promise<ApiResponse<any>> {
    const response = await inventoryApi.get('/alerts', { params });
    return response.data;
  }
}

export default InventoryService;
