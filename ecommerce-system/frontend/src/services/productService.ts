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

export class ProductService {
  static async getProducts(params: ProductListParams = {}): Promise<ApiResponse<ProductListResponse>> {
    const response = await productApi.get('/v1/products', { params });
    return response.data;
  }

  static async getStats(): Promise<ApiResponse<ProductStats>> {
    const response = await productApi.get('/v1/products/stats');
    return response.data;
  }
}

export default ProductService;
