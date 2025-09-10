import { dashboardApi, ApiResponse, PaginatedResponse } from './api';

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
  alerts: Array<Alert>;
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

export interface Widget {
  _id: string;
  title: string;
  type: 'line_chart' | 'bar_chart' | 'pie_chart' | 'metric_card' | 'table';
  config: {
    dataSource: string;
    period?: string;
    metrics: string[];
    filters?: Record<string, any>;
    options?: Record<string, any>;
  };
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  refreshInterval: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}


export interface Alert {
  _id: string;
  title: string;
  message: string;
  type: 'warning' | 'error' | 'info' | 'success';
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  status: 'active' | 'acknowledged' | 'resolved';
  createdAt: string;
  updatedAt: string;
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
  static async getOverview(period: string = 'month'): Promise<ApiResponse<OverviewData>> {
    try {
      const response = await dashboardApi.get('/overview', { params: { period } });
      return response.data;
    } catch (error) {
      console.error('獲取概覽數據失敗:', error);
      throw error;
    }
  }

  // 獲取詳細統計
  static async getStats(params?: { metrics: string }): Promise<ApiResponse<DashboardStats>> {
    try {
        const response = await dashboardApi.get('/stats', { params });
        return response.data;
    } catch (error) {
        console.error('獲取詳細統計失敗:', error);
        throw error;
    }
  }

  // 獲取摘要資料
  static async getSummary(): Promise<ApiResponse<any>> {
      try {
          const response = await dashboardApi.get('/summary');
          return response.data;
      } catch (error) {
          console.error('獲取摘要資料失敗:', error);
          throw error;
      }
  }

  // 獲取實時數據
  static async getRealtime(): Promise<ApiResponse<RealtimeData>> {
    try {
      const response = await dashboardApi.get('/realtime');
      return response.data;
    } catch (error) {
      console.error('獲取實時數據失敗:', error);
      throw error;
    }
  }

  // 獲取關鍵指標
  static async getMetrics(): Promise<ApiResponse<any>> {
      try {
          const response = await dashboardApi.get('/metrics');
          return response.data;
      } catch (error) {
          console.error('獲取關鍵指標失敗:', error);
          throw error;
      }
  }

  // 獲取趨勢資料
  static async getTrends(): Promise<ApiResponse<any>> {
      try {
          const response = await dashboardApi.get('/trends');
          return response.data;
      } catch (error) {
          console.error('獲取趨勢資料失敗:', error);
          throw error;
      }
  }

  // 警告系統
  static async getAlerts(params?: { type?: string, severity?: string, status?: string }): Promise<ApiResponse<PaginatedResponse<Alert>>> {
      try {
          const response = await dashboardApi.get('/alerts', { params });
          return response.data;
      } catch (error) {
          console.error('獲取警告列表失敗:', error);
          throw error;
      }
  }

  static async createAlert(alertData: Omit<Alert, '_id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Alert>> {
      try {
          const response = await dashboardApi.post('/alerts', alertData);
          return response.data;
      } catch (error) {
          console.error('建立新警告失敗:', error);
          throw error;
      }
  }

  static async updateAlert(id: string, alertData: Partial<Alert>): Promise<ApiResponse<Alert>> {
      try {
          const response = await dashboardApi.put(`/alerts/${id}`, alertData);
          return response.data;
      } catch (error) {
          console.error('更新警告失敗:', error);
          throw error;
      }
  }

  static async deleteAlert(id: string): Promise<ApiResponse<void>> {
      try {
          const response = await dashboardApi.delete(`/alerts/${id}`);
          return response.data;
      } catch (error) {
          console.error('刪除警告失敗:', error);
          throw error;
      }
  }

  static async acknowledgeAlert(id: string): Promise<ApiResponse<Alert>> {
      try {
          const response = await dashboardApi.put(`/alerts/${id}/acknowledge`);
          return response.data;
      } catch (error) {
          console.error('確認警告失敗:', error);
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
      const response = await dashboardApi.get('/analytics', { params });
      return response.data;
    } catch (error) {
      console.error('獲取分析數據失敗:', error);
      throw error;
    }
  }

  // 獲取系統設定
  static async getSettings(): Promise<ApiResponse<any>> {
    try {
      const response = await dashboardApi.get('/settings');
      return response.data;
    } catch (error) {
      console.error('獲取系統設定失敗:', error);
      throw error;
    }
  }

  // 小工具管理
  static async getWidgets(): Promise<ApiResponse<Widget[]>> {
    try {
      const response = await dashboardApi.get('/widgets');
      return response.data;
    } catch (error) {
      console.error('獲取小工具數據失敗:', error);
      throw error;
    }
  }

  static async createWidget(widgetData: Omit<Widget, '_id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Widget>> {
      try {
          const response = await dashboardApi.post('/widgets', widgetData);
          return response.data;
      } catch (error) {
          console.error('建立新小工具失敗:', error);
          throw error;
      }
  }

  static async updateWidget(id: string, widgetData: Partial<Widget>): Promise<ApiResponse<Widget>> {
      try {
          const response = await dashboardApi.put(`/widgets/${id}`, widgetData);
          return response.data;
      } catch (error) {
          console.error('更新小工具失敗:', error);
          throw error;
      }
  }

  static async deleteWidget(id: string): Promise<ApiResponse<void>> {
      try {
          const response = await dashboardApi.delete(`/widgets/${id}`);
          return response.data;
      } catch (error) {
          console.error('刪除小工具失敗:', error);
          throw error;
      }
  }

  static async getWidgetData(id: string): Promise<ApiResponse<any>> {
      try {
          const response = await dashboardApi.get(`/widgets/${id}/data`);
          return response.data;
      } catch (error) {
          console.error('獲取小工具資料失敗:', error);
          throw error;
      }
  }


  // 報告管理
  static async getReports(params?: any): Promise<ApiResponse<PaginatedResponse<ReportData>>> {
      try {
          const response = await dashboardApi.get('/reports', { params });
          return response.data;
      } catch (error) {
          console.error('獲取報告列表失敗:', error);
          throw error;
      }
  }

  static async createReport(data: {
    title: string;
    type: string;
    parameters: Record<string, any>;
  }): Promise<ApiResponse<ReportData>> {
    try {
      const response = await dashboardApi.post('/reports/generate', data);
      return response.data;
    } catch (error) {
      console.error('創建報告失敗:', error);
      throw error;
    }
  }

  static async getReport(reportId: string): Promise<ApiResponse<ReportData>> {
    try {
      const response = await dashboardApi.get(`/reports/${reportId}`);
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
