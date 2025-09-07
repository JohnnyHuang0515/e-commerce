import { productApi, ApiResponse, PaginatedResponse } from './api';

// 商品相關類型定義
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  brand: string;
  sku: string;
  stock: number;
  images: string[]; // 圖片 URL 數組
  imageUrls?: string[]; // 兼容舊版本
  status: 'active' | 'inactive' | 'draft';
  tags: string[];
  specifications: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface ProductCreateRequest {
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  brand: string;
  sku: string;
  stock: number;
  images?: string[];
  status?: 'active' | 'inactive' | 'draft';
  tags?: string[];
  specifications?: Record<string, any>;
}

export interface ProductUpdateRequest extends Partial<ProductCreateRequest> {
  id: string;
}

export interface ProductSearchParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  brand?: string;
  status?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  level: number;
  children?: ProductCategory[];
  productCount: number;
}

export interface ProductBrand {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  website?: string;
  productCount: number;
}

// 商品 API 服務類
export class ProductService {
  // 獲取商品列表
  static async getProducts(params?: ProductSearchParams): Promise<ApiResponse<PaginatedResponse<Product>>> {
    try {
      const response = await productApi.get('/products', { params });
      return response.data;
    } catch (error) {
      console.error('獲取商品列表失敗:', error);
      throw error;
    }
  }

  // 獲取商品詳情
  static async getProduct(productId: string): Promise<ApiResponse<Product>> {
    try {
      const response = await productApi.get(`/products/${productId}`);
      return response.data;
    } catch (error) {
      console.error('獲取商品詳情失敗:', error);
      throw error;
    }
  }

  // 創建商品
  static async createProduct(productData: ProductCreateRequest): Promise<ApiResponse<Product>> {
    try {
      const response = await productApi.post('/products', productData);
      return response.data;
    } catch (error) {
      console.error('創建商品失敗:', error);
      throw error;
    }
  }

  // 更新商品
  static async updateProduct(productData: ProductUpdateRequest): Promise<ApiResponse<Product>> {
    try {
      const { id, ...updateData } = productData;
      const response = await productApi.put(`/products/${id}`, updateData);
      return response.data;
    } catch (error) {
      console.error('更新商品失敗:', error);
      throw error;
    }
  }

  // 刪除商品
  static async deleteProduct(productId: string): Promise<ApiResponse<void>> {
    try {
      const response = await productApi.delete(`/products/${productId}`);
      return response.data;
    } catch (error) {
      console.error('刪除商品失敗:', error);
      throw error;
    }
  }

  // 批量刪除商品
  static async deleteProducts(productIds: string[]): Promise<ApiResponse<void>> {
    try {
      const response = await productApi.delete('/products/batch', {
        data: { ids: productIds }
      });
      return response.data;
    } catch (error) {
      console.error('批量刪除商品失敗:', error);
      throw error;
    }
  }

  // 更新商品狀態
  static async updateProductStatus(productId: string, status: string): Promise<ApiResponse<Product>> {
    try {
      const response = await productApi.put(`/products/${productId}/status`, { status });
      return response.data;
    } catch (error) {
      console.error('更新商品狀態失敗:', error);
      throw error;
    }
  }

  // 更新商品庫存
  static async updateProductStock(productId: string, stock: number): Promise<ApiResponse<Product>> {
    try {
      const response = await productApi.put(`/products/${productId}/stock`, { stock });
      return response.data;
    } catch (error) {
      console.error('更新商品庫存失敗:', error);
      throw error;
    }
  }

  // 獲取商品分類
  static async getCategories(): Promise<ApiResponse<ProductCategory[]>> {
    try {
      const response = await productApi.get('/categories');
      return response.data;
    } catch (error) {
      console.error('獲取商品分類失敗:', error);
      throw error;
    }
  }

  // 創建商品分類
  static async createCategory(categoryData: Omit<ProductCategory, 'id' | 'productCount'>): Promise<ApiResponse<ProductCategory>> {
    try {
      const response = await productApi.post('/categories', categoryData);
      return response.data;
    } catch (error) {
      console.error('創建商品分類失敗:', error);
      throw error;
    }
  }

  // 獲取商品品牌
  static async getBrands(): Promise<ApiResponse<ProductBrand[]>> {
    try {
      const response = await productApi.get('/brands');
      return response.data;
    } catch (error) {
      console.error('獲取商品品牌失敗:', error);
      throw error;
    }
  }

  // 創建商品品牌
  static async createBrand(brandData: Omit<ProductBrand, 'id' | 'productCount'>): Promise<ApiResponse<ProductBrand>> {
    try {
      const response = await productApi.post('/brands', brandData);
      return response.data;
    } catch (error) {
      console.error('創建商品品牌失敗:', error);
      throw error;
    }
  }

  // 上傳商品圖片
  static async uploadProductImage(file: File): Promise<ApiResponse<{ url: string }>> {
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await productApi.post('/products/upload-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('上傳商品圖片失敗:', error);
      throw error;
    }
  }

  // 獲取商品統計
  static async getProductStats(): Promise<ApiResponse<{
    total: number;
    active: number;
    inactive: number;
    draft: number;
    lowStock: number;
    outOfStock: number;
  }>> {
    try {
      const response = await productApi.get('/products/stats');
      return response.data;
    } catch (error) {
      console.error('獲取商品統計失敗:', error);
      throw error;
    }
  }
}

export default ProductService;
