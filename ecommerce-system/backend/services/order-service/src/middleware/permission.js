const axios = require('axios');

// Permission Service 配置
const PERMISSION_SERVICE_URL = process.env.PERMISSION_SERVICE_URL || 'http://localhost:3013';

/**
 * 權限檢查中間件
 * @param {string|Array} requiredPermissions - 需要的權限
 * @returns {Function} Express 中間件函數
 */
const checkPermission = (requiredPermissions) => {
  return async (req, res, next) => {
    try {
      // 從請求頭獲取 token
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: '缺少認證 token'
          }
        });
      }

      // 從 token 中解析用戶 ID (簡化版本，實際應該驗證 JWT)
      let userId;
      try {
        // 這裡應該使用 JWT 驗證，暫時簡化
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
          userId = payload.userId || payload.id;
        } else {
          // 如果不是 JWT，假設 token 就是 userId (開發環境)
          userId = token;
        }
      } catch (error) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: '無效的認證 token'
          }
        });
      }

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: '無法從 token 中獲取用戶 ID'
          }
        });
      }

      // 調用 Permission Service 檢查權限
      const permissions = Array.isArray(requiredPermissions) 
        ? requiredPermissions 
        : [requiredPermissions];

      const permissionResponse = await axios.post(
        `${PERMISSION_SERVICE_URL}/api/v1/permissions/check`,
        {
          userId,
          permissions
        },
        {
          timeout: 5000,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (permissionResponse.data.success) {
        // 權限檢查通過，將用戶信息添加到請求對象
        req.user = {
          id: userId,
          permissions: permissionResponse.data.data.permissions
        };
        next();
      } else {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: '權限不足',
            details: permissionResponse.data.error
          }
        });
      }

    } catch (error) {
      console.error('權限檢查錯誤:', error.message);
      
      // 如果 Permission Service 不可用，記錄錯誤但允許通過 (開發環境)
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Permission Service 不可用，開發環境允許通過');
        req.user = { id: 'dev-user', permissions: ['*'] };
        next();
      } else {
        return res.status(503).json({
          success: false,
          error: {
            code: 'PERMISSION_SERVICE_UNAVAILABLE',
            message: '權限服務暫時不可用'
          }
        });
      }
    }
  };
};

/**
 * 訂單管理權限檢查
 */
const requireOrderManage = checkPermission(['orders:read', 'orders:write']);

/**
 * 訂單讀取權限檢查
 */
const requireOrderRead = checkPermission(['orders:read']);

/**
 * 訂單寫入權限檢查
 */
const requireOrderWrite = checkPermission(['orders:write']);

/**
 * 訂單狀態更新權限檢查
 */
const requireOrderStatusUpdate = checkPermission(['orders:update_status']);

/**
 * 管理員權限檢查
 */
const requireAdmin = checkPermission(['admin:*', 'orders:manage']);

module.exports = {
  checkPermission,
  requireOrderManage,
  requireOrderRead,
  requireOrderWrite,
  requireOrderStatusUpdate,
  requireAdmin
};
