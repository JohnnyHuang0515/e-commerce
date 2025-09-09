const { Pool } = require('pg');

// PostgreSQL 連接池配置
let pool = null;

// 創建 PostgreSQL 連接池
const createPostgresPool = () => {
  if (pool) {
    return pool;
  }

  const config = {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: process.env.POSTGRES_PORT || 5432,
    database: process.env.POSTGRES_DB || 'ecommerce',
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'password123',
    max: 20, // 最大連接數
    idleTimeoutMillis: 30000, // 空閒連接超時
    connectionTimeoutMillis: 5000, // 連接超時
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  };

  pool = new Pool(config);

  // 連接池錯誤處理
  pool.on('error', (err) => {
    console.error('❌ SYSTEM Service: PostgreSQL 連接池錯誤:', err);
  });

  return pool;
};

// 測試 PostgreSQL 連接
const testPostgresConnection = async () => {
  try {
    const currentPool = createPostgresPool();
    const client = await currentPool.connect();
    
    // 執行簡單查詢測試連接
    await client.query('SELECT NOW()');
    client.release();
    
    console.log('✅ SYSTEM Service: PostgreSQL 連線成功');
    return true;
  } catch (error) {
    console.error('❌ SYSTEM Service: PostgreSQL 連線失敗:', error);
    return false;
  }
};

// 獲取 PostgreSQL 連接池
const getPostgresPool = () => {
  return createPostgresPool();
};

// 關閉 PostgreSQL 連接池
const closePostgresPool = async () => {
  try {
    if (pool) {
      await pool.end();
      pool = null;
      console.log('✅ SYSTEM Service: PostgreSQL 連接池已關閉');
      return true;
    }
    return true;
  } catch (error) {
    console.error('❌ SYSTEM Service: 關閉 PostgreSQL 連接池失敗:', error);
    return false;
  }
};

// 執行 PostgreSQL 查詢
const queryPostgres = async (text, params = []) => {
  try {
    const currentPool = getPostgresPool();
    const result = await currentPool.query(text, params);
    return result;
  } catch (error) {
    console.error('❌ SYSTEM Service: PostgreSQL 查詢錯誤:', error);
    throw error;
  }
};

module.exports = {
  createPostgresPool,
  testPostgresConnection,
  getPostgresPool,
  closePostgresPool,
  queryPostgres
};
