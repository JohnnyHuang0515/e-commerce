const jwt = require('jsonwebtoken');
const permissionService = require('../services/permissionService');

/**
 * JWT Token 驗證中間件
 */
const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '缺少認證令牌'
        }
      });
    }

    const token = authHeader.substring(7); // 移除 'Bearer ' 前綴
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '認證令牌無效'
        }
      });
    }

    // 驗證 JWT Token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
    
    // 將用戶信息添加到請求對象
    req.user = {
      id: decoded.userId || decoded.id,
      email: decoded.email,
      role: decoded.role,
      permissions: decoded.permissions || []
    };

    next();
  } catch (error) {
    console.error('Token 驗證錯誤:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: '認證令牌無效'
        }
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: '認證令牌已過期'
        }
      });
    }

    return res.status(401).json({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: '認證失敗'
      }
    });
  }
};

/**
 * 角色檢查中間件
 * @param {string|Array} roles - 允許的角色
 */
const requireRole = (roles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: '需要登入'
          }
        });
      }

      const userRole = req.user.role;
      const allowedRoles = Array.isArray(roles) ? roles : [roles];
      
      // 檢查用戶角色
      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: '角色權限不足',
            required: allowedRoles,
            current: userRole
          }
        });
      }

      next();
    } catch (error) {
      console.error('角色檢查錯誤:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '內部服務錯誤'
        }
      });
    }
  };
};

/**
 * 權限檢查中間件
 * @param {string|Array} permissions - 需要的權限
 */
const requirePermission = (permissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: '需要登入'
          }
        });
      }

      const userId = req.user.id;
      const requiredPermissions = Array.isArray(permissions) ? permissions : [permissions];
      
      // 檢查每個權限
      for (const permission of requiredPermissions) {
        const hasPermission = await permissionService.checkPermission(userId, permission);
        
        if (!hasPermission) {
          return res.status(403).json({
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: '權限不足',
              required: permission,
              user: userId
            }
          });
        }
      }

      next();
    } catch (error) {
      console.error('權限檢查錯誤:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '內部服務錯誤'
        }
      });
    }
  };
};

/**
 * 資源所有者檢查中間件
 * @param {string} resourceField - 資源字段名（如 'userId', 'ownerId'）
 */
const requireResourceOwner = (resourceField = 'userId') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: '需要登入'
          }
        });
      }

      const userId = req.user.id;
      const userRole = req.user.role;
      
      // 管理員可以訪問所有資源
      if (userRole === 'ADMIN') {
        return next();
      }

      // 檢查資源所有者
      const resourceId = req.params[resourceField] || req.body[resourceField];
      
      if (!resourceId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'BAD_REQUEST',
            message: '缺少資源ID'
          }
        });
      }

      if (resourceId !== userId) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: '只能訪問自己的資源'
          }
        });
      }

      next();
    } catch (error) {
      console.error('資源所有者檢查錯誤:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '內部服務錯誤'
        }
      });
    }
  };
};

/**
 * 可選認證中間件（不強制要求登入）
 */
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // 沒有認證信息，繼續處理
      req.user = null;
      return next();
    }

    const token = authHeader.substring(7);
    
    if (!token) {
      req.user = null;
      return next();
    }

    // 嘗試驗證 Token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
    
    req.user = {
      id: decoded.userId || decoded.id,
      email: decoded.email,
      role: decoded.role,
      permissions: decoded.permissions || []
    };

    next();
  } catch (error) {
    // Token 無效，但不阻止請求
    req.user = null;
    next();
  }
};

/**
 * 管理員權限檢查中間件
 */
const requireAdmin = requireRole(['ADMIN']);

/**
 * 商家權限檢查中間件
 */
const requireMerchant = requireRole(['ADMIN', 'MERCHANT']);

/**
 * 客戶權限檢查中間件
 */
const requireCustomer = requireRole(['ADMIN', 'MERCHANT', 'STAFF', 'CUSTOMER']);

module.exports = {
  verifyToken,
  requireRole,
  requirePermission,
  requireResourceOwner,
  optionalAuth,
  requireAdmin,
  requireMerchant,
  requireCustomer
};
