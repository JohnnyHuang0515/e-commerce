import type { AxiosError } from 'axios';

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
}

export interface LogStats {
  summary: {
    totalLogs: number;
    errorLogs: number;
    warningLogs: number;
    errorRate: string;
  };
}

const isAxiosError = (error: unknown): error is AxiosError =>
  typeof error === 'object' && error !== null && 'isAxiosError' in error;

const MOCK_LOGS: LogEntry[] = [
  {
    id: 'log-001',
    level: 'info',
    type: 'system',
    service: 'inventory-service',
    message: '定期庫存同步完成',
    timestamp: '2024-03-07T09:00:00Z',
  },
  {
    id: 'log-002',
    level: 'warn',
    type: 'api_request',
    service: 'order-service',
    message: '訂單 #2307 API 延遲超出 2 秒',
    timestamp: '2024-03-07T08:52:00Z',
  },
  {
    id: 'log-003',
    level: 'error',
    type: 'system',
    service: 'payment-service',
    message: '支付服務回傳錯誤：連線逾時',
    timestamp: '2024-03-07T08:45:00Z',
  },
];

const buildMockResponse = (params: LogQueryParams = {}): Paginated<LogEntry> => {
  const { level, type, page = 1, limit = 10 } = params;
  let filtered = [...MOCK_LOGS];

  if (level) {
    filtered = filtered.filter((log) => log.level === level);
  }

  if (type) {
    filtered = filtered.filter((log) => log.type === type);
  }

  const start = (page - 1) * limit;
  const items = filtered.slice(start, start + limit);

  return {
    items,
    total: filtered.length,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(filtered.length / limit)),
  };
};

const buildMockStats = (logs: LogEntry[]): LogStats => {
  const totalLogs = logs.length;
  const errorLogs = logs.filter((log) => log.level === 'error').length;
  const warningLogs = logs.filter((log) => log.level === 'warn').length;

  return {
    summary: {
      totalLogs,
      errorLogs,
      warningLogs,
      errorRate: totalLogs === 0 ? '0%' : `${((errorLogs / totalLogs) * 100).toFixed(1)}%`,
    },
  };
};

export class LogService {
  static async getLogs(params: LogQueryParams = {}): Promise<ApiResponse<Paginated<LogEntry>>> {
    try {
      const response = await logApi.get('/v1/logs', { params });
      if (response.data?.success) {
        return response.data;
      }
    } catch (error) {
      if (!isAxiosError(error)) {
        console.error('載入日誌失敗:', error);
      }
    }

    return {
      success: true,
      data: buildMockResponse(params),
    };
  }

  static async getLogStats(): Promise<ApiResponse<LogStats>> {
    try {
      const response = await logApi.get('/v1/logs/stats');
      if (response.data?.success) {
        return response.data;
      }
    } catch (error) {
      if (!isAxiosError(error)) {
        console.error('載入日誌統計失敗:', error);
      }
    }

    return {
      success: true,
      data: buildMockStats(MOCK_LOGS),
    };
  }
}

export default LogService;
