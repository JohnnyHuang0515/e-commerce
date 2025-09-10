const { Sequelize } = require('sequelize');
require('dotenv').config();

// 創建 Sequelize 實例
const sequelize = new Sequelize(
  process.env.POSTGRES_DB || 'ecommerce_transactions',
  process.env.POSTGRES_USER || 'admin',
  process.env.POSTGRES_PASSWORD || 'password123',
  {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: process.env.POSTGRES_PORT || 5432,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// 測試資料庫連接
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Payment Service: PostgreSQL 連接成功');
    return true;
  } catch (error) {
    console.error('Payment Service: PostgreSQL 連接失敗:', error.message);
    return false;
  }
};

// 同步資料庫
const syncDatabase = async (force = false) => {
  try {
    await sequelize.sync({ force });
    console.log('Payment Service: 資料庫同步完成');
    return true;
  } catch (error) {
    console.error('Payment Service: 資料庫同步失敗:', error.message);
    return false;
  }
};

module.exports = {
  sequelize,
  testConnection,
  syncDatabase
};