
import { analyticsApi, ApiResponse, PaginatedResponse } from './api';

// Analytics 相關類型定義

// Sales Analytics
export interface SalesAnalytics {
  period: string;
  startDate: string;
  endDate: string;
  metrics: {
    totalSales: number;
    totalOrders: number;
    averageOrderValue: number;
    salesGrowth: number;
    orderGrowth: number;
  };
  trends: Array<{
    date: string;
    sales: number;
    orders: number;
    customers: number;
  }>;
  topProducts: Array<{
    productId: string;
    productName: string;
    sales: number;
    quantity: number;
  }>;
  topCategories: Array<{
    categoryId: string;
    categoryName: string;
    sales: number;
    percentage: number;
  }>;
}

// User Analytics
export interface UserAnalytics {
  period: string;
  startDate: string;
  endDate: string;
  metrics: {
    totalUsers: number;
    newUsers: number;
    activeUsers: number;
    retentionRate: number;
    churnRate: number;
  };
  segments: Array<{
    segment: string;
    count: number;
    percentage: number;
  }>;
  behavior: {
    averageSessionDuration: number;
    averagePagesPerSession: number;
    bounceRate: number;
    conversionRate: number;
  };
}

// Product Analytics
export interface ProductAnalytics {
    period: string;
    startDate: string;
    endDate: string;
    metrics: {
        totalProducts: number;
        activeProducts: number;
        topSellingProducts: number;
        lowStockProducts: number;
    };
    performance: Array<{
        productId: string;
        productName: string;
        sales: number;
        quantity: number;
        revenue: number;
        profit: number;
        margin: number;
    }>;
}

// Revenue Analytics
export interface RevenueAnalytics {
    period: string;
    startDate: string;
    endDate: string;
    metrics: {
        totalRevenue: number;
        grossProfit: number;
        netProfit: number;
        revenueGrowth: number;
        profitMargin: number;
    };
    breakdown: {
        byCategory: Array<{
            category: string;
            revenue: number;
            percentage: number;
        }>;
    };
}

// Dashboard Data
export interface AnalyticsDashboardData {
    overview: {
        totalRevenue: number;
        totalOrders: number;
        totalUsers: number;
        totalProducts: number;
    };
    growth: {
        revenueGrowth: number;
        orderGrowth: number;
        userGrowth: number;
        productGrowth: number;
    };
}

// API 查詢參數
export interface AnalyticsParams {
    period?: 'day' | 'week' | 'month' | 'quarter' | 'year';
    startDate?: string;
    endDate?: string;
    groupBy?: 'category' | 'product' | 'user' | 'region';
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    compareWith?: 'previous' | 'same_period_last_year';
}


// Analytics API 服務類
export class AnalyticsService {

    // 健康檢查
    static async healthCheck(): Promise<ApiResponse<any>> {
        try {
            const response = await analyticsApi.get('/v1/health');
            return response.data;
        } catch (error) {
            console.error('Analytics service health check failed:', error);
            throw error;
        }
    }

    // 銷售分析
    static async getSalesAnalytics(params: AnalyticsParams): Promise<ApiResponse<SalesAnalytics>> {
        try {
            const response = await analyticsApi.get('/v1/sales', { params });
            return response.data;
        } catch (error) {
            console.error('Failed to get sales analytics:', error);
            throw error;
        }
    }

    static async getSalesTrend(params: AnalyticsParams): Promise<ApiResponse<any>> {
        try {
            const response = await analyticsApi.get('/v1/sales/trend', { params });
            return response.data;
        } catch (error) {
            console.error('Failed to get sales trend:', error);
            throw error;
        }
    }

    static async getSalesComparison(params: AnalyticsParams): Promise<ApiResponse<any>> {
        try {
            const response = await analyticsApi.get('/v1/sales/comparison', { params });
            return response.data;
        } catch (error) {
            console.error('Failed to get sales comparison:', error);
            throw error;
        }
    }

    // 用戶分析
    static async getUserAnalytics(params: AnalyticsParams): Promise<ApiResponse<UserAnalytics>> {
        try {
            const response = await analyticsApi.get('/v1/users', { params });
            return response.data;
        } catch (error) {
            console.error('Failed to get user analytics:', error);
            throw error;
        }
    }

    static async getUserBehavior(params: AnalyticsParams): Promise<ApiResponse<any>> {
        try {
            const response = await analyticsApi.get('/v1/users/behavior', { params });
            return response.data;
        } catch (error) {
            console.error('Failed to get user behavior:', error);
            throw error;
        }
    }

    static async getUserSegmentation(params: AnalyticsParams): Promise<ApiResponse<any>> {
        try {
            const response = await analyticsApi.get('/v1/users/segmentation', { params });
            return response.data;
        } catch (error) {
            console.error('Failed to get user segmentation:', error);
            throw error;
        }
    }

    // 商品分析
    static async getProductAnalytics(params: AnalyticsParams): Promise<ApiResponse<ProductAnalytics>> {
        try {
            const response = await analyticsApi.get('/v1/products', { params });
            return response.data;
        } catch (error) {
            console.error('Failed to get product analytics:', error);
            throw error;
        }
    }

    static async getProductPerformance(params: AnalyticsParams): Promise<ApiResponse<any>> {
        try {
            const response = await analyticsApi.get('/v1/products/performance', { params });
            return response.data;
        } catch (error) {
            console.error('Failed to get product performance:', error);
            throw error;
        }
    }

    static async getCategoryAnalytics(params: AnalyticsParams): Promise<ApiResponse<any>> {
        try {
            const response = await analyticsApi.get('/v1/categories', { params });
            return response.data;
        } catch (error) {
            console.error('Failed to get category analytics:', error);
            throw error;
        }
    }

    // 營收分析
    static async getRevenueAnalytics(params: AnalyticsParams): Promise<ApiResponse<RevenueAnalytics>> {
        try {
            const response = await analyticsApi.get('/v1/revenue', { params });
            return response.data;
        } catch (error) {
            console.error('Failed to get revenue analytics:', error);
            throw error;
        }
    }

    static async getRevenueForecast(params: AnalyticsParams): Promise<ApiResponse<any>> {
        try {
            const response = await analyticsApi.get('/v1/revenue/forecast', { params });
            return response.data;
        } catch (error) {
            console.error('Failed to get revenue forecast:', error);
            throw error;
        }
    }

    static async getProfitAnalytics(params: AnalyticsParams): Promise<ApiResponse<any>> {
        try {
            const response = await analyticsApi.get('/v1/profit', { params });
            return response.data;
        } catch (error) {
            console.error('Failed to get profit analytics:', error);
            throw error;
        }
    }

    // 綜合分析
    static async getDashboardData(): Promise<ApiResponse<AnalyticsDashboardData>> {
        try {
            const response = await analyticsApi.get('/v1/dashboard');
            return response.data;
        } catch (error) {
            console.error('Failed to get analytics dashboard data:', error);
            throw error;
        }
    }

    static async getKpi(): Promise<ApiResponse<any>> {
        try {
            const response = await analyticsApi.get('/v1/kpi');
            return response.data;
        } catch (error) {
            console.error('Failed to get KPI data:', error);
            throw error;
        }
    }

    static async getReports(params: AnalyticsParams): Promise<ApiResponse<any>> {
        try {
            const response = await analyticsApi.get('/v1/reports', { params });
            return response.data;
        } catch (error) {
            console.error('Failed to get reports:', error);
            throw error;
        }
    }
}

export default AnalyticsService;
