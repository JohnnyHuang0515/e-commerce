import { userApi, ApiResponse, PaginatedResponse } from './api';

// 用戶相關類型定義
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  role: 'admin' | 'user' | 'moderator';
  status: 'active' | 'inactive' | 'suspended';
  permissions: string[];
  profile: {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    gender?: 'male' | 'female' | 'other';
    address?: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
  };
  preferences: {
    language: string;
    timezone: string;
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
  };
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserCreateRequest {
  email: string;
  name: string;
  password: string;
  phone?: string;
  role?: 'admin' | 'user' | 'moderator';
  status?: 'active' | 'inactive' | 'suspended';
  permissions?: string[];
  profile?: Partial<User['profile']>;
}

export interface UserUpdateRequest extends Partial<UserCreateRequest> {
  id: string;
}

export interface UserSearchParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  suspended: number;
  newThisMonth: number;
  newThisWeek: number;
  onlineNow: number;
}

export interface UserActivity {
  id: string;
  userId: string;
  action: string;
  description: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

// 用戶 API 服務類
export class UserService {
  // 獲取用戶列表
  static async getUsers(params?: UserSearchParams): Promise<ApiResponse<PaginatedResponse<User>>> {
    try {
      const response = await userApi.get('/users', { params });
      return response.data;
    } catch (error) {
      console.error('獲取用戶列表失敗:', error);
      throw error;
    }
  }

  // 獲取用戶詳情
  static async getUser(userId: string): Promise<ApiResponse<User>> {
    try {
      const response = await userApi.get(`/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('獲取用戶詳情失敗:', error);
      throw error;
    }
  }

  // 創建用戶
  static async createUser(userData: UserCreateRequest): Promise<ApiResponse<User>> {
    try {
      const response = await userApi.post('/users', userData);
      return response.data;
    } catch (error) {
      console.error('創建用戶失敗:', error);
      throw error;
    }
  }

  // 更新用戶
  static async updateUser(userData: UserUpdateRequest): Promise<ApiResponse<User>> {
    try {
      const { id, ...updateData } = userData;
      const response = await userApi.put(`/users/${id}`, updateData);
      return response.data;
    } catch (error) {
      console.error('更新用戶失敗:', error);
      throw error;
    }
  }

  // 刪除用戶
  static async deleteUser(userId: string): Promise<ApiResponse<void>> {
    try {
      const response = await userApi.delete(`/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('刪除用戶失敗:', error);
      throw error;
    }
  }

  // 批量刪除用戶
  static async deleteUsers(userIds: string[]): Promise<ApiResponse<void>> {
    try {
      const response = await userApi.delete('/users/batch', {
        data: { ids: userIds }
      });
      return response.data;
    } catch (error) {
      console.error('批量刪除用戶失敗:', error);
      throw error;
    }
  }

  // 更新用戶狀態
  static async updateUserStatus(userId: string, status: string): Promise<ApiResponse<User>> {
    try {
      const response = await userApi.put(`/users/${userId}/status`, { status });
      return response.data;
    } catch (error) {
      console.error('更新用戶狀態失敗:', error);
      throw error;
    }
  }

  // 更新用戶角色
  static async updateUserRole(userId: string, role: string, permissions?: string[]): Promise<ApiResponse<User>> {
    try {
      const response = await userApi.put(`/users/${userId}/role`, { role, permissions });
      return response.data;
    } catch (error) {
      console.error('更新用戶角色失敗:', error);
      throw error;
    }
  }

  // 重置用戶密碼
  static async resetUserPassword(userId: string, newPassword: string): Promise<ApiResponse<void>> {
    try {
      const response = await userApi.put(`/users/${userId}/reset-password`, { newPassword });
      return response.data;
    } catch (error) {
      console.error('重置用戶密碼失敗:', error);
      throw error;
    }
  }

  // 獲取用戶統計
  static async getUserStats(): Promise<ApiResponse<UserStats>> {
    try {
      const response = await userApi.get('/users/stats');
      return response.data;
    } catch (error) {
      console.error('獲取用戶統計失敗:', error);
      throw error;
    }
  }

  // 獲取用戶活動記錄
  static async getUserActivities(userId: string, params?: {
    page?: number;
    limit?: number;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<ApiResponse<PaginatedResponse<UserActivity>>> {
    try {
      const response = await userApi.get(`/users/${userId}/activities`, { params });
      return response.data;
    } catch (error) {
      console.error('獲取用戶活動記錄失敗:', error);
      throw error;
    }
  }

  // 獲取用戶概覽
  static async getUserOverview(): Promise<ApiResponse<{
    recentUsers: User[];
    newUsersToday: number;
    activeUsersToday: number;
    userGrowth: Array<{
      date: string;
      newUsers: number;
      activeUsers: number;
    }>;
  }>> {
    try {
      const response = await userApi.get('/users/overview');
      return response.data;
    } catch (error) {
      console.error('獲取用戶概覽失敗:', error);
      throw error;
    }
  }

  // 上傳用戶頭像
  static async uploadUserAvatar(userId: string, file: File): Promise<ApiResponse<{ url: string }>> {
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      
      const response = await userApi.post(`/users/${userId}/avatar`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('上傳用戶頭像失敗:', error);
      throw error;
    }
  }

  // 導出用戶
  static async exportUsers(params?: UserSearchParams): Promise<Blob> {
    try {
      const response = await userApi.get('/users/export', {
        params,
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('導出用戶失敗:', error);
      throw error;
    }
  }

  // 批量更新用戶狀態
  static async batchUpdateStatus(userIds: string[], status: string): Promise<ApiResponse<void>> {
    try {
      const response = await userApi.put('/users/batch-status', {
        userIds,
        status
      });
      return response.data;
    } catch (error) {
      console.error('批量更新用戶狀態失敗:', error);
      throw error;
    }
  }
}

export default UserService;
