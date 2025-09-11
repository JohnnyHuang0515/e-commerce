const jwt = require('jsonwebtoken');
const { User, Role, Permission } = require('../models');

// JWT 認證中間件 - 簡化版本（開發模式）
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: '未提供認證令牌'
      });
    }

    let decoded;
    try {
      // 嘗試解析 JWT token
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-for-development');
    } catch (jwtError) {
      // 如果 JWT 解析失敗，嘗試解析 base64 編碼的模擬 token
      try {
        decoded = JSON.parse(atob(token));
        // 檢查 token 是否過期
        if (decoded.exp && decoded.exp < Date.now()) {
          return res.status(401).json({
            success: false,
            message: '認證令牌已過期'
          });
        }
      } catch (base64Error) {
        return res.status(401).json({
          success: false,
          message: '無效的認證令牌'
        });
      }
    }
    
    // 創建模擬用戶資訊（開發模式）
    const user = {
      id: decoded.userId || decoded.id,
      email: decoded.email,
      role: decoded.role,
      permissions: ['read', 'write', 'admin']
    };

    // 開發模式：跳過用戶狀態檢查
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: '無效的認證令牌'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: '認證令牌已過期'
      });
    }

    console.error('認證中間件錯誤:', error);
    return res.status(500).json({
      success: false,
      message: '認證過程中發生錯誤'
    });
  }
};

// 角色授權中間件
const authorize = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未認證用戶'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: '權限不足'
      });
    }

    next();
  };
};

// 權限檢查中間件
const checkPermission = (resource, action) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: '未認證用戶'
        });
      }

      // 管理員擁有所有權限
      if (req.user.role === 'ADMIN') {
        return next();
      }

      // 檢查用戶是否有特定權限
      const hasPermission = req.user.userRole?.permissions?.some(permission => 
        permission.resource === resource && permission.action === action
      ) || false;

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: '權限不足'
        });
      }

      next();
    } catch (error) {
      console.error('權限檢查錯誤:', error);
      return res.status(500).json({
        success: false,
        message: '權限檢查過程中發生錯誤'
      });
    }
  };
};

module.exports = {
  authenticateToken,
  authorize,
  checkPermission
};
