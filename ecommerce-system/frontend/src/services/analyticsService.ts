import type { AxiosError } from 'axios';

import { analyticsApi } from './api';
import type { ApiResponse } from '../types/api';

export interface AnalyticsSummary {
  revenue: number;
  orders: number;
  customers: number;
  conversionRate: number;
}

export interface SalesTrendPoint {
  date: string;
  sales: number;
  orders: number;
}

export interface TopProduct {
  id: string;
  name: string;
  sales: number;
  percentage: number;
}

export interface AnalyticsDashboard {
  summary: AnalyticsSummary;
  salesTrend: SalesTrendPoint[];
  topProducts: TopProduct[];
}

const isAxiosError = (error: unknown): error is AxiosError =>
  typeof error === 'object' && error !== null && 'isAxiosError' in error;

const MOCK_DASHBOARD: AnalyticsDashboard = {
  summary: {
    revenue: 1254300,
    orders: 892,
    customers: 640,
    conversionRate: 0.043,
  },
  salesTrend: Array.from({ length: 7 }).map((_, index) => ({
    date: new Date(Date.now() - (6 - index) * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10),
    sales: 120000 + Math.round(Math.random() * 30000),
    orders: 90 + Math.round(Math.random() * 25),
  })),
  topProducts: [
    { id: 'prod-001', name: '無線藍牙耳機', sales: 120000, percentage: 0.28 },
    { id: 'prod-002', name: '智能穿戴手環', sales: 98000, percentage: 0.22 },
    { id: 'prod-003', name: '行動電源 20000mAh', sales: 72000, percentage: 0.16 },
  ],
};

export class AnalyticsService {
  static async getDashboard(): Promise<ApiResponse<AnalyticsDashboard>> {
    try {
      const response = await analyticsApi.get('/v1/dashboard/overview');
      if (response.data?.success) {
        return response.data;
      }
    } catch (error) {
      if (!isAxiosError(error)) {
        console.error('載入分析儀表板失敗:', error);
      }
    }

    return {
      success: true,
      data: MOCK_DASHBOARD,
    };
  }
}

export default AnalyticsService;
