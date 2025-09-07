// 🔐 認證中間件 - 預留位置
// 目前簡化版本，後續會加入完整的 JWT 驗證

const verifyToken = (req, res, next) => {
  // TODO: 實作 JWT Token 驗證
  // const token = req.headers.authorization?.split(' ')[1];
  // if (!token) {
  //   return res.status(401).json({
  //     success: false,
  //     error: {
  //       code: 'UNAUTHORIZED',
  //       message: '未提供認證 Token'
  //     }
  //   });
  // }
  
  // try {
  //   const decoded = jwt.verify(token, process.env.JWT_SECRET);
  //   req.user = decoded;
  //   next();
  // } catch (error) {
  //   return res.status(401).json({
  //     success: false,
  //     error: {
  //       code: 'INVALID_TOKEN',
  //       message: '無效的 Token'
  //     }
  //   });
  // }
  
  // 簡化版本：直接通過
  req.user = {
    id: 'mock-user-id',
    email: 'admin@ecommerce.com',
    role: 'admin',
    permissions: ['users:read', 'users:write', 'orders:read', 'orders:write']
  };
  next();
};

const requireRole = (roles) => {
  return (req, res, next) => {
    // TODO: 實作角色驗證
    // if (!req.user) {
    //   return res.status(401).json({
    //     success: false,
    //     error: {
    //       code: 'UNAUTHORIZED',
    //       message: '需要登入'
    //     }
    //   });
    // }
    
    // if (!roles.includes(req.user.role)) {
    //   return res.status(403).json({
    //     success: false,
    //     error: {
    //       code: 'FORBIDDEN',
    //       message: '權限不足'
    //     }
    //   });
    // }
    
    // 簡化版本：直接通過
    next();
  };
};

const requirePermission = (permissions) => {
  return (req, res, next) => {
    // TODO: 實作權限驗證
    // if (!req.user) {
    //   return res.status(401).json({
    //     success: false,
    //     error: {
    //       code: 'UNAUTHORIZED',
    //       message: '需要登入'
    //     }
    //   });
    // }
    
    // const hasPermission = permissions.some(permission => 
    //   req.user.permissions.includes(permission)
    // );
    
    // if (!hasPermission) {
    //   return res.status(403).json({
    //     success: false,
    //     error: {
    //       code: 'FORBIDDEN',
    //       message: '權限不足'
    //     }
    //   });
    // }
    
    // 簡化版本：直接通過
    next();
  };
};

module.exports = {
  verifyToken,
  requireRole,
  requirePermission
};
