import { authApi, ApiResponse } from './api';

// 認證相關類型定義
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    permissions: string[];
  };
  expiresIn: number;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// 認證 API 服務類
export class AuthService {
  // 用戶登入
  static async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    try {
      const response = await authApi.post('/v1/auth/login', credentials);
      return response.data;
    } catch (error) {
      console.error('登入失敗:', error);
      throw error;
    }
  }

  // 用戶註冊
  static async register(userData: RegisterRequest): Promise<ApiResponse<LoginResponse>> {
    try {
      const response = await authApi.post('/v1/auth/register', userData);
      return response.data;
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
      return response.data;
    } catch (error) {
      console.error('獲取用戶資料失敗:', error);
      throw error;
    }
  }

  // 更新用戶資料
  static async updateProfile(userData: Partial<UserProfile>): Promise<ApiResponse<UserProfile>> {
    try {
      const response = await authApi.put('/v1/auth/profile', userData);
      return response.data;
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
      
      if (response.data.success && response.data.data.token) {
        localStorage.setItem('auth_token', response.data.data.token);
      }
      
      return response.data;
    } catch (error) {
      console.error('刷新 token 失敗:', error);
      throw error;
    }
  }

  // 驗證 token 有效性
  static async verifyToken(): Promise<ApiResponse<{ valid: boolean; user?: UserProfile }>> {
    try {
      const response = await authApi.get('/v1/auth/verify');
      return response.data;
    } catch (error) {
      console.error('驗證 token 失敗:', error);
      throw error;
    }
  }

  // 獲取當前用戶信息
  static getCurrentUser(): UserProfile | null {
    try {
      const userInfo = localStorage.getItem('user_info');
      return userInfo ? JSON.parse(userInfo) : null;
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
