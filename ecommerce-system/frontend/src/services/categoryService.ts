import { categoryApi } from './api';
import type { ApiResponse } from '../types/api';

// 分類相關類型定義
export interface Category {
  _id: string;
  name: string;
  description: string;
  level: number;
  sort_order: number;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

// 分類 API 服務類
export class CategoryService {
  // 獲取所有分類
  static async getCategories(): Promise<ApiResponse<Category[]>> {
    const response = await categoryApi.get('/v1/categories');
    return response.data;
  }

  // 根據 ID 獲取分類
  static async getCategory(categoryId: string): Promise<ApiResponse<Category>> {
    const response = await categoryApi.get(`/v1/categories/${categoryId}`);
    return response.data;
  }

  // 創建分類
  static async createCategory(categoryData: Partial<Category>): Promise<ApiResponse<Category>> {
    const response = await categoryApi.post('/v1/categories', categoryData);
    return response.data;
  }

  // 更新分類
  static async updateCategory(categoryId: string, categoryData: Partial<Category>): Promise<ApiResponse<Category>> {
    const response = await categoryApi.put(`/v1/categories/${categoryId}`, categoryData);
    return response.data;
  }

  // 刪除分類
  static async deleteCategory(categoryId: string): Promise<ApiResponse<void>> {
    const response = await categoryApi.delete(`/v1/categories/${categoryId}`);
    return response.data;
  }
}

export default CategoryService;
