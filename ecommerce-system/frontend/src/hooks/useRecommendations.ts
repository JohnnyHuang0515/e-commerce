import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  AiService,
  type RecommendationItem,
  type RecommendationParams,
} from '../services/aiService';
import type { ApiResponse } from '../types/api';

export const useRecommendations = (params?: RecommendationParams) =>
  useQuery<ApiResponse<RecommendationItem[]>>({
    queryKey: ['recommendations', params ?? {}],
    queryFn: () => AiService.getRecommendations(params),
    staleTime: 2 * 60 * 1000,
  });

export const usePopularRecommendations = (params?: RecommendationParams) =>
  useQuery<ApiResponse<RecommendationItem[]>>({
    queryKey: ['recommendations', 'popular', params ?? {}],
    queryFn: () => AiService.getPopularRecommendations(params),
    staleTime: 5 * 60 * 1000,
  });

export const useSimilarRecommendations = (productId?: string, params?: RecommendationParams) =>
  useQuery<ApiResponse<RecommendationItem[]>>({
    queryKey: ['recommendations', 'similar', productId, params ?? {}],
    queryFn: () => AiService.getSimilarRecommendations(productId as string, params),
    enabled: Boolean(productId),
    staleTime: 5 * 60 * 1000,
  });

export const useRefreshRecommendations = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => AiService.refreshRecommendations(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
      queryClient.invalidateQueries({ queryKey: ['recommendations', 'popular'] });
    },
  });
};

export type { RecommendationItem, RecommendationParams };
