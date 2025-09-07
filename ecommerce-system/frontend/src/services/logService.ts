import { ApiResponse } from './api';

// 日誌相關接口定義
export interface LogEntry {
  id: number;
  level: 'error' | 'warn' | 'info' | 'debug' | 'trace';
  type: 'system' | 'user_action' | 'api_request' | 'database' | 'security' | 'performance' | 'business';
  message: string;
  service: string;
  serviceVersion?: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url?: string;
  statusCode?: number;
  responseTime?: number;
  error?: {
    name?: string;
    message?: string;
    stack?: string;
    code?: string;
  };
  metadata?: Record<string, any>;
  tags?: string[];
  ip?: string;
  userAgent?: string;
  orderId?: string;
  productId?: string;
  customerId?: string;
  timestamp: string;
  date: string;
  hour: number;
  createdAt: string;
  updatedAt: string;
}

export interface LogQueryParams {
  page?: number;
  limit?: number;
  service?: string;
  level?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  userId?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface LogStats {
  summary: {
    totalLogs: number;
    errorLogs: number;
    warningLogs: number;
    errorRate: string;
  };
  serviceStats: Array<{
    _id: string;
    count: number;
    errors: number;
    warnings: number;
  }>;
  levelStats: Array<{
    _id: string;
    count: number;
  }>;
  hourlyStats: Array<{
    _id: number;
    count: number;
    errors: number;
  }>;
  dateRange: {
    start: string;
    end: string;
  };
}

export interface LogResponse {
  success: boolean;
  data: LogEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  message: string;
}

export interface LogStatsResponse {
  success: boolean;
  data: LogStats;
  message: string;
}

// Log Service 類
export class LogService {
  private baseUrl = 'http://localhost:3018/api/v1';

  // 創建日誌
  async createLog(logData: Partial<LogEntry>): Promise<ApiResponse<LogEntry>> {
    try {
      const response = await fetch(`${this.baseUrl}/logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(logData),
      });

      if (!response.ok) {
        throw new Error(`創建日誌失敗: ${response.status}`);
      }

      const result: ApiResponse<LogEntry> = await response.json();
      return result;
    } catch (error) {
      console.error('創建日誌錯誤:', error);
      throw error;
    }
  }

  // 查詢日誌
  async getLogs(params: LogQueryParams = {}): Promise<LogResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });

      const response = await fetch(`${this.baseUrl}/logs?${queryParams}`);
      
      if (!response.ok) {
        throw new Error(`查詢日誌失敗: ${response.status}`);
      }

      const result: LogResponse = await response.json();
      return result;
    } catch (error) {
      console.error('查詢日誌錯誤:', error);
      throw error;
    }
  }

  // 獲取單一日誌
  async getLogById(id: number): Promise<ApiResponse<LogEntry>> {
    try {
      const response = await fetch(`${this.baseUrl}/logs/${id}`);
      
      if (!response.ok) {
        throw new Error(`獲取日誌失敗: ${response.status}`);
      }

      const result: ApiResponse<LogEntry> = await response.json();
      return result;
    } catch (error) {
      console.error('獲取日誌錯誤:', error);
      throw error;
    }
  }

  // 刪除日誌
  async deleteLog(id: number): Promise<ApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/logs/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`刪除日誌失敗: ${response.status}`);
      }

      const result: ApiResponse = await response.json();
      return result;
    } catch (error) {
      console.error('刪除日誌錯誤:', error);
      throw error;
    }
  }

  // 獲取日誌統計
  async getLogStats(startDate?: string, endDate?: string): Promise<LogStatsResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);

      const response = await fetch(`${this.baseUrl}/logs/stats?${queryParams}`);
      
      if (!response.ok) {
        throw new Error(`獲取日誌統計失敗: ${response.status}`);
      }

      const result: LogStatsResponse = await response.json();
      return result;
    } catch (error) {
      console.error('獲取日誌統計錯誤:', error);
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

  // 批量創建日誌
  async createBatchLogs(logs: Partial<LogEntry>[]): Promise<ApiResponse<LogEntry[]>> {
    try {
      const response = await fetch(`${this.baseUrl}/logs/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ logs }),
      });

      if (!response.ok) {
        throw new Error(`批量創建日誌失敗: ${response.status}`);
      }

      const result: ApiResponse<LogEntry[]> = await response.json();
      return result;
    } catch (error) {
      console.error('批量創建日誌錯誤:', error);
      throw error;
    }
  }
}

// 導出服務實例
export const logService = new LogService();
