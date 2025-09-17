import type { AxiosError } from 'axios';
import { permissionApi } from './api';
import type { ApiResponse } from '../types/api';

export type PermissionCategory = 'basic' | 'advanced' | 'admin' | 'system';

export interface PermissionDefinition {
  key: string;
  name: string;
  description?: string;
  module: string;
  action: string;
  category: PermissionCategory;
}

export interface RoleDefinition {
  key: string;
  name: string;
  description?: string;
  permissions: string[];
  isSystem?: boolean;
}

export interface PermissionStats {
  totalPermissions: number;
  totalRoles: number;
  systemRoles: number;
  modules: Record<string, number>;
}

export interface UserPermissionResponse {
  permissions: string[];
  count: number;
}

const DEFAULT_PERMISSIONS: PermissionDefinition[] = [
  {
    key: 'products:read',
    name: '查看商品',
    description: '允許檢視商品列表與詳細資料',
    module: 'products',
    action: 'read',
    category: 'basic',
  },
  {
    key: 'products:update',
    name: '管理商品',
    description: '允許建立、編輯與下架商品',
    module: 'products',
    action: 'update',
    category: 'advanced',
  },
  {
    key: 'orders:read',
    name: '查看訂單',
    description: '允許檢視訂單狀態與細節',
    module: 'orders',
    action: 'read',
    category: 'basic',
  },
  {
    key: 'orders:update',
    name: '管理訂單',
    description: '允許修改訂單狀態與物流資訊',
    module: 'orders',
    action: 'update',
    category: 'advanced',
  },
  {
    key: 'analytics:read',
    name: '存取報表',
    description: '允許瀏覽儀表板與分析報表',
    module: 'analytics',
    action: 'read',
    category: 'basic',
  },
  {
    key: 'inventory:manage',
    name: '庫存管理',
    description: '允許調整庫存數量與檢視警示',
    module: 'inventory',
    action: 'manage',
    category: 'advanced',
  },
  {
    key: 'system:manage',
    name: '系統管理',
    description: '允許管理平台設定與權限',
    module: 'system',
    action: 'manage',
    category: 'admin',
  },
];

const DEFAULT_ROLES: RoleDefinition[] = [
  {
    key: 'admin',
    name: '系統管理員',
    description: '擁有所有功能權限，可管理整個平台',
    permissions: DEFAULT_PERMISSIONS.map((permission) => permission.key),
    isSystem: true,
  },
  {
    key: 'manager',
    name: '營運經理',
    description: '可管理商品、訂單與庫存，檢視報表',
    permissions: [
      'products:read',
      'products:update',
      'orders:read',
      'orders:update',
      'inventory:manage',
      'analytics:read',
    ],
  },
  {
    key: 'support',
    name: '客服人員',
    description: '負責處理訂單查詢與基本操作',
    permissions: ['orders:read', 'products:read', 'analytics:read'],
  },
];

const isAxiosError = (error: unknown): error is AxiosError =>
  typeof error === 'object' && error !== null && 'isAxiosError' in error;

const buildStats = (roles: RoleDefinition[], permissions: PermissionDefinition[]): PermissionStats => {
  const modules = permissions.reduce<Record<string, number>>((accumulator, permission) => {
    accumulator[permission.module] = (accumulator[permission.module] || 0) + 1;
    return accumulator;
  }, {});

  return {
    totalPermissions: permissions.length,
    totalRoles: roles.length,
    systemRoles: roles.filter((role) => role.isSystem).length,
    modules,
  };
};

export class PermissionService {
  static async getCurrentUserPermissions(): Promise<ApiResponse<UserPermissionResponse>> {
    try {
      const response = await permissionApi.get('/v1/auth/permissions');
      if (response.data?.success) {
        return response.data;
      }
    } catch (error) {
      if (!isAxiosError(error)) {
        console.error('載入使用者權限失敗:', error);
      }
    }

    const permissions = DEFAULT_ROLES[0].permissions;
    return {
      success: true,
      data: {
        permissions,
        count: permissions.length,
      },
    };
  }

  static async getPermissionCatalog(): Promise<ApiResponse<{ permissions: PermissionDefinition[] }>> {
    return {
      success: true,
      data: {
        permissions: DEFAULT_PERMISSIONS,
      },
    };
  }

  static async getRoleCatalog(): Promise<ApiResponse<{ roles: RoleDefinition[] }>> {
    return {
      success: true,
      data: {
        roles: DEFAULT_ROLES,
      },
    };
  }

  static async getStats(): Promise<ApiResponse<PermissionStats>> {
    return {
      success: true,
      data: buildStats(DEFAULT_ROLES, DEFAULT_PERMISSIONS),
    };
  }

  static async createRole(): Promise<never> {
    return Promise.reject(new Error('角色管理 API 尚未實作。'));
  }

  static async updateRole(): Promise<never> {
    return Promise.reject(new Error('角色管理 API 尚未實作。'));
  }

  static async deleteRole(): Promise<never> {
    return Promise.reject(new Error('角色管理 API 尚未實作。'));
  }

  static async assignRole(): Promise<never> {
    return Promise.reject(new Error('角色指派 API 尚未實作。'));
  }
}

export default PermissionService;
