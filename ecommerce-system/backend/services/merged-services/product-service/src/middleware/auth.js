const jwt = require('jsonwebtoken');
const axios = require('axios');

// JWT 認證中間件
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

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-for-development');
    
    // 從 AUTH-SERVICE 獲取用戶完整信息
    try {
      const response = await axios.get(`${process.env.AUTH_SERVICE_URL || 'http://localhost:3001'}/api/v1/users/${decoded.userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        req.user = response.data.data;
        console.log('獲取到用戶信息:', req.user);
      } else {
        return res.status(401).json({
          success: false,
          message: '用戶信息獲取失敗'
        });
      }
    } catch (error) {
      console.error('獲取用戶信息錯誤:', error.message);
      // 如果無法從 AUTH-SERVICE 獲取信息，使用 JWT 中的基本信息
      req.user = decoded;
    }
    
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

    console.log('檢查權限 - 用戶角色:', req.user.role, '允許的角色:', allowedRoles);
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: '權限不足'
      });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  authorize
};
