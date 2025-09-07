import { api } from './api';

// 權限相關接口定義
export interface Permission {
  _id: string;
  name: string;
  description?: string;
  module: string;
  action: string;
  category?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  _id: string;
  name: string;
  description?: string;
  permissions: Permission[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserRole {
  _id: string;
  userId: string;
  roleId: string;
  role?: Role;
  assignedBy?: string;
  expiresAt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PermissionCheckRequest {
  userId: string;
  permissions: string[];
}

export interface PermissionCheckResponse {
  success: boolean;
  data: {
    hasPermission: boolean;
    permissions: string[];
    missingPermissions: string[];
  };
  error?: string;
}

export interface PermissionSearchParams {
  module?: string;
  action?: string;
  category?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface RoleSearchParams {
  name?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface UserRoleSearchParams {
  userId?: string;
  roleId?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Permission Service 類
export class PermissionService {
  private baseUrl = 'http://localhost:3013/api/v1';

  // 權限管理
  async getPermissions(params?: PermissionSearchParams): Promise<{ data: Permission[]; total: number }> {
    const response = await api.get(`${this.baseUrl}/permissions`, { params });
    return response.data;
  }

  async getPermissionById(id: string): Promise<Permission> {
    const response = await api.get(`${this.baseUrl}/permissions/${id}`);
    return response.data.data;
  }

  async createPermission(permission: Partial<Permission>): Promise<Permission> {
    const response = await api.post(`${this.baseUrl}/permissions`, permission);
    return response.data.data;
  }

  async updatePermission(id: string, permission: Partial<Permission>): Promise<Permission> {
    const response = await api.put(`${this.baseUrl}/permissions/${id}`, permission);
    return response.data.data;
  }

  async deletePermission(id: string): Promise<void> {
    await api.delete(`${this.baseUrl}/permissions/${id}`);
  }

  // 角色管理
  async getRoles(params?: RoleSearchParams): Promise<{ data: Role[]; total: number }> {
    const response = await api.get(`${this.baseUrl}/roles`, { params });
    return response.data;
  }

  async getRoleById(id: string): Promise<Role> {
    const response = await api.get(`${this.baseUrl}/roles/${id}`);
    return response.data.data;
  }

  async createRole(role: Partial<Role>): Promise<Role> {
    const response = await api.post(`${this.baseUrl}/roles`, role);
    return response.data.data;
  }

  async updateRole(id: string, role: Partial<Role>): Promise<Role> {
    const response = await api.put(`${this.baseUrl}/roles/${id}`, role);
    return response.data.data;
  }

  async deleteRole(id: string): Promise<void> {
    await api.delete(`${this.baseUrl}/roles/${id}`);
  }

  async assignPermissionsToRole(roleId: string, permissionIds: string[]): Promise<Role> {
    const response = await api.post(`${this.baseUrl}/roles/${roleId}/permissions`, {
      permissionIds
    });
    return response.data.data;
  }

  async removePermissionsFromRole(roleId: string, permissionIds: string[]): Promise<Role> {
    const response = await api.delete(`${this.baseUrl}/roles/${roleId}/permissions`, {
      data: { permissionIds }
    });
    return response.data.data;
  }

  // 用戶角色管理
  async getUserRoles(params?: UserRoleSearchParams): Promise<{ data: UserRole[]; total: number }> {
    const response = await api.get(`${this.baseUrl}/user-roles`, { params });
    return response.data;
  }

  async getUserRolesByUserId(userId: string): Promise<UserRole[]> {
    const response = await api.get(`${this.baseUrl}/user-roles/user/${userId}`);
    return response.data.data;
  }

  async assignUserRole(userId: string, roleId: string, expiresAt?: string): Promise<UserRole> {
    const response = await api.post(`${this.baseUrl}/user-roles`, {
      userId,
      roleId,
      expiresAt
    });
    return response.data.data;
  }

  async removeUserRole(userRoleId: string): Promise<void> {
    await api.delete(`${this.baseUrl}/user-roles/${userRoleId}`);
  }

  // 權限檢查
  async checkPermission(request: PermissionCheckRequest): Promise<PermissionCheckResponse> {
    const response = await api.post(`${this.baseUrl}/permissions/check`, request);
    return response.data;
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    const response = await api.get(`${this.baseUrl}/permissions/user/${userId}`);
    return response.data.data;
  }

  // 統計信息
  async getPermissionStats(): Promise<{
    totalPermissions: number;
    totalRoles: number;
    totalUserRoles: number;
    permissionsByModule: Record<string, number>;
    rolesByStatus: Record<string, number>;
  }> {
    const response = await api.get(`${this.baseUrl}/permissions/stats`);
    return response.data.data;
  }

  // 初始化默認數據
  async initializeDefaultData(): Promise<void> {
    await api.post(`${this.baseUrl}/permissions/initialize`);
  }
}

// 導出服務實例
export const permissionService = new PermissionService();
