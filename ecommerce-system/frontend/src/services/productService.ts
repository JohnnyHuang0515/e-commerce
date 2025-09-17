import type { AxiosError } from 'axios';

import { productApi } from './api';
import type { ApiResponse, Paginated } from '../types/api';

export type ProductStatus = 'active' | 'inactive';

export interface ProductRecord {
  id: string;
  name: string;
  sku: string;
  category?: string;
  price: number;
  stock: number;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ProductListParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: ProductStatus;
}

export type ProductListResponse = Paginated<ProductRecord>;

export interface ProductStats {
  total: number;
  active: number;
  lowStock: number;
  inactive: number;
}

const isAxiosError = (error: unknown): error is AxiosError =>
  typeof error === 'object' && error !== null && 'isAxiosError' in error;

const MOCK_PRODUCTS: ProductRecord[] = [
  {
    id: 'prod-001',
    name: '無線藍牙耳機',
    sku: 'SKU-1001',
    category: '音訊設備',
    price: 2590,
    stock: 42,
    status: 'active',
    createdAt: '2024-01-05T09:00:00Z',
    updatedAt: '2024-03-05T09:00:00Z',
  },
  {
    id: 'prod-002',
    name: '智能穿戴手環',
    sku: 'SKU-1002',
    category: '穿戴裝置',
    price: 1890,
    stock: 12,
    status: 'active',
    createdAt: '2024-02-10T12:30:00Z',
    updatedAt: '2024-03-02T12:30:00Z',
  },
  {
    id: 'prod-003',
    name: '行動電源 20000mAh',
    sku: 'SKU-1003',
    category: '充電配件',
    price: 990,
    stock: 6,
    status: 'active',
    createdAt: '2023-12-22T14:10:00Z',
    updatedAt: '2024-03-04T14:10:00Z',
  },
  {
    id: 'prod-004',
    name: 'USB-C 充電線 (1.5m)',
    sku: 'SKU-1004',
    category: '充電配件',
    price: 290,
    stock: 0,
    status: 'inactive',
    createdAt: '2023-11-30T08:00:00Z',
    updatedAt: '2024-02-20T08:00:00Z',
  },
];

const buildMockResponse = (params: ProductListParams = {}): ProductListResponse => {
  const { search, category, status, page = 1, limit = 10 } = params;
  let filtered = [...MOCK_PRODUCTS];

  if (search) {
    const keyword = search.toLowerCase();
    filtered = filtered.filter(
      (product) => product.name.toLowerCase().includes(keyword) || product.sku.toLowerCase().includes(keyword)
    );
  }

  if (category) {
    filtered = filtered.filter((product) => product.category === category);
  }

  if (status) {
    filtered = filtered.filter((product) => product.status === status);
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

const buildMockStats = (products: ProductRecord[]): ProductStats => ({
  total: products.length,
  active: products.filter((product) => product.status === 'active').length,
  lowStock: products.filter((product) => product.stock > 0 && product.stock < 10).length,
  inactive: products.filter((product) => product.status === 'inactive').length,
});

export class ProductService {
  static async getProducts(params: ProductListParams = {}): Promise<ApiResponse<ProductListResponse>> {
    try {
      const response = await productApi.get('/v1/products', { params });
      if (response.data?.success) {
        return response.data;
      }
    } catch (error) {
      if (!isAxiosError(error)) {
        console.error('載入商品列表失敗:', error);
      }
    }

    return {
      success: true,
      data: buildMockResponse(params),
    };
  }

  static async getStats(): Promise<ApiResponse<ProductStats>> {
    try {
      const response = await productApi.get('/v1/products/stats');
      if (response.data?.success) {
        return response.data;
      }
    } catch (error) {
      if (!isAxiosError(error)) {
        console.error('載入商品統計失敗:', error);
      }
    }

    return {
      success: true,
      data: buildMockStats(MOCK_PRODUCTS),
    };
  }

  static async createProduct(): Promise<never> {
    return Promise.reject(new Error('商品建立尚未在前端支援。'));
  }

  static async updateProduct(): Promise<never> {
    return Promise.reject(new Error('商品更新尚未在前端支援。'));
  }

  static async deleteProduct(): Promise<never> {
    return Promise.reject(new Error('商品刪除尚未在前端支援。'));
  }
}

export default ProductService;
