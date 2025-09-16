// 統一資料庫連接配置
const { Pool } = require('pg');
const { MongoClient } = require('mongodb');
const Redis = require('redis');
const { ClickHouse } = require('clickhouse');

// PostgreSQL 連接池
const postgresPool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'ecommerce_new',
  user: process.env.POSTGRES_USER || 'admin',
  password: process.env.POSTGRES_PASSWORD || 'password123',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// MongoDB 連接 (無認證模式)
const mongoClient = new MongoClient(
  process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce'
);

// Redis 連接
const redisClient = Redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

// ClickHouse 連接
const clickhouseClient = new ClickHouse({
  url: process.env.CLICKHOUSE_URL || 'http://localhost:8123',
  username: process.env.CLICKHOUSE_USER || 'default',
  password: process.env.CLICKHOUSE_PASSWORD || ''
});

// 連接事件處理
postgresPool.on('error', (err) => {
  console.error('PostgreSQL 連接錯誤:', err);
});

redisClient.on('error', (err) => {
  console.error('Redis 連接錯誤:', err);
});

redisClient.on('connect', () => {
  console.log('✅ Redis 連接成功');
});

// 初始化連接
const initializeConnections = async () => {
  try {
    // 測試 PostgreSQL 連接
    await postgresPool.query('SELECT NOW()');
    console.log('✅ PostgreSQL 連接成功');
    
    // 測試 MongoDB 連接
    await mongoClient.connect();
    await mongoClient.db('ecommerce').admin().ping();
    console.log('✅ MongoDB 連接成功');
    
    // 測試 Redis 連接
    await redisClient.connect();
    await redisClient.ping();
    console.log('✅ Redis 連接成功');
    
    // 測試 ClickHouse 連接
    await clickhouseClient.query('SELECT 1');
    console.log('✅ ClickHouse 連接成功');
    
  } catch (error) {
    console.error('❌ 資料庫連接初始化失敗:', error);
    throw error;
  }
};

// 權限檢查函數
const getUserPermissions = async (userId) => {
  try {
    // 先從 Redis 快取檢查
    const cached = await redisClient.get(`permissions:${userId}`);
    if (cached) {
      return JSON.parse(cached);
    }
    
    // 從 PostgreSQL 獲取
    const result = await postgresPool.query(`
      SELECT p.permission_name
      FROM users u
      JOIN user_roles ur ON u.user_id = ur.user_id
      JOIN roles r ON ur.role_id = r.role_id
      JOIN role_permissions rp ON r.role_id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.permission_id
      WHERE u.user_id = $1 AND ur.is_active = true
    `, [userId]);
    
    const permissions = result.rows.map(row => row.permission_name);
    
    // 快取到 Redis (1小時)
    await redisClient.setEx(`permissions:${userId}`, 3600, JSON.stringify(permissions));
    
    return permissions;
  } catch (error) {
    console.error('獲取用戶權限失敗:', error);
    return [];
  }
};

// 雙層主鍵處理函數
const getIdMapping = async (tableName, publicId) => {
  try {
    const result = await postgresPool.query(`
      SELECT ${tableName}_id as internal_id, public_id
      FROM ${tableName}
      WHERE public_id = $1
    `, [publicId]);
    
    return result.rows[0];
  } catch (error) {
    console.error('ID 映射查詢失敗:', error);
    return null;
  }
};

const getPublicId = async (tableName, internalId) => {
  try {
    const result = await postgresPool.query(`
      SELECT public_id
      FROM ${tableName}
      WHERE ${tableName}_id = $1
    `, [internalId]);
    
    return result.rows[0]?.public_id;
  } catch (error) {
    console.error('獲取 Public ID 失敗:', error);
    return null;
  }
};

// 用戶查詢函數
const getUserByPublicId = async (publicId) => {
  try {
    const result = await postgresPool.query(`
      SELECT user_id, public_id, name, email, status, created_at, updated_at
      FROM users 
      WHERE public_id = $1
    `, [publicId]);
    
    return result.rows[0];
  } catch (error) {
    console.error('查詢用戶失敗:', error);
    return null;
  }
};

const getUserByEmail = async (email) => {
  try {
    const result = await postgresPool.query(`
      SELECT user_id, public_id, name, email, password_hash, status, created_at, updated_at
      FROM users 
      WHERE email = $1
    `, [email]);
    
    return result.rows[0];
  } catch (error) {
    console.error('查詢用戶失敗:', error);
    return null;
  }
};

// 權限檢查中間件
const checkPermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.user_id) {
        return res.status(401).json({
          success: false,
          error: '未認證的用戶'
        });
      }
      
      const userPermissions = await getUserPermissions(req.user.user_id);
      
      if (!userPermissions.includes(requiredPermission) && 
          !userPermissions.includes('*')) {
        return res.status(403).json({
          success: false,
          error: '權限不足',
          required: requiredPermission,
          user_permissions: userPermissions
        });
      }
      
      next();
    } catch (error) {
      console.error('權限檢查失敗:', error);
      res.status(500).json({
        success: false,
        error: '權限檢查失敗'
      });
    }
  };
};

// JWT 認證中間件
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: '缺少認證令牌'
      });
    }
    
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // 從資料庫獲取用戶資訊
    const user = await getUserByPublicId(decoded.public_id);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: '無效的用戶'
      });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error('認證失敗:', error);
    res.status(401).json({
      success: false,
      error: '認證令牌無效'
    });
  }
};

module.exports = {
  postgresPool,
  mongoClient,
  redisClient,
  clickhouseClient,
  initializeConnections,
  getUserPermissions,
  getIdMapping,
  getPublicId,
  getUserByPublicId,
  getUserByEmail,
  checkPermission,
  authenticateToken
};
