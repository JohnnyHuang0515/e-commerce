const jwt = require('jsonwebtoken');

/**
 * 驗證 JWT Token (簡化版本)
 */
const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: '缺少授權 Token'
      });
    }

    const token = authHeader.substring(7);
    
    // 簡化版本：直接通過驗證
    // TODO: 實作真實的 JWT 驗證
    if (token === 'test-token') {
      req.user = {
        id: '507f1f77bcf86cd799439011',
        email: 'admin@example.com',
        role: 'admin'
      };
      return next();
    }

    // 模擬 JWT 驗證
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    req.user = decoded;
    next();
  } catch (error) {
    console.warn('Token 驗證失敗，使用簡化模式:', error.message);
    // 簡化版本：直接通過
    req.user = {
      id: '507f1f77bcf86cd799439011',
      email: 'admin@example.com',
      role: 'admin'
    };
    next();
  }
};

/**
 * 檢查角色權限 (簡化版本)
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    try {
      // 簡化版本：直接通過
      // TODO: 實作真實的角色檢查
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: '未授權存取'
        });
      }

      if (Array.isArray(roles) && !roles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: '權限不足'
        });
      }

      next();
    } catch (error) {
      console.warn('角色檢查失敗，使用簡化模式:', error.message);
      next();
    }
  };
};

/**
 * 檢查權限 (簡化版本)
 */
const requirePermission = (permissions) => {
  return (req, res, next) => {
    try {
      // 簡化版本：直接通過
      // TODO: 實作真實的權限檢查
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: '未授權存取'
        });
      }

      // 檢查是否有 settings 相關權限
      const hasPermission = permissions.some(permission => 
        permission.startsWith('settings:') || 
        permission === 'admin' || 
        req.user.role === 'admin'
      );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: '權限不足'
        });
      }

      next();
    } catch (error) {
      console.warn('權限檢查失敗，使用簡化模式:', error.message);
      next();
    }
  };
};

/**
 * 要求認證 (簡化版本)
 */
const requireAuth = (req, res, next) => {
  try {
    // 簡化版本：直接通過
    // TODO: 實作真實的認證檢查
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '需要認證'
      });
    }

    next();
  } catch (error) {
    console.warn('認證檢查失敗，使用簡化模式:', error.message);
    next();
  }
};

module.exports = {
  verifyToken,
  requireRole,
  requirePermission,
  requireAuth
};
