import { useQuery } from '@tanstack/react-query';

import {
  ProductService,
  type ProductListParams,
  type ProductListResponse,
  type ProductStats,
} from '../services/productService';
import type { ApiResponse } from '../types/api';

export const useProducts = (params?: ProductListParams) =>
  useQuery<ApiResponse<ProductListResponse>>({
    queryKey: ['products', params ?? {}],
    queryFn: () => ProductService.getProducts(params),
    staleTime: 2 * 60 * 1000,
  });

export const useProductStats = () =>
  useQuery<ApiResponse<ProductStats>>({
    queryKey: ['products', 'stats'],
    queryFn: () => ProductService.getStats(),
    staleTime: 5 * 60 * 1000,
  });

export type { ProductListParams };
