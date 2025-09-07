import { dashboardApi, ApiResponse } from './api';

// Dashboard 數據類型定義
export interface DashboardStats {
  totalSales: number;
  totalOrders: number;
  totalUsers: number;
  totalProducts: number;
  averageOrderValue: number;
  conversionRate: number;
  salesGrowth: number;
  ordersGrowth: number;
  usersGrowth: number;
}

export interface OverviewData {
  summary: {
    totalSales: number;
    totalOrders: number;
    totalUsers: number;
    totalProducts: number;
    averageOrderValue: number;
    conversionRate: number;
  };
  periodData: Array<{
    date: string;
    sales: number;
    orders: number;
    users: number;
  }>;
  growth: {
    salesGrowth: number;
    ordersGrowth: number;
    usersGrowth: number;
  };
  alerts: Array<{
    id: string;
    type: 'info' | 'warning' | 'error';
    title: string;
    message: string;
    timestamp: string;
  }>;
  systemStatus: {
    services: Array<{
      name: string;
      status: 'healthy' | 'warning' | 'error';
      responseTime: number;
      lastCheck: string;
      data?: any;
    }>;
  };
}

export interface RealtimeData {
  activeUsers: number;
  currentOrders: number;
  systemLoad: {
    cpu: number;
    memory: number;
    disk: number;
  };
  recentActivities: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
    user?: string;
  }>;
}

export interface AnalyticsData {
  sales: {
    total: number;
    trend: number;
    chartData: Array<{
      date: string;
      value: number;
    }>;
  };
  orders: {
    total: number;
    trend: number;
    chartData: Array<{
      date: string;
      value: number;
    }>;
  };
  users: {
    total: number;
    trend: number;
    chartData: Array<{
      date: string;
      value: number;
    }>;
  };
  products: {
    total: number;
    trend: number;
    chartData: Array<{
      date: string;
      value: number;
    }>;
  };
}

export interface WidgetData {
  id: string;
  title: string;
  type: 'chart' | 'table' | 'metric' | 'list';
  dataSource: string;
  config: {
    dataSource: string;
    options: Record<string, any>;
  };
  data: any;
  lastUpdated: string;
}

export interface ReportData {
  id: string;
  title: string;
  type: string;
  parameters: Record<string, any>;
  data: any;
  generatedAt: string;
  status: 'pending' | 'completed' | 'failed';
}

// Dashboard API 服務類
export class DashboardService {
  // 獲取概覽數據
  static async getOverview(): Promise<ApiResponse<OverviewData>> {
    try {
      const response = await dashboardApi.get('/dashboard/overview');
      return response.data;
    } catch (error) {
      console.error('獲取概覽數據失敗:', error);
      throw error;
    }
  }

  // 獲取實時數據
  static async getRealtime(): Promise<ApiResponse<RealtimeData>> {
    try {
      const response = await dashboardApi.get('/dashboard/realtime');
      return response.data;
    } catch (error) {
      console.error('獲取實時數據失敗:', error);
      throw error;
    }
  }

  // 獲取分析數據
  static async getAnalytics(type: string = 'sales', period?: string): Promise<ApiResponse<AnalyticsData>> {
    try {
      const params: Record<string, string> = { type };
      if (period) {
        params.period = period;
      }
      const response = await dashboardApi.get('/dashboard/analytics', { params });
      return response.data;
    } catch (error) {
      console.error('獲取分析數據失敗:', error);
      throw error;
    }
  }

  // 獲取系統設定
  static async getSettings(): Promise<ApiResponse<any>> {
    try {
      const response = await dashboardApi.get('/dashboard/settings');
      return response.data;
    } catch (error) {
      console.error('獲取系統設定失敗:', error);
      throw error;
    }
  }

  // 獲取小工具數據
  static async getWidgets(): Promise<ApiResponse<WidgetData[]>> {
    try {
      const response = await dashboardApi.get('/dashboard/widgets');
      return response.data;
    } catch (error) {
      console.error('獲取小工具數據失敗:', error);
      throw error;
    }
  }

  // 創建報告
  static async createReport(data: {
    title: string;
    type: string;
    parameters: Record<string, any>;
  }): Promise<ApiResponse<ReportData>> {
    try {
      const response = await dashboardApi.post('/dashboard/reports', data);
      return response.data;
    } catch (error) {
      console.error('創建報告失敗:', error);
      throw error;
    }
  }

  // 獲取報告
  static async getReport(reportId: string): Promise<ApiResponse<ReportData>> {
    try {
      const response = await dashboardApi.get(`/dashboard/reports/${reportId}`);
      return response.data;
    } catch (error) {
      console.error('獲取報告失敗:', error);
      throw error;
    }
  }

  // 獲取系統健康狀態
  static async getSystemHealth(): Promise<ApiResponse<any>> {
    try {
      const response = await dashboardApi.get('/health');
      return response.data;
    } catch (error) {
      console.error('獲取系統健康狀態失敗:', error);
      throw error;
    }
  }
}

export default DashboardService;
