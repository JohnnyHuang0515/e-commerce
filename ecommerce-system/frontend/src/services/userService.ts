import type { AxiosError } from 'axios';

import { userApi } from './api';
import type { ApiResponse, Paginated } from '../types/api';

export type UserStatus = 'active' | 'inactive' | 'suspended';
export type UserRole = 'admin' | 'manager' | 'staff' | 'member';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  phone?: string;
  city?: string;
  createdAt: string;
  lastLoginAt?: string;
  permissions?: string[];
}

export interface UserListParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
  status?: UserStatus;
}

export type UserListResponse = Paginated<UserRecord>;

export interface UserStats {
  total: number;
  active: number;
  suspended: number;
  newThisMonth: number;
}

const isAxiosError = (error: unknown): error is AxiosError =>
  typeof error === 'object' && error !== null && 'isAxiosError' in error;

const MOCK_USERS: UserRecord[] = [
  {
    id: 'user-001',
    name: '王小明',
    email: 'user1@example.com',
    role: 'admin',
    status: 'active',
    phone: '+886912345678',
    city: '臺北市',
    createdAt: '2024-01-15T09:00:00Z',
    lastLoginAt: '2024-03-07T08:15:00Z',
    permissions: ['products:read', 'orders:read', 'analytics:read'],
  },
  {
    id: 'user-002',
    name: '陳佳',
    email: 'user2@example.com',
    role: 'manager',
    status: 'active',
    phone: '+886923456789',
    city: '新北市',
    createdAt: '2024-02-03T10:30:00Z',
    lastLoginAt: '2024-03-06T19:05:00Z',
    permissions: ['orders:read', 'orders:write', 'analytics:read'],
  },
  {
    id: 'user-003',
    name: '林宥',
    email: 'user3@example.com',
    role: 'staff',
    status: 'suspended',
    phone: '+886934567890',
    city: '桃園市',
    createdAt: '2023-12-11T13:45:00Z',
    permissions: ['products:read'],
  },
];

const buildMockResponse = (params: UserListParams = {}): UserListResponse => {
  const { role, status, search, page = 1, limit = 10 } = params;
  let filtered = [...MOCK_USERS];

  if (role) {
    filtered = filtered.filter((user) => user.role === role);
  }

  if (status) {
    filtered = filtered.filter((user) => user.status === status);
  }

  if (search) {
    const keyword = search.toLowerCase();
    filtered = filtered.filter(
      (user) => user.name.toLowerCase().includes(keyword) || user.email.toLowerCase().includes(keyword)
    );
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

const buildMockStats = (users: UserRecord[]): UserStats => ({
  total: users.length,
  active: users.filter((user) => user.status === 'active').length,
  suspended: users.filter((user) => user.status === 'suspended').length,
  newThisMonth: users.filter((user) => new Date(user.createdAt).getMonth() === new Date().getMonth()).length,
});

export class UserService {
  static async getUsers(params: UserListParams = {}): Promise<ApiResponse<UserListResponse>> {
    try {
      const response = await userApi.get('/v1/users', { params });
      if (response.data?.success) {
        return response.data;
      }
    } catch (error) {
      if (!isAxiosError(error)) {
        console.error('載入用戶列表失敗:', error);
      }
    }

    return {
      success: true,
      data: buildMockResponse(params),
    };
  }

  static async getStats(): Promise<ApiResponse<UserStats>> {
    try {
      const response = await userApi.get('/v1/users/overview');
      if (response.data?.success) {
        return response.data;
      }
    } catch (error) {
      if (!isAxiosError(error)) {
        console.error('載入用戶統計失敗:', error);
      }
    }

    return {
      success: true,
      data: buildMockStats(MOCK_USERS),
    };
  }

  static async createUser(): Promise<never> {
    return Promise.reject(new Error('用戶建立尚未在前端支援。'));
  }

  static async updateUser(): Promise<never> {
    return Promise.reject(new Error('用戶更新尚未在前端支援。'));
  }

  static async deleteUser(): Promise<never> {
    return Promise.reject(new Error('用戶刪除尚未在前端支援。'));
  }
}

export default UserService;
