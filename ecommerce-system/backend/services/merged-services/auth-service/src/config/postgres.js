const { Sequelize } = require('sequelize');
require('dotenv').config();

// 統一的 PostgreSQL 連接配置
const createPostgresConnection = (serviceName) => {
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
      console.log(`✅ ${serviceName}: PostgreSQL 連線成功`);
      return true;
    } catch (error) {
      console.error(`❌ ${serviceName}: PostgreSQL 連線失敗:`, error);
      return false;
    }
  };

  return {
    sequelize,
    testConnection
  };
};

module.exports = {
  createPostgresConnection
};