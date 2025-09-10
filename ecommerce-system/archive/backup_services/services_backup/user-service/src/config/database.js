const { Sequelize } = require('sequelize');
require('dotenv').config();

// PostgreSQL 連接配置
const sequelize = new Sequelize(
  process.env.POSTGRES_DB || 'ecommerce_transactions',
  process.env.POSTGRES_USER || 'admin',
  process.env.POSTGRES_PASSWORD || 'password123',
  {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: process.env.POSTGRES_PORT || 5432,
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
    },
    timezone: '+08:00' // 台灣時區
  }
);

// 測試連接
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL 連線成功');
    return true;
  } catch (error) {
    console.error('❌ PostgreSQL 連線失敗:', error);
    return false;
  }
};

// 同步數據庫
const syncDatabase = async (force = false) => {
  try {
    await sequelize.sync({ force });
    console.log('✅ 數據庫同步成功');
    return true;
  } catch (error) {
    console.error('❌ 數據庫同步失敗:', error);
    return false;
  }
};

module.exports = {
  sequelize,
  testConnection,
  syncDatabase
};
