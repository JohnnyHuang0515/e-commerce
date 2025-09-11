const jwt = require('jsonwebtoken');

// JWT 認證中間件
const authenticateToken = async (req, res, next) => {
  try {
    console.log('🔐 認證中間件開始:', req.path);
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      console.log('❌ 未提供認證令牌');
      return res.status(401).json({
        success: false,
        message: '未提供認證令牌'
      });
    }

    console.log('✅ 開始驗證token');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-for-development');
    req.user = decoded;
    console.log('✅ 認證成功，用戶:', decoded.email);
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

module.exports = {
  authenticateToken,
  authorize
};
