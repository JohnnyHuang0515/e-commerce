import { aiApi, ApiResponse } from './api';

// --- Search Types ---
export interface SearchRequest {
  query: string;
  limit?: number;
  filters?: Record<string, any>;
}
export interface SearchResult {
  item_id: string;
  title: string;
  score: number;
}

// --- Recommendation Types ---
export type RecommendationType = 'collaborative' | 'content_based' | 'hybrid' | 'trending';
export interface RecommendationItem {
  item_id: string;
  title: string;
  score: number;
}
export interface RecommendationRequest {
  type?: RecommendationType;
  limit?: number;
  item_type?: string;
}

// --- AI Service Class ---
export class AiService {

  // --- Search Endpoints ---
  static async search(request: SearchRequest): Promise<ApiResponse<SearchResult[]>> {
    const response = await aiApi.post('/search', request);
    return response.data;
  }

  static async getSearchSuggestions(query: string, limit: number = 5): Promise<ApiResponse<any>> {
    const response = await aiApi.get('/search/suggestions', { params: { q: query, limit } });
    return response.data;
  }

  static async getTrendingSearches(period: string = 'week', limit: number = 10): Promise<ApiResponse<any>> {
    const response = await aiApi.get('/search/trending', { params: { period, limit } });
    return response.data;
  }

  static async getSearchAnalytics(params?: { start_date?: string, end_date?: string }): Promise<ApiResponse<any>> {
    const response = await aiApi.get('/search/analytics', { params });
    return response.data;
  }

  static async recordSearchClick(clickData: { search_id: string, result_id: string, position: number }): Promise<ApiResponse<void>> {
    const response = await aiApi.post('/search/click', clickData);
    return response.data;
  }

  // --- Recommendation Endpoints ---
  static async getRecommendations(params: RecommendationRequest = {}): Promise<ApiResponse<RecommendationItem[]>> {
    const response = await aiApi.get('/recommendations', { params });
    return response.data;
  }

  static async getSimilarItems(itemId: string, limit: number = 5): Promise<ApiResponse<RecommendationItem[]>> {
    const response = await aiApi.get('/recommendations/similar', { params: { item_id: itemId, limit } });
    return response.data;
  }

  static async getPersonalizedRecommendations(limit: number = 10): Promise<ApiResponse<RecommendationItem[]>> {
    const response = await aiApi.get('/recommendations/personalized', { params: { limit } });
    return response.data;
  }
  
  static async recordRecommendationClick(clickData: { item_id: string, recommendation_type: string }): Promise<ApiResponse<void>> {
    const response = await aiApi.post('/recommendations/click', clickData);
    return response.data;
  }

  static async getRecommendationAnalytics(params?: { start_date?: string, end_date?: string }): Promise<ApiResponse<any>> {
    const response = await aiApi.get('/recommendations/analytics', { params });
    return response.data;
  }
}

export default AiService;
