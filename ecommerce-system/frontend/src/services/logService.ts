import { logApi, ApiResponse, PaginatedResponse } from './api';

// 日誌相關接口定義
export interface LogEntry {
  id: number;
  level: 'error' | 'warn' | 'info' | 'debug' | 'trace';
  type: 'system' | 'user_action' | 'api_request' | 'database' | 'security' | 'performance' | 'business';
  message: string;
  service: string;
  userId?: string;
  requestId?: string;
  error?: {
    name?: string;
    message?: string;
    stack?: string;
  };
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface LogQueryParams {
  page?: number;
  limit?: number;
  level?: string;
  type?: string;
  service?: string;
  userId?: string;
  requestId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
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
  serviceStats: Array<{ service: string; count: number; errors: number }>;
  levelStats: Array<{ level: string; count: number }>;
  hourlyStats: Array<{ hour: number; count: number; errors: number }>;
}


// Log Service 類
export class LogService {

  // 創建日誌
  static async createLog(logData: Partial<LogEntry>): Promise<ApiResponse<void>> {
    const response = await logApi.post('/v1/logs', logData);
    return response.data;
  }

  // 批量創建日誌
  static async createBatchLogs(logs: Partial<LogEntry>[]): Promise<ApiResponse<void>> {
    const response = await logApi.post('/v1/logs/batch', { logs });
    return response.data;
  }

  // 查詢日誌
  static async getLogs(params: LogQueryParams = {}): Promise<ApiResponse<PaginatedResponse<LogEntry>>> {
    const response = await logApi.get('/v1/logs', { params });
    return response.data;
  }

  // 獲取日誌統計
  static async getLogStats(params?: { startDate?: string, endDate?: string }): Promise<ApiResponse<LogStats>> {
    const response = await logApi.get('/v1/logs/stats', { params });
    return response.data;
  }

  // 清理舊日誌
  static async cleanupLogs(days: number): Promise<ApiResponse<void>> {
      const response = await logApi.post('/v1/logs/cleanup', { days });
      return response.data;
  }

  // 導出日誌
  static async exportLogs(params: LogQueryParams = {}): Promise<ApiResponse<void>> {
    const response = await logApi.post('/v1/logs/export', params);
    return response.data;
  }
}

export default LogService;
