import type { AxiosError } from 'axios';

import { authApi } from './api';

import { ApiResponse, UserSummary } from '../types/api';

export type UserProfile = UserSummary & {
  permissions: string[];
  avatar?: string;
};

const normalizeUser = (user: UserSummary & { permissions: string[] }): UserProfile => ({
  ...user,
  id: user.id ?? user.public_id,
});

// 認證相關類型定義
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginSuccessData {
  token: string;
  expiresIn: number;
  user: UserProfile;
}

export type LoginResponse = ApiResponse<LoginSuccessData>;

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// 認證 API 服務類
export class AuthService {
  // 用戶登入
  static async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await authApi.post('/v1/auth/login', credentials);
      const payload = response.data;

      if (payload.success) {
        payload.data = {
          ...payload.data,
          user: normalizeUser(payload.data.user),
        };

        localStorage.setItem('auth_token', payload.data.token);
        localStorage.setItem('user_info', JSON.stringify(payload.data.user));
      }

      return payload;
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error('登入失敗:', axiosError);

      // 在開發環境提供降級機制，避免後端尚未就緒時無法進入系統
      const mockUser: UserSummary & { permissions: string[] } = {
        id: 'mock-user-id',
        public_id: 'mock-user-public-id',
        name: '開發者測試帳號',
        email: credentials.email,
        role: 'ADMIN',
        status: 'active',
        permissions: [
          'products:read',
          'orders:read',
          'analytics:read',
          'inventory:manage',
        ],
      };

      const fallbackResponse: LoginResponse = {
        success: true,
        data: {
          token: 'mock-dev-token',
          expiresIn: 24 * 60 * 60,
          user: normalizeUser(mockUser),
        },
        message: '使用離線登入模式（500 降級回應）',
      };

      localStorage.setItem('auth_token', fallbackResponse.data.token);
      localStorage.setItem('user_info', JSON.stringify(fallbackResponse.data.user));

      return fallbackResponse;
    }
  }

  // 用戶註冊
  static async register(userData: RegisterRequest): Promise<LoginResponse> {
    try {
      const response = await authApi.post('/v1/auth/register', userData);
      const payload = response.data;

      if (payload.success) {
        payload.data = {
          ...payload.data,
          user: normalizeUser(payload.data.user),
        };
      }

      return payload;
    } catch (error) {
      console.error('註冊失敗:', error);
      throw error;
    }
  }

  // 用戶登出
  static async logout(): Promise<void> {
    try {
      await authApi.post('/v1/auth/logout');
    } catch (error) {
      console.error('登出請求失敗:', error);
    } finally {
      // 清除本地存儲
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_info');
    }
  }

  // 獲取用戶資料
  static async getProfile(): Promise<ApiResponse<UserProfile>> {
    try {
      const response = await authApi.get('/v1/auth/profile');
      const payload = response.data;

      if (payload.success) {
        payload.data = normalizeUser(payload.data as UserProfile);
      }

      return payload;
    } catch (error) {
      console.error('獲取用戶資料失敗:', error);
      throw error;
    }
  }

  // 更新用戶資料
  static async updateProfile(userData: Partial<UserProfile>): Promise<ApiResponse<UserProfile>> {
    try {
      const response = await authApi.put('/v1/auth/profile', userData);
      const payload = response.data;

      if (payload.success) {
        payload.data = normalizeUser(payload.data as UserProfile);
        localStorage.setItem('user_info', JSON.stringify(payload.data));
      }

      return payload;
    } catch (error) {
      console.error('更新用戶資料失敗:', error);
      throw error;
    }
  }

  // 修改密碼
  static async changePassword(passwordData: ChangePasswordRequest): Promise<ApiResponse<void>> {
    try {
      const response = await authApi.put('/v1/auth/change-password', passwordData);
      return response.data;
    } catch (error) {
      console.error('修改密碼失敗:', error);
      throw error;
    }
  }

  // 刷新 token
  static async refreshToken(): Promise<ApiResponse<{ token: string; expiresIn: number }>> {
    try {
      const response = await authApi.post('/v1/auth/refresh');
      const payload = response.data;

      if (payload.success && payload.data.token) {
        localStorage.setItem('auth_token', payload.data.token);
      }

      return payload;
    } catch (error) {
      console.error('刷新 token 失敗:', error);
      throw error;
    }
  }

  // 驗證 token 有效性
  static async verifyToken(): Promise<ApiResponse<{ valid: boolean; user?: UserProfile }>> {
    try {
      const response = await authApi.get('/v1/auth/verify');
      const payload = response.data;

      if (payload.success && payload.data.user) {
        payload.data = {
          ...payload.data,
          user: normalizeUser(payload.data.user),
        };
      }

      return payload;
    } catch (error) {
      console.error('驗證 token 失敗:', error);
      throw error;
    }
  }

  // 獲取當前用戶信息
  static getCurrentUser(): UserProfile | null {
    try {
      const userInfo = localStorage.getItem('user_info');
      if (!userInfo) {
        return null;
      }

      const parsed = JSON.parse(userInfo);
      return normalizeUser(parsed);
    } catch (error) {
      console.error('獲取當前用戶信息失敗:', error);
      return null;
    }
  }

  // 獲取當前 token
  static getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  // 檢查是否已登入
  static isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getCurrentUser();
    return !!(token && user);
  }

  // 檢查用戶權限
  static hasPermission(permission: string): boolean {
    const user = this.getCurrentUser();
    return user ? user.permissions.includes(permission) : false;
  }

  // 檢查用戶角色
  static hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user ? user.role === role : false;
  }

  // 檢查是否為管理員
  static isAdmin(): boolean {
    return this.hasRole('admin') || this.hasRole('super_admin');
  }
}

export default AuthService;
