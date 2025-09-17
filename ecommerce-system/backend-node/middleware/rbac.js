// RBAC 權限檢查中間件
const { getUserPermissions } = require('../services/permissionService');
const { postgresPool } = require('../config/database');
const { getIdMapping } = require('../utils/idMapper');

/**
 * 權限檢查中間件
 * @param {string} requiredPermission - 需要的權限
 * @returns {Function} Express 中間件函數
 */
const checkPermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.user_id) {
        return res.status(401).json({
          success: false,
          error: '未認證的用戶',
          code: 'UNAUTHORIZED'
        });
      }
      
      const userPermissions = await getUserPermissions(req.user.user_id);
      
      // 檢查是否有權限或管理員權限
      if (!userPermissions.includes(requiredPermission) && 
          !userPermissions.includes('*')) {
        
        // 記錄權限檢查失敗
        console.warn(`權限檢查失敗: 用戶 ${req.user.user_id} 嘗試訪問 ${requiredPermission}，但只有權限: ${userPermissions.join(', ')}`);
        
        return res.status(403).json({
          success: false,
          error: '權限不足',
          code: 'INSUFFICIENT_PERMISSIONS',
          required: requiredPermission,
          user_permissions: userPermissions,
          timestamp: new Date().toISOString()
        });
      }
      
      // 記錄權限檢查成功
      console.log(`權限檢查成功: 用戶 ${req.user.user_id} 訪問 ${requiredPermission}`);
      
      next();
    } catch (error) {
      console.error('權限檢查失敗:', error);
      res.status(500).json({
        success: false,
        error: '權限檢查失敗',
        code: 'PERMISSION_CHECK_ERROR',
        timestamp: new Date().toISOString()
      });
    }
  };
};

/**
 * 多權限檢查中間件（需要擁有其中任一權限）
 * @param {string[]} requiredPermissions - 需要的權限列表
 * @returns {Function} Express 中間件函數
 */
const checkAnyPermission = (requiredPermissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.user_id) {
        return res.status(401).json({
          success: false,
          error: '未認證的用戶',
          code: 'UNAUTHORIZED'
        });
      }
      
      const userPermissions = await getUserPermissions(req.user.user_id);
      
      // 檢查是否有任一權限或管理員權限
      const hasPermission = userPermissions.includes('*') || 
                           requiredPermissions.some(permission => userPermissions.includes(permission));
      
      if (!hasPermission) {
        console.warn(`多權限檢查失敗: 用戶 ${req.user.user_id} 嘗試訪問 ${requiredPermissions.join(' 或 ')}, 但只有權限: ${userPermissions.join(', ')}`);
        
        return res.status(403).json({
          success: false,
          error: '權限不足',
          code: 'INSUFFICIENT_PERMISSIONS',
          required: requiredPermissions,
          user_permissions: userPermissions,
          timestamp: new Date().toISOString()
        });
      }
      
      console.log(`多權限檢查成功: 用戶 ${req.user.user_id} 訪問 ${requiredPermissions.join(' 或 ')}`);
      next();
    } catch (error) {
      console.error('多權限檢查失敗:', error);
      res.status(500).json({
        success: false,
        error: '權限檢查失敗',
        code: 'PERMISSION_CHECK_ERROR',
        timestamp: new Date().toISOString()
      });
    }
  };
};

/**
 * 多權限檢查中間件（需要擁有所有權限）
 * @param {string[]} requiredPermissions - 需要的權限列表
 * @returns {Function} Express 中間件函數
 */
const checkAllPermissions = (requiredPermissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.user_id) {
        return res.status(401).json({
          success: false,
          error: '未認證的用戶',
          code: 'UNAUTHORIZED'
        });
      }
      
      const userPermissions = await getUserPermissions(req.user.user_id);
      
      // 檢查是否有所有權限或管理員權限
      const hasAllPermissions = userPermissions.includes('*') || 
                               requiredPermissions.every(permission => userPermissions.includes(permission));
      
      if (!hasAllPermissions) {
        const missingPermissions = requiredPermissions.filter(permission => !userPermissions.includes(permission));
        
        console.warn(`全權限檢查失敗: 用戶 ${req.user.user_id} 缺少權限: ${missingPermissions.join(', ')}, 現有權限: ${userPermissions.join(', ')}`);
        
        return res.status(403).json({
          success: false,
          error: '權限不足',
          code: 'INSUFFICIENT_PERMISSIONS',
          required: requiredPermissions,
          missing: missingPermissions,
          user_permissions: userPermissions,
          timestamp: new Date().toISOString()
        });
      }
      
      console.log(`全權限檢查成功: 用戶 ${req.user.user_id} 擁有所有權限: ${requiredPermissions.join(', ')}`);
      next();
    } catch (error) {
      console.error('全權限檢查失敗:', error);
      res.status(500).json({
        success: false,
        error: '權限檢查失敗',
        code: 'PERMISSION_CHECK_ERROR',
        timestamp: new Date().toISOString()
      });
    }
  };
};

/**
 * 角色檢查中間件
 * @param {string[]} requiredRoles - 需要的角色列表
 * @returns {Function} Express 中間件函數
 */
const checkRole = (requiredRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.user_id) {
        return res.status(401).json({
          success: false,
          error: '未認證的用戶',
          code: 'UNAUTHORIZED'
        });
      }
      
      // 從資料庫獲取用戶角色
      const { postgresPool } = require('../config/database');
      const result = await postgresPool.query(`
        SELECT r.role_name
        FROM users u
        JOIN user_roles ur ON u.user_id = ur.user_id
        JOIN roles r ON ur.role_id = r.role_id
        WHERE u.user_id = $1 AND ur.is_active = true
      `, [req.user.user_id]);
      
      const userRoles = result.rows.map(row => row.role_name);
      
      // 檢查是否有任一角色
      const hasRole = requiredRoles.some(role => userRoles.includes(role));
      
      if (!hasRole) {
        console.warn(`角色檢查失敗: 用戶 ${req.user.user_id} 嘗試訪問需要角色 ${requiredRoles.join(' 或 ')}, 但只有角色: ${userRoles.join(', ')}`);
        
        return res.status(403).json({
          success: false,
          error: '角色權限不足',
          code: 'INSUFFICIENT_ROLE',
          required: requiredRoles,
          user_roles: userRoles,
          timestamp: new Date().toISOString()
        });
      }
      
      console.log(`角色檢查成功: 用戶 ${req.user.user_id} 擁有角色: ${userRoles.join(', ')}`);
      next();
    } catch (error) {
      console.error('角色檢查失敗:', error);
      res.status(500).json({
        success: false,
        error: '角色檢查失敗',
        code: 'ROLE_CHECK_ERROR',
        timestamp: new Date().toISOString()
      });
    }
  };
};

/**
 * 資源擁有者檢查中間件（檢查用戶是否為資源的擁有者）
 * @param {string} resourceType - 資源類型（如 'user', 'order', 'product'）
 * @param {string} ownerField - 擁有者欄位名稱（如 'user_id', 'created_by'）
 * @returns {Function} Express 中間件函數
 */
const checkResourceOwner = (resourceType, ownerField = 'user_id') => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.user_id) {
        return res.status(401).json({
          success: false,
          error: '未認證的用戶',
          code: 'UNAUTHORIZED'
        });
      }
      
      // 獲取資源 ID
      const resourceId = req.params.id || req.params.publicId;
      if (!resourceId) {
        return res.status(400).json({
          success: false,
          error: '缺少資源 ID',
          code: 'MISSING_RESOURCE_ID'
        });
      }
      
      // 查詢資源擁有者
      // 如果是 public_id，先轉換為內部 ID
      let internalId = resourceId;
      if (resourceType !== 'users') {
        const mapping = await getIdMapping(resourceType, resourceId);
        if (mapping) {
          internalId = mapping.internal_id;
        }
      }
      
      const result = await postgresPool.query(`
        SELECT ${ownerField}
        FROM ${resourceType}
        WHERE ${resourceType}_id = $1
      `, [internalId]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: '資源不存在',
          code: 'RESOURCE_NOT_FOUND'
        });
      }
      
      const resourceOwnerId = result.rows[0][ownerField];
      
      // 檢查是否為資源擁有者或管理員
      const userPermissions = await getUserPermissions(req.user.user_id);
      const isOwner = resourceOwnerId === req.user.user_id;
      const isAdmin = userPermissions.includes('*');
      
      if (!isOwner && !isAdmin) {
        console.warn(`資源擁有者檢查失敗: 用戶 ${req.user.user_id} 嘗試訪問 ${resourceType} ${resourceId}, 但擁有者是 ${resourceOwnerId}`);
        
        return res.status(403).json({
          success: false,
          error: '無權限訪問此資源',
          code: 'RESOURCE_ACCESS_DENIED',
          resource_type: resourceType,
          resource_id: resourceId,
          timestamp: new Date().toISOString()
        });
      }
      
      console.log(`資源擁有者檢查成功: 用戶 ${req.user.user_id} 訪問 ${resourceType} ${resourceId}`);
      next();
    } catch (error) {
      console.error('資源擁有者檢查失敗:', error);
      res.status(500).json({
        success: false,
        error: '資源權限檢查失敗',
        code: 'RESOURCE_CHECK_ERROR',
        timestamp: new Date().toISOString()
      });
    }
  };
};

module.exports = {
  checkPermission,
  checkAnyPermission,
  checkAllPermissions,
  checkRole,
  checkResourceOwner
};
