import type { ApiResponse } from '../types/api';

export interface SystemUtilityStats {
  backups: number;
  files: number;
  logs: number;
  lastBackupAt: string;
}

export interface MaintenanceTask {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed';
  lastRunAt: string;
  description: string;
}

const MOCK_STATS: SystemUtilityStats = {
  backups: 12,
  files: 48,
  logs: 5,
  lastBackupAt: '2024-03-05T22:15:00Z',
};

const MOCK_TASKS: MaintenanceTask[] = [
  {
    id: 'task-001',
    name: '資料庫備份',
    status: 'completed',
    lastRunAt: '2024-03-05T22:15:00Z',
    description: '每晚 22:00 自動備份 PostgreSQL 資料庫。',
  },
  {
    id: 'task-002',
    name: '檔案清理',
    status: 'pending',
    lastRunAt: '2024-03-04T03:00:00Z',
    description: '清理暫存檔案與過期的報表匯出檔。',
  },
];

export class UtilityService {
  static async getStats(): Promise<ApiResponse<SystemUtilityStats>> {
    return {
      success: true,
      data: MOCK_STATS,
    };
  }

  static async getMaintenanceTasks(): Promise<ApiResponse<MaintenanceTask[]>> {
    return {
      success: true,
      data: MOCK_TASKS,
    };
  }
}

export default UtilityService;
