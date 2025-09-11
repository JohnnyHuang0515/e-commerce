import { utilityApi, ApiResponse, PaginatedResponse } from './api';

// 檔案相關接口
export interface FileInfo {
  id: string;
  filename: string;
  url: string;
  size: number;
  uploadedBy: string;
  createdAt: string;
}

export interface FileUploadRequest {
  uploadedBy: string;
  uploadedByType?: 'user' | 'admin' | 'system';
  tags?: string[];
  isPublic?: boolean;
}

export interface FileFilter {
  page?: number;
  limit?: number;
  category?: 'images' | 'documents' | 'archives' | 'data' | 'other';
  uploadedBy?: string;
  tags?: string;
  isPublic?: boolean;
  startDate?: string;
  endDate?: string;
}

// 備份相關接口
export interface BackupInfo {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  size?: number;
  completedAt?: string;
}

export interface BackupRequest {
  name: string;
  description?: string;
  source?: string;
  createdBy: string;
}

export interface BackupFilter {
  page?: number;
  limit?: number;
  status?: 'pending' | 'running' | 'completed' | 'failed';
  type?: 'manual' | 'scheduled' | 'automatic';
  createdBy?: string;
  startDate?: string;
  endDate?: string;
}

// 還原相關接口
export interface RestoreInfo {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  completedAt?: string;
}

export interface RestoreRequest {
  backupId: string;
  name: string;
  description?: string;
  destination?: string;
  createdBy: string;
}

// 系統統計接口
export interface SystemStats {
  totalFiles: number;
  totalSize: number;
  totalBackups: number;
  totalRestores: number;
  byCategory: Record<string, number>;
  backupStatus: Record<string, number>;
}


// 工具服務類
export class UtilityService {
  // 檔案管理
  static async uploadFiles(files: File[], request: FileUploadRequest): Promise<ApiResponse<{ files: FileInfo[] }>> {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    formData.append('uploadedBy', request.uploadedBy);
    if(request.uploadedByType) formData.append('uploadedByType', request.uploadedByType);
    if(request.tags) formData.append('tags', request.tags.join(','));
    if(request.isPublic) formData.append('isPublic', String(request.isPublic));

    const response = await utilityApi.post('/v1/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  static async getFiles(filter: FileFilter = {}): Promise<ApiResponse<PaginatedResponse<FileInfo>>> {
    const response = await utilityApi.get('/v1/files', { params: filter });
    return response.data;
  }

  static async downloadFile(fileId: string): Promise<Blob> {
    const response = await utilityApi.get(`/v1/files/${fileId}/download`, { responseType: 'blob' });
    return response.data;
  }

  static async deleteFile(fileId: string): Promise<ApiResponse<void>> {
      const response = await utilityApi.delete(`/v1/files/${fileId}`);
      return response.data;
  }

  // 備份管理
  static async createBackup(request: BackupRequest): Promise<ApiResponse<{ backup: BackupInfo }>> {
    const response = await utilityApi.post('/v1/backups', request);
    return response.data;
  }

  static async getBackups(filter: BackupFilter = {}): Promise<ApiResponse<PaginatedResponse<BackupInfo>>> {
    const response = await utilityApi.get('/v1/backups', { params: filter });
    return response.data;
  }

  // 還原管理
  static async createRestore(request: RestoreRequest): Promise<ApiResponse<{ restore: RestoreInfo }>> {
    const response = await utilityApi.post('/v1/restores', request);
    return response.data;
  }

  static async getRestores(filter: { page?: number, limit?: number } = {}): Promise<ApiResponse<PaginatedResponse<RestoreInfo>>> {
      const response = await utilityApi.get('/v1/restores', { params: filter });
      return response.data;
  }

  // 系統統計
  static async getSystemStats(params?: { startDate?: string, endDate?: string }): Promise<ApiResponse<SystemStats>> {
    const response = await utilityApi.get('/v1/stats', { params });
    return response.data;
  }

  // CSV匯出
  static async exportToCSV(type: 'files' | 'backups' | 'restores', params?: { startDate?: string, endDate?: string }): Promise<Blob> {
    const response = await utilityApi.get(`/v1/export/csv`, { params: { type, ...params }, responseType: 'blob' });
    return response.data;
  }
}

export default UtilityService;
