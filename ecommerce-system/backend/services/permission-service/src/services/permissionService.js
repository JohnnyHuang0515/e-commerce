const Role = require('../models/Role');
const UserRole = require('../models/UserRole');
const Permission = require('../models/Permission');

class PermissionService {
  constructor() {
    this.permissionCache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5分鐘緩存
  }

  /**
   * 檢查用戶是否有特定權限
   * @param {string} userId - 用戶ID
   * @param {string} permission - 權限名稱
   * @param {string} resource - 資源ID（可選）
   * @returns {Promise<boolean>}
   */
  async checkPermission(userId, permission, resource = null) {
    try {
      // 檢查緩存
      const cacheKey = `${userId}:${permission}`;
      const cached = this.permissionCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
        return cached.hasPermission;
      }

      // 獲取用戶的所有角色
      const userRoles = await UserRole.getUserRoles(userId);
      
      if (!userRoles || userRoles.length === 0) {
        this.updateCache(cacheKey, false);
        return false;
      }

      // 檢查每個角色的權限
      for (const userRole of userRoles) {
        if (userRole.roleId && userRole.roleId.hasPermission(permission)) {
          this.updateCache(cacheKey, true);
          return true;
        }
      }

      this.updateCache(cacheKey, false);
      return false;
    } catch (error) {
      console.error('權限檢查錯誤:', error);
      return false;
    }
  }

  /**
   * 檢查用戶是否有特定角色
   * @param {string} userId - 用戶ID
   * @param {string} roleName - 角色名稱
   * @returns {Promise<boolean>}
   */
  async hasRole(userId, roleName) {
    try {
      return await UserRole.hasRole(userId, roleName);
    } catch (error) {
      console.error('角色檢查錯誤:', error);
      return false;
    }
  }

  /**
   * 獲取用戶的所有權限
   * @param {string} userId - 用戶ID
   * @returns {Promise<Array>}
   */
  async getUserPermissions(userId) {
    try {
      const userRoles = await UserRole.getUserRoles(userId);
      const permissions = new Set();

      userRoles.forEach(userRole => {
        if (userRole.roleId && userRole.roleId.permissions) {
          userRole.roleId.permissions.forEach(permission => {
            permissions.add(permission);
          });
        }
      });

      return Array.from(permissions);
    } catch (error) {
      console.error('獲取用戶權限錯誤:', error);
      return [];
    }
  }

  /**
   * 獲取用戶的所有角色
   * @param {string} userId - 用戶ID
   * @returns {Promise<Array>}
   */
  async getUserRoles(userId) {
    try {
      const userRoles = await UserRole.getUserRoles(userId);
      return userRoles.map(userRole => ({
        id: userRole.roleId._id,
        name: userRole.roleId.name,
        displayName: userRole.roleId.displayName,
        assignedAt: userRole.assignedAt,
        expiresAt: userRole.expiresAt,
        isValid: userRole.isValid
      }));
    } catch (error) {
      console.error('獲取用戶角色錯誤:', error);
      return [];
    }
  }

  /**
   * 為用戶分配角色
   * @param {string} userId - 用戶ID
   * @param {string} roleId - 角色ID
   * @param {string} assignedBy - 分配者ID
   * @param {Object} options - 選項
   * @returns {Promise<Object>}
   */
  async assignRole(userId, roleId, assignedBy, options = {}) {
    try {
      const userRole = new UserRole({
        userId,
        roleId,
        assignedBy,
        expiresAt: options.expiresAt || null,
        reason: options.reason || null
      });

      await userRole.save();
      
      // 清除相關緩存
      this.clearUserCache(userId);
      
      return userRole;
    } catch (error) {
      console.error('分配角色錯誤:', error);
      throw error;
    }
  }

  /**
   * 移除用戶角色
   * @param {string} userId - 用戶ID
   * @param {string} roleId - 角色ID
   * @returns {Promise<boolean>}
   */
  async removeRole(userId, roleId) {
    try {
      const result = await UserRole.findOneAndUpdate(
        { userId, roleId },
        { isActive: false },
        { new: true }
      );

      if (result) {
        this.clearUserCache(userId);
        return true;
      }
      return false;
    } catch (error) {
      console.error('移除角色錯誤:', error);
      throw error;
    }
  }

  /**
   * 創建新角色
   * @param {Object} roleData - 角色數據
   * @param {string} createdBy - 創建者ID
   * @returns {Promise<Object>}
   */
  async createRole(roleData, createdBy) {
    try {
      const role = new Role({
        ...roleData,
        createdBy
      });

      await role.save();
      return role;
    } catch (error) {
      console.error('創建角色錯誤:', error);
      throw error;
    }
  }

  /**
   * 更新角色權限
   * @param {string} roleId - 角色ID
   * @param {Array} permissions - 權限列表
   * @param {string} updatedBy - 更新者ID
   * @returns {Promise<Object>}
   */
  async updateRolePermissions(roleId, permissions, updatedBy) {
    try {
      const role = await Role.findByIdAndUpdate(
        roleId,
        { 
          permissions,
          updatedBy
        },
        { new: true }
      );

      if (role) {
        // 清除所有相關用戶的緩存
        this.clearAllCache();
      }

      return role;
    } catch (error) {
      console.error('更新角色權限錯誤:', error);
      throw error;
    }
  }

  /**
   * 初始化系統角色和權限
   * @returns {Promise<void>}
   */
  async initializeSystemData() {
    try {
      // 初始化權限
      await Permission.initializeSystemPermissions();

      // 初始化角色
      const roles = [
        {
          name: 'ADMIN',
          displayName: '系統管理員',
          description: '擁有所有權限的系統管理員',
          permissions: ['*'],
          isSystem: true
        },
        {
          name: 'MERCHANT',
          displayName: '商家管理員',
          description: '商家後台管理員',
          permissions: [
            'products:read', 'products:write', 'products:delete', 'products:manage', 'products:publish', 'products:analyze',
            'orders:read', 'orders:write', 'orders:process', 'orders:refund', 'orders:analyze',
            'analytics:read', 'analytics:dashboard', 'analytics:export', 'analytics:reports',
            'payments:read', 'payments:process', 'payments:refund',
            'logistics:read', 'logistics:manage',
            'inventory:read', 'inventory:manage',
            'users:read', 'users:write'
          ],
          isSystem: true
        },
        {
          name: 'STAFF',
          displayName: '商家員工',
          description: '商家一般員工',
          permissions: [
            'products:read', 'products:write',
            'orders:read', 'orders:write', 'orders:process',
            'analytics:read', 'analytics:dashboard',
            'payments:read', 'payments:process',
            'logistics:read',
            'inventory:read', 'inventory:manage'
          ],
          isSystem: true
        },
        {
          name: 'CUSTOMER',
          displayName: '客戶',
          description: '終端購物用戶',
          permissions: [
            'products:read',
            'orders:read', 'orders:write',
            'users:read', 'users:write'
          ],
          isSystem: true
        },
        {
          name: 'GUEST',
          displayName: '訪客',
          description: '未登入用戶',
          permissions: [
            'products:read'
          ],
          isSystem: true
        }
      ];

      for (const roleData of roles) {
        await Role.findOneAndUpdate(
          { name: roleData.name },
          roleData,
          { upsert: true, new: true }
        );
      }

      console.log('系統角色和權限初始化完成');
    } catch (error) {
      console.error('初始化系統數據錯誤:', error);
      throw error;
    }
  }

  /**
   * 更新緩存
   * @param {string} key - 緩存鍵
   * @param {boolean} hasPermission - 是否有權限
   */
  updateCache(key, hasPermission) {
    this.permissionCache.set(key, {
      hasPermission,
      timestamp: Date.now()
    });
  }

  /**
   * 清除用戶相關緩存
   * @param {string} userId - 用戶ID
   */
  clearUserCache(userId) {
    for (const key of this.permissionCache.keys()) {
      if (key.startsWith(`${userId}:`)) {
        this.permissionCache.delete(key);
      }
    }
  }

  /**
   * 清除所有緩存
   */
  clearAllCache() {
    this.permissionCache.clear();
  }

  /**
   * 獲取權限統計
   * @returns {Promise<Object>}
   */
  async getPermissionStats() {
    try {
      const totalRoles = await Role.countDocuments({ isActive: true });
      const totalPermissions = await Permission.countDocuments({ isActive: true });
      const totalUserRoles = await UserRole.countDocuments({ isActive: true });

      const roleStats = await Role.aggregate([
        { $match: { isActive: true } },
        {
          $lookup: {
            from: 'userroles',
            localField: '_id',
            foreignField: 'roleId',
            as: 'users'
          }
        },
        {
          $project: {
            name: 1,
            displayName: 1,
            userCount: { $size: '$users' },
            permissionCount: { $size: '$permissions' }
          }
        }
      ]);

      return {
        totalRoles,
        totalPermissions,
        totalUserRoles,
        roleStats
      };
    } catch (error) {
      console.error('獲取權限統計錯誤:', error);
      throw error;
    }
  }
}

module.exports = new PermissionService();
