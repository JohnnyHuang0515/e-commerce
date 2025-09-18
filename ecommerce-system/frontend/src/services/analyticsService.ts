import { dashboardApi } from './api';
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

export class AnalyticsService {
  static async getDashboard(): Promise<ApiResponse<AnalyticsDashboard>> {
    const [overviewResponse, popularResponse] = await Promise.all([
      dashboardApi.get('/v1/dashboard/overview'),
      dashboardApi.get('/v1/dashboard/popular-products'),
    ]);

    const overview = overviewResponse.data?.data;
    const popularProducts = popularResponse.data?.data ?? [];

    const totalSales = overview?.summary?.totalSales ?? 0;
    const totalOrders = overview?.summary?.totalOrders ?? 0;
    const totalUsers = overview?.summary?.totalUsers ?? 0;
    const conversionRateRaw = overview?.summary?.conversionRate ?? 0;

    const salesTrend: SalesTrendPoint[] = (overview?.periodData ?? []).map((point: any) => ({
      date: point.date,
      sales: Number(point.sales ?? 0),
      orders: Number(point.orders ?? 0),
    }));

    const totalTopSales = popularProducts.reduce(
      (acc: number, product: any) => acc + Number(product.totalSales ?? 0),
      0
    );

    const topProducts: TopProduct[] = popularProducts.map((product: any) => {
      const sales = Number(product.totalSales ?? 0);
      return {
        id: product.id,
        name: product.name,
        sales,
        percentage: totalTopSales > 0 ? sales / totalTopSales : 0,
      };
    });

    const dashboard: AnalyticsDashboard = {
      summary: {
        revenue: totalSales,
        orders: totalOrders,
        customers: totalUsers,
        conversionRate: conversionRateRaw / 100,
      },
      salesTrend,
      topProducts,
    };

    return {
      success: true,
      data: dashboard,
    };
  }
}

export default AnalyticsService;
