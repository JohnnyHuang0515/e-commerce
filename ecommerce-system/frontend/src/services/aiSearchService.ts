import { ApiResponse } from './api';

// AI搜尋相關接口定義
export interface SearchRequest {
  query: string;
  limit?: number;
  threshold?: number;
  filters?: Record<string, any>;
}

export interface SearchResult {
  product_id: string;
  score: number;
  metadata: {
    name: string;
    price: number;
    category: string;
    brand: string;
    description?: string;
    image?: string;
  };
}

export interface SearchResponse {
  success: boolean;
  data: SearchResult[];
  query: string;
  total: number;
  cached: boolean;
  message: string;
}

export interface SearchSuggestion {
  query: string;
  count: number;
}

export interface SearchSuggestionsResponse {
  success: boolean;
  data: SearchSuggestion[];
  message: string;
}

export interface ServiceStats {
  success: boolean;
  data: {
    total_searches: number;
    total_products_indexed: number;
    average_response_time: number;
    cache_hit_rate: number;
    last_updated: string;
  };
  message: string;
}

// AI Search Service 類
export class AISearchService {
  private baseUrl = 'http://localhost:3014/api/v1';

  // 語意搜尋
  async searchProducts(request: SearchRequest): Promise<SearchResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`搜尋失敗: ${response.status}`);
      }

      const result: SearchResponse = await response.json();
      return result;
    } catch (error) {
      console.error('AI搜尋錯誤:', error);
      throw error;
    }
  }

  // 獲取搜尋建議
  async getSearchSuggestions(query: string, limit: number = 10): Promise<SearchSuggestionsResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/suggestions?query=${encodeURIComponent(query)}&limit=${limit}`);
      
      if (!response.ok) {
        throw new Error(`獲取搜尋建議失敗: ${response.status}`);
      }

      const result: SearchSuggestionsResponse = await response.json();
      return result;
    } catch (error) {
      console.error('獲取搜尋建議錯誤:', error);
      throw error;
    }
  }

  // 索引商品
  async indexProduct(productId: string, productData: any): Promise<ApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/index`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id: productId,
          product_data: productData
        }),
      });

      if (!response.ok) {
        throw new Error(`索引商品失敗: ${response.status}`);
      }

      const result: ApiResponse = await response.json();
      return result;
    } catch (error) {
      console.error('索引商品錯誤:', error);
      throw error;
    }
  }

  // 移除商品索引
  async removeProduct(productId: string): Promise<ApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/index/${productId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`移除商品索引失敗: ${response.status}`);
      }

      const result: ApiResponse = await response.json();
      return result;
    } catch (error) {
      console.error('移除商品索引錯誤:', error);
      throw error;
    }
  }

  // 獲取服務統計
  async getServiceStats(): Promise<ServiceStats> {
    try {
      const response = await fetch(`${this.baseUrl}/stats`);
      
      if (!response.ok) {
        throw new Error(`獲取服務統計失敗: ${response.status}`);
      }

      const result: ServiceStats = await response.json();
      return result;
    } catch (error) {
      console.error('獲取服務統計錯誤:', error);
      throw error;
    }
  }

  // 健康檢查
  async healthCheck(): Promise<ApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      
      if (!response.ok) {
        throw new Error(`健康檢查失敗: ${response.status}`);
      }

      const result: ApiResponse = await response.json();
      return result;
    } catch (error) {
      console.error('健康檢查錯誤:', error);
      throw error;
    }
  }
}

// 導出服務實例
export const aiSearchService = new AISearchService();
