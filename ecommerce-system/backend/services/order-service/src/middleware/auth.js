// 🔐 認證中間件 - 整合 Auth Service
// 目前簡化版本，後續會加入完整的 JWT 驗證

const verifyToken = (req, res, next) => {
  // TODO: 實作 JWT Token 驗證
  // 簡化版本：直接通過
  req.user = {
    id: 'mock-user-id',
    email: 'admin@ecommerce.com',
    role: 'admin',
    permissions: ['orders:read', 'orders:write', 'users:read', 'products:read']
  };
  next();
};

const requireRole = (roles) => {
  return (req, res, next) => {
    // TODO: 實作角色驗證
    // 簡化版本：直接通過
    next();
  };
};

const requirePermission = (permissions) => {
  return (req, res, next) => {
    // TODO: 實作權限驗證
    // 簡化版本：直接通過
    next();
  };
};

const requireAuth = (req, res, next) => {
  // TODO: 實作完整的認證檢查
  // 簡化版本：直接通過
  next();
};

module.exports = {
  verifyToken,
  requireRole,
  requirePermission,
  requireAuth
};
