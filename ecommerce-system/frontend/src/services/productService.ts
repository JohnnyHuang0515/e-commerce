import { productApi, categoryApi, brandApi, ApiResponse, PaginatedResponse } from './api';

// 商品相關類型定義
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  brand: string;
  sku: string;
  stock: number;
  images: string[];
  status: 'active' | 'inactive' | 'draft';
  createdAt: string;
  updatedAt: string;
}

export interface ProductCreateRequest {
  name: string;
  description: string;
  price: number;
  category: string;
  brand: string;
  sku: string;
  stock: number;
}

export interface ProductUpdateRequest extends Partial<ProductCreateRequest> {}

export interface ProductSearchParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  brand?: string;
  status?: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
}

export interface ProductBrand {
  id: string;
  name: string;
  description?: string;
}

// 商品 API 服務類
export class ProductService {
  // --- Product Management ---
  static async getProducts(params?: ProductSearchParams): Promise<ApiResponse<PaginatedResponse<Product>>> {
    const response = await productApi.get('/api/v1/products/', { params });
    return response.data;
  }

  static async getProduct(productId: string): Promise<ApiResponse<Product>> {
    const response = await productApi.get(`/api/v1/products/${productId}`);
    return response.data;
  }

  static async createProduct(productData: ProductCreateRequest): Promise<ApiResponse<Product>> {
    const response = await productApi.post('/api/v1/products', productData);
    return response.data;
  }

  static async updateProduct(productId: string, productData: ProductUpdateRequest): Promise<ApiResponse<Product>> {
    const response = await productApi.put(`/api/v1/products/${productId}`, productData);
    return response.data;
  }

  static async deleteProduct(productId: string): Promise<ApiResponse<void>> {
    const response = await productApi.delete(`/api/v1/products/${productId}`);
    return response.data;
  }

  static async deleteProducts(productIds: string[]): Promise<ApiResponse<void>> {
    const response = await productApi.delete('/api/v1/products/batch', { data: { ids: productIds } });
    return response.data;
  }

  static async updateProductStatus(productId: string, status: string): Promise<ApiResponse<Product>> {
    const response = await productApi.put(`/api/v1/products/${productId}/status`, { status });
    return response.data;
  }

  static async updateProductStock(productId: string, stock: number): Promise<ApiResponse<Product>> {
    const response = await productApi.put(`/api/v1/products/${productId}/stock`, { stock });
    return response.data;
  }

  // --- Category Management ---
  static async getCategories(): Promise<ApiResponse<ProductCategory[]>> {
    const response = await categoryApi.get('/api/v1/products/categories');
    return response.data;
  }

  static async createCategory(categoryData: Omit<ProductCategory, 'id'>): Promise<ApiResponse<ProductCategory>> {
    const response = await categoryApi.post('/api/v1/products/categories', categoryData);
    return response.data;
  }

  // --- Brand Management ---
  static async getBrands(): Promise<ApiResponse<ProductBrand[]>> {
    const response = await brandApi.get('/api/v1/products/brands');
    return response.data;
  }

  static async createBrand(brandData: Omit<ProductBrand, 'id'>): Promise<ApiResponse<ProductBrand>> {
    const response = await brandApi.post('/api/v1/products/brands', brandData);
    return response.data;
  }

  // --- Image & Stats ---
  static async uploadProductImage(file: File): Promise<ApiResponse<{ url: string }>> {
    const formData = new FormData();
    formData.append('image', file);
    const response = await productApi.post('/api/v1/products/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  static async getProductStats(): Promise<ApiResponse<any>> {
    const response = await productApi.get('/api/v1/products/stats');
    return response.data;
  }
}

export default ProductService;