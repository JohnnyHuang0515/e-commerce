import type { AxiosError } from 'axios';
import { recommendationApi } from './api';
import type { ApiResponse } from '../types/api';

export interface RecommendationItem {
  id: string;
  productId: number;
  name: string;
  description?: string;
  price?: number;
  score?: number;
  imageUrl?: string;
  category?: string;
}

export interface RecommendationParams {
  limit?: number;
  category_id?: string;
}

export interface SearchRequest {
  query: string;
  limit?: number;
  threshold?: number;
}

export interface SearchResult {
  product_id: string;
  score: number;
  metadata: {
    name: string;
    price?: number;
    category?: string;
    brand?: string;
  };
}

export interface SearchSuggestion {
  text: string;
  score: number;
}

export interface ServiceStatsData {
  total_searches: number;
  success_rate: number;
  average_latency: number;
  last_updated: string;
}

const isAxiosError = (error: unknown): error is AxiosError =>
  typeof error === 'object' && error !== null && 'isAxiosError' in error;

const normalizeItem = (raw: any): RecommendationItem => ({
  id: raw.public_id ?? String(raw.product_id ?? raw.id ?? Math.random()),
  productId: raw.product_id ?? raw.id ?? 0,
  name: raw.name ?? '未命名商品',
  description: raw.description ?? raw.reason,
  price: typeof raw.price === 'number' ? raw.price : undefined,
  score: typeof raw.score === 'number' ? raw.score : undefined,
  imageUrl: raw.image ?? raw.image_url,
  category: raw.category ?? raw.category_name,
});

const MOCK_RECOMMENDATIONS: RecommendationItem[] = [
  {
    id: 'mock-1',
    productId: 1,
    name: '熱銷藍牙耳機',
    description: '舒適配戴，長效續航的無線藍牙耳機。',
    price: 2590,
    score: 0.86,
  },
  {
    id: 'mock-2',
    productId: 2,
    name: '智能穿戴手環',
    description: '支援心率監測與運動偵測，多種主題風格。',
    price: 1890,
    score: 0.73,
  },
];

const MOCK_SEARCH_RESULTS: SearchResult[] = [
  {
    product_id: 'A-1001',
    score: 0.82,
    metadata: {
      name: '藍牙耳機 Pro',
      price: 2490,
      category: 'audio',
      brand: 'SoundSpace',
    },
  },
  {
    product_id: 'A-1002',
    score: 0.74,
    metadata: {
      name: '主動式降噪耳罩耳機',
      price: 3590,
      category: 'audio',
      brand: 'QuietWave',
    },
  },
];

const MOCK_SUGGESTIONS: SearchSuggestion[] = [
  { text: '無線藍牙耳機', score: 0.91 },
  { text: '主動降噪耳機', score: 0.86 },
  { text: '運動藍牙耳機', score: 0.78 },
];

export class AiService {
  static async getRecommendations(params: RecommendationParams = {}): Promise<ApiResponse<RecommendationItem[]>> {
    try {
      const response = await recommendationApi.get('/v1/recommendations', { params });
      if (response.data?.success && Array.isArray(response.data.data)) {
        return {
          success: true,
          data: response.data.data.map(normalizeItem),
        };
      }
    } catch (error) {
      if (!isAxiosError(error)) {
        console.error('載入推薦資料失敗:', error);
      }
    }

    return {
      success: true,
      data: MOCK_RECOMMENDATIONS,
    };
  }

  static async getPopularRecommendations(params: RecommendationParams = {}): Promise<ApiResponse<RecommendationItem[]>> {
    try {
      const response = await recommendationApi.get('/v1/recommendations/popular', { params });
      if (response.data?.success && Array.isArray(response.data.data)) {
        return {
          success: true,
          data: response.data.data.map(normalizeItem),
        };
      }
    } catch (error) {
      if (!isAxiosError(error)) {
        console.error('載入熱門推薦失敗:', error);
      }
    }

    return {
      success: true,
      data: MOCK_RECOMMENDATIONS,
    };
  }

  static async getSimilarRecommendations(productPublicId: string, params: RecommendationParams = {}): Promise<ApiResponse<RecommendationItem[]>> {
    try {
      const response = await recommendationApi.get(`/v1/recommendations/similar/${productPublicId}`, { params });
      if (response.data?.success && Array.isArray(response.data.data)) {
        return {
          success: true,
          data: response.data.data.map(normalizeItem),
        };
      }
    } catch (error) {
      if (!isAxiosError(error)) {
        console.error('載入相似商品失敗:', error);
      }
    }

    return {
      success: true,
      data: MOCK_RECOMMENDATIONS,
    };
  }

  static async search(_request: SearchRequest): Promise<ApiResponse<SearchResult[]>> {
    return {
      success: true,
      data: MOCK_SEARCH_RESULTS,
    };
  }

  static async getSearchSuggestions(query: string, limit: number = 5): Promise<ApiResponse<SearchSuggestion[]>> {
    const filtered = MOCK_SUGGESTIONS.filter((suggestion) =>
      suggestion.text.includes(query)
    ).slice(0, limit);

    return {
      success: true,
      data: filtered.length > 0 ? filtered : MOCK_SUGGESTIONS.slice(0, limit),
    };
  }

  static async getServiceStats(): Promise<ApiResponse<ServiceStatsData>> {
    return {
      success: true,
      data: {
        total_searches: 1245,
        success_rate: 0.96,
        average_latency: 180,
        last_updated: new Date().toISOString(),
      },
    };
  }

  static async refreshRecommendations(): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await recommendationApi.post('/v1/recommendations/refresh');
      if (response.data?.success) {
        return response.data;
      }
    } catch (error) {
      if (!isAxiosError(error)) {
        console.error('刷新推薦失敗:', error);
      }
    }

    return {
      success: true,
      data: {
        message: '推薦結果已刷新（模擬回應）',
      },
    };
  }
}

export default AiService;
