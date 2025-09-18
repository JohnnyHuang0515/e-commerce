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

const normalizeUser = (user: UserRecord): UserRecord => ({
  ...user,
  permissions: user.permissions ?? [],
});

export class UserService {
  static async getUsers(params: UserListParams = {}): Promise<ApiResponse<UserListResponse>> {
    const response = await userApi.get('/v1/users', { params });
    return {
      ...response.data,
      data: {
        ...response.data.data,
        items: response.data.data.items.map(normalizeUser),
      },
    };
  }

  static async getStats(): Promise<ApiResponse<UserStats>> {
    const response = await userApi.get('/v1/users/overview');
    return response.data;
  }
}

export default UserService;
