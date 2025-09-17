const { postgresPool, redisClient } = require('../config/database');

const PERMISSION_CACHE_TTL = 3600; // 秒

const buildCacheKey = (userId) => `permissions:${userId}`;

const getUserPermissions = async (userId) => {
  if (!userId) {
    return [];
  }

  try {
    if (redisClient?.isOpen) {
      const cached = await redisClient.get(buildCacheKey(userId));
      if (cached) {
        return JSON.parse(cached);
      }
    }
  } catch (error) {
    console.warn('讀取權限快取失敗，改為查詢資料庫:', error.message);
  }

  try {
    const result = await postgresPool.query(
      `SELECT p.name
       FROM users u
       JOIN user_roles ur ON u.id = ur.user_id
       JOIN roles r ON ur.role_id = r.id
       JOIN role_permissions rp ON r.id = rp.role_id
       JOIN permissions p ON rp.permission_id = p.id
       WHERE u.id = $1 AND ur.is_active = true`,
      [userId]
    );

    const permissions = result.rows.map((row) => row.name);

    try {
      if (redisClient?.isOpen) {
        await redisClient.setEx(
          buildCacheKey(userId),
          PERMISSION_CACHE_TTL,
          JSON.stringify(permissions)
        );
      }
    } catch (error) {
      console.warn('寫入權限快取失敗，將跳過快取:', error.message);
    }

    return permissions;
  } catch (error) {
    console.error('獲取用戶權限失敗:', error);
    return [];
  }
};

module.exports = {
  getUserPermissions,
};
