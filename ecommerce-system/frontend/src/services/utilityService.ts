import { utilityApi, ApiResponse } from './api';

// 檔案相關接口
export interface FileInfo {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  url: string;
  category: 'images' | 'documents' | 'archives' | 'data' | 'other';
  uploadedBy: string;
  uploadedByType: 'user' | 'admin' | 'system';
  tags: string[];
  isPublic: boolean;
  downloadCount: number;
  createdAt: string;
  updatedAt: string;
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
  category?: string;
  uploadedBy?: string;
  uploadedByType?: string;
  tags?: string;
  isPublic?: boolean;
  startDate?: string;
  endDate?: string;
}

export interface FilePagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// 備份相關接口
export interface BackupInfo {
  id: string;
  name: string;
  description?: string;
  type: 'manual' | 'scheduled' | 'automatic';
  status: 'pending' | 'running' | 'completed' | 'failed';
  source: string;
  destination: string;
  size?: number;
  fileCount?: number;
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
  startedAt?: string;
  completedAt?: string;
  duration?: number;
  createdBy: string;
  createdByType: 'user' | 'admin' | 'system';
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface BackupRequest {
  name: string;
  description?: string;
  type?: 'manual' | 'scheduled' | 'automatic';
  source?: string;
  destination?: string;
  createdBy: string;
  createdByType?: 'user' | 'admin' | 'system';
}

export interface BackupFilter {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
  createdBy?: string;
  createdByType?: string;
  startDate?: string;
  endDate?: string;
}

// 還原相關接口
export interface RestoreInfo {
  id: string;
  backupId: string;
  name: string;
  description?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  source: string;
  destination: string;
  startedAt?: string;
  completedAt?: string;
  duration?: number;
  createdBy: string;
  createdByType: 'user' | 'admin' | 'system';
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface RestoreRequest {
  backupId: string;
  name: string;
  description?: string;
  destination?: string;
  createdBy: string;
  createdByType?: 'user' | 'admin' | 'system';
}

export interface RestoreFilter {
  page?: number;
  limit?: number;
  status?: string;
  backupId?: string;
  createdBy?: string;
  createdByType?: string;
  startDate?: string;
  endDate?: string;
}

// 系統統計接口
export interface SystemStats {
  totalFiles: number;
  totalSize: number;
  totalBackups: number;
  totalRestores: number;
  byCategory: {
    images: number;
    documents: number;
    archives: number;
    data: number;
    other: number;
  };
  byStatus: {
    backups: {
      completed: number;
      failed: number;
      running: number;
    };
    restores: {
      completed: number;
      failed: number;
      running: number;
    };
  };
  dateRange: {
    start: string;
    end: string;
  };
}

// 工具服務類
export class UtilityService {
  // 檔案管理
  static async uploadFiles(files: File[], request: FileUploadRequest): Promise<ApiResponse<FileInfo[]>> {
    const formData = new FormData();
    
    files.forEach((file, index) => {
      formData.append('files', file);
    });
    
    formData.append('uploadedBy', request.uploadedBy);
    formData.append('uploadedByType', request.uploadedByType || 'user');
    formData.append('tags', JSON.stringify(request.tags || []));
    formData.append('isPublic', String(request.isPublic || false));

    const response = await utilityApi.post('/utility/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  }

  static async getFiles(filter: FileFilter = {}): Promise<ApiResponse<{ data: FileInfo[]; pagination: FilePagination }>> {
    const params = new URLSearchParams();
    
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });

    const response = await utilityApi.get(`/utility/files?${params.toString()}`);
    return response.data;
  }

  static async getFile(id: string): Promise<ApiResponse<FileInfo>> {
    const response = await utilityApi.get(`/utility/files/${id}`);
    return response.data;
  }

  static async downloadFile(id: string): Promise<ApiResponse<{ filename: string; url: string; downloadCount: number }>> {
    const response = await utilityApi.get(`/utility/files/${id}/download`);
    return response.data;
  }

  static async deleteFile(id: string): Promise<ApiResponse<void>> {
    const response = await utilityApi.delete(`/utility/files/${id}`);
    return response.data;
  }

  // 備份管理
  static async createBackup(request: BackupRequest): Promise<ApiResponse<BackupInfo>> {
    const response = await utilityApi.post('/utility/backups', request);
    return response.data;
  }

  static async getBackups(filter: BackupFilter = {}): Promise<ApiResponse<{ data: BackupInfo[]; pagination: FilePagination }>> {
    const params = new URLSearchParams();
    
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });

    const response = await utilityApi.get(`/utility/backups?${params.toString()}`);
    return response.data;
  }

  // 還原管理
  static async createRestore(request: RestoreRequest): Promise<ApiResponse<RestoreInfo>> {
    const response = await utilityApi.post('/utility/restores', request);
    return response.data;
  }

  static async getRestores(filter: RestoreFilter = {}): Promise<ApiResponse<{ data: RestoreInfo[]; pagination: FilePagination }>> {
    const params = new URLSearchParams();
    
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });

    const response = await utilityApi.get(`/utility/restores?${params.toString()}`);
    return response.data;
  }

  // 系統統計
  static async getSystemStats(startDate?: string, endDate?: string): Promise<ApiResponse<SystemStats>> {
    const params = new URLSearchParams();
    
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await utilityApi.get(`/utility/stats?${params.toString()}`);
    return response.data;
  }

  // CSV匯出
  static async exportToCSV(type: 'files' | 'backups' | 'restores', startDate?: string, endDate?: string): Promise<Blob> {
    const params = new URLSearchParams();
    params.append('type', type);
    
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await utilityApi.get(`/utility/export/csv?${params.toString()}`, {
      responseType: 'blob',
    });
    
    return response.data;
  }

  // 健康檢查
  static async checkHealth(): Promise<ApiResponse<any>> {
    const response = await utilityApi.get('/health');
    return response.data;
  }

  // 工具函數
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  static formatDuration(milliseconds: number): string {
    if (milliseconds < 1000) return `${milliseconds}ms`;
    
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  static getFileCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      images: '🖼️',
      documents: '📄',
      archives: '📦',
      data: '📊',
      other: '📁',
    };
    
    return icons[category] || '📁';
  }

  static getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      pending: 'orange',
      running: 'blue',
      completed: 'green',
      failed: 'red',
    };
    
    return colors[status] || 'default';
  }
}

export default UtilityService;
