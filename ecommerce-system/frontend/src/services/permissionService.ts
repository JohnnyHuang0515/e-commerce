import { permissionApi, ApiResponse, PaginatedResponse } from './api';

// 權限相關接口定義
export interface Permission {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  module: string;
  action: string;
  category: string;
  isActive: boolean;
}

export interface Role {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  permissions: string[];
  permissionCount: number;
  isActive: boolean;
  isSystem: boolean;
}

export interface UserRole {
  id: string;
  userId: string;
  roleId: string;
  assignedAt: string;
  expiresAt?: string;
  isValid: boolean;
}

export interface PermissionCheckRequest {
  permission: string;
  resource?: string;
}

export interface AssignRoleRequest {
    userId: string;
    roleId: string;
    expiresAt?: string;
    reason?: string;
}

export interface RoleSearchParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export interface PermissionSearchParams {
    module?: 'users' | 'products' | 'orders' | 'analytics' | 'system' | 'payments' | 'logistics' | 'inventory';
    category?: 'basic' | 'advanced' | 'admin' | 'system';
}


// Permission Service 類
export class PermissionService {

  // 權限檢查
  static async checkPermission(request: PermissionCheckRequest): Promise<ApiResponse<{ hasPermission: boolean }>> {
    const response = await permissionApi.post('/v1/check', request);
    return response.data;
  }

  // 用戶權限管理
  static async getUserPermissions(userId: string): Promise<ApiResponse<{ permissions: string[], roles: UserRole[] }>> {
    const response = await permissionApi.get(`/v1/user/${userId}`);
    return response.data;
  }

  // 角色管理
  static async getRoles(params?: RoleSearchParams): Promise<ApiResponse<PaginatedResponse<Role>>> {
    const response = await permissionApi.get('/v1/roles', { params });
    return response.data;
  }

  static async createRole(roleData: Partial<Role>): Promise<ApiResponse<{ role: Role }>> {
    const response = await permissionApi.post('/v1/roles', roleData);
    return response.data;
  }

  static async getRole(roleId: string): Promise<ApiResponse<{ role: Role }>> {
    const response = await permissionApi.get(`/v1/role/${roleId}`);
    return response.data;
  }

  static async updateRole(roleId: string, permissions: string[]): Promise<ApiResponse<{ role: Role }>> {
    const response = await permissionApi.put(`/v1/role/${roleId}`, { permissions });
    return response.data;
  }

  // 用戶角色分配
  static async assignRole(data: AssignRoleRequest): Promise<ApiResponse<{ userRole: UserRole }>> {
    const response = await permissionApi.post('/v1/assign', data);
    return response.data;
  }

  static async removeRoleFromUser(userId: string, roleId: string): Promise<ApiResponse<void>> {
    const response = await permissionApi.delete(`/v1/user/${userId}/role/${roleId}`);
    return response.data;
  }

  // 權限列表
  static async getPermissions(params?: PermissionSearchParams): Promise<ApiResponse<{ permissions: Permission[] }>> {
    const response = await permissionApi.get('/v1/permissions', { params });
    return response.data;
  }

  // 統計信息
  static async getStats(): Promise<ApiResponse<any>> {
    const response = await permissionApi.get('/v1/stats');
    return response.data;
  }

  // 初始化
  static async initialize(): Promise<ApiResponse<void>> {
      const response = await permissionApi.post('/v1/initialize');
      return response.data;
  }
}

export default PermissionService;
