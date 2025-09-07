import { inventoryApi } from './api';

// 庫存相關類型定義
export interface Inventory {
  _id: string;
  productId: string;
  sku: string;
  stock: number;
  reservedStock: number;
  availableStock: number;
  minStock: number;
  maxStock: number;
  reorderPoint: number;
  status: 'active' | 'inactive' | 'discontinued';
  location: {
    warehouse: string;
    aisle?: string;
    shelf?: string;
    bin?: string;
  };
  cost: number;
  currency: string;
  lastRestocked?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryLog {
  _id: string;
  inventoryId: string;
  productId: string;
  sku: string;
  type: 'in' | 'out' | 'adjustment' | 'reserve' | 'unreserve' | 'transfer';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  reference?: string; // 訂單ID、調撥單號等
  userId?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface InventoryCreateRequest {
  productId: string;
  sku: string;
  stock: number;
  minStock: number;
  maxStock: number;
  reorderPoint: number;
  location: {
    warehouse: string;
    aisle?: string;
    shelf?: string;
    bin?: string;
  };
  cost: number;
  currency: string;
  metadata?: Record<string, any>;
}

export interface InventoryUpdateRequest {
  stock?: number;
  minStock?: number;
  maxStock?: number;
  reorderPoint?: number;
  status?: string;
  location?: {
    warehouse: string;
    aisle?: string;
    shelf?: string;
    bin?: string;
  };
  cost?: number;
  metadata?: Record<string, any>;
}

export interface StockAdjustmentRequest {
  inventoryId: string;
  quantity: number;
  reason: string;
  reference?: string;
  metadata?: Record<string, any>;
}

export interface StockReservationRequest {
  inventoryId: string;
  quantity: number;
  orderId: string;
  metadata?: Record<string, any>;
}

export interface InventoryStats {
  totalProducts: number;
  totalStock: number;
  totalValue: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  averageStock: number;
  stockByStatus: Record<string, number>;
  stockByLocation: Record<string, number>;
  dailyMovements: Array<{
    date: string;
    in: number;
    out: number;
    adjustment: number;
  }>;
}

export interface InventorySearchParams {
  page?: number;
  limit?: number;
  productId?: string;
  sku?: string;
  status?: string;
  warehouse?: string;
  lowStock?: boolean;
  outOfStock?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// 庫存服務類
export class InventoryService {
  // 獲取庫存列表
  static async getInventories(params?: InventorySearchParams) {
    const response = await inventoryApi.get('/inventory', { params });
    return response.data;
  }

  // 獲取庫存詳情
  static async getInventory(inventoryId: string) {
    const response = await inventoryApi.get(`/inventory/${inventoryId}`);
    return response.data;
  }

  // 創建庫存
  static async createInventory(data: InventoryCreateRequest) {
    const response = await inventoryApi.post('/inventory', data);
    return response.data;
  }

  // 更新庫存
  static async updateInventory(inventoryId: string, data: InventoryUpdateRequest) {
    const response = await inventoryApi.put(`/inventory/${inventoryId}`, data);
    return response.data;
  }

  // 刪除庫存
  static async deleteInventory(inventoryId: string) {
    const response = await inventoryApi.delete(`/inventory/${inventoryId}`);
    return response.data;
  }

  // 庫存調整
  static async adjustStock(data: StockAdjustmentRequest) {
    const response = await inventoryApi.post('/inventory/adjust', data);
    return response.data;
  }

  // 預留庫存
  static async reserveStock(data: StockReservationRequest) {
    const response = await inventoryApi.post('/inventory/reserve', data);
    return response.data;
  }

  // 釋放庫存
  static async unreserveStock(inventoryId: string, quantity: number, orderId: string) {
    const response = await inventoryApi.post('/inventory/unreserve', {
      inventoryId,
      quantity,
      orderId
    });
    return response.data;
  }

  // 獲取庫存記錄
  static async getInventoryLogs(inventoryId: string, params?: { page?: number; limit?: number; type?: string }) {
    const response = await inventoryApi.get(`/inventory/${inventoryId}/logs`, { params });
    return response.data;
  }

  // 獲取庫存統計
  static async getInventoryStats(params?: { startDate?: string; endDate?: string }) {
    const response = await inventoryApi.get('/inventory/stats', { params });
    return response.data;
  }

  // 獲取庫存概覽
  static async getInventoryOverview() {
    const response = await inventoryApi.get('/inventory/overview');
    return response.data;
  }

  // 獲取低庫存警告
  static async getLowStockAlerts() {
    const response = await inventoryApi.get('/inventory/alerts');
    return response.data;
  }

  // 獲取缺貨警告
  static async getOutOfStockAlerts() {
    const response = await inventoryApi.get('/inventory/alerts');
    return response.data;
  }

  // 批量庫存操作
  static async batchUpdateStock(updates: Array<{ inventoryId: string; quantity: number; reason: string }>) {
    const response = await inventoryApi.put('/inventory/batch-update', { updates });
    return response.data;
  }
}

export default InventoryService;
