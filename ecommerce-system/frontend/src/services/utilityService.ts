import { utilityApi } from './api';
import type { ApiResponse } from '../types/api';

export interface SystemUtilityStats {
  backups: number;
  files: number;
  logs: number;
  lastBackupAt: string | null;
}

export interface MaintenanceTask {
  id: string;
  name: string;
  description: string;
  lastRunAt: string;
  status: string;
}

export class UtilityService {
  static async getStats(): Promise<ApiResponse<SystemUtilityStats>> {
    const response = await utilityApi.get('/v1/utility/stats');
    return response.data;
  }

  static async getMaintenanceTasks(): Promise<ApiResponse<MaintenanceTask[]>> {
    const response = await utilityApi.get('/v1/utility/tasks');
    return response.data;
  }
}

export default UtilityService;
