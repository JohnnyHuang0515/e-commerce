const { createPostgresConnection } = require('../../../shared-config/postgres');

// 使用統一的 PostgreSQL 配置
const { sequelize, testConnection } = createPostgresConnection('PRODUCT Service');

module.exports = {
  sequelize,
  testConnection
};
