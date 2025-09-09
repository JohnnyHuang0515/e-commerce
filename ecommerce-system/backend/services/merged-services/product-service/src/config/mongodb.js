const { createMongoConnection } = require('../../../shared-config/mongodb');

// 使用統一的 MongoDB 配置
const { connectMongoDB, disconnectMongoDB } = createMongoConnection('PRODUCT Service');

module.exports = {
  connectMongoDB,
  disconnectMongoDB
};
