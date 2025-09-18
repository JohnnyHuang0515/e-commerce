import { logApi } from './api';
import type { ApiResponse, Paginated } from '../types/api';

export interface LogEntry {
  id: string;
  level: 'error' | 'warn' | 'info' | 'debug';
  type: 'system' | 'user_action' | 'api_request';
  service: string;
  message: string;
  timestamp: string;
}

export interface LogQueryParams {
  page?: number;
  limit?: number;
  level?: string;
  type?: string;
  search?: string;
}

export interface LogStats {
  summary: {
    totalLogs: number;
    errorLogs: number;
    warningLogs: number;
    errorRate: string;
  };
}

const normalizeLog = (log: LogEntry): LogEntry => ({
  ...log,
  level: log.level,
  type: log.type,
  service: log.service,
  message: log.message,
  timestamp: log.timestamp,
});

export class LogService {
  static async getLogs(params: LogQueryParams = {}): Promise<ApiResponse<Paginated<LogEntry>>> {
    const response = await logApi.get('/v1/logs', { params });
    return {
      ...response.data,
      data: {
        ...response.data.data,
        items: response.data.data.items.map(normalizeLog),
      },
    };
  }

  static async getLogStats(): Promise<ApiResponse<LogStats>> {
    const response = await logApi.get('/v1/logs/stats');
    return response.data;
  }
}

export default LogService;
