const { Sequelize } = require('sequelize');

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
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  }
);

// 測試資料庫連接
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Inventory Service: PostgreSQL 連接成功');
    return true;
  } catch (error) {
    console.error('Inventory Service: PostgreSQL 連接失敗:', error.message);
    throw error;
  }
};

// 同步資料庫
const syncDatabase = async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log('Inventory Service: PostgreSQL 資料庫同步完成');
    return true;
  } catch (error) {
    console.error('Inventory Service: PostgreSQL 資料庫同步失敗:', error.message);
    throw error;
  }
};

module.exports = {
  sequelize,
  testConnection,
  syncDatabase
};