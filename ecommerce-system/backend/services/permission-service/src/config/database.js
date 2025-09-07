const { Sequelize } = require('sequelize');

// 從環境變數讀取資料庫配置
const config = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'ecommerce_transactions',
  username: process.env.POSTGRES_USER || 'admin',
  password: process.env.POSTGRES_PASSWORD || 'password123',
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true
  }
};

// 創建 Sequelize 實例
const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  port: config.port,
  dialect: config.dialect,
  logging: config.logging,
  pool: config.pool,
  define: config.define
});

// 測試資料庫連線
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL 連線成功');
    return true;
  } catch (error) {
    console.error('❌ PostgreSQL 連線失敗:', error.message);
    return false;
  }
}

// 同步資料庫
async function syncDatabase() {
  try {
    await sequelize.sync({ alter: true });
    console.log('✅ 資料庫同步成功');
    return true;
  } catch (error) {
    console.error('❌ 資料庫同步失敗:', error.message);
    return false;
  }
}

module.exports = {
  sequelize,
  testConnection,
  syncDatabase
};