const mongoose = require('mongoose');

// MongoDB 連接配置
const connectMongoDB = async () => {
  try {
    // 如果已經連接，直接返回 true
    if (mongoose.connection.readyState === 1) {
      return true;
    }

    const mongoUri = process.env.MONGODB_URI || 'mongodb://admin:password123@localhost:27017/ecommerce?authSource=admin';
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // 5秒超時
      connectTimeoutMS: 5000, // 5秒連接超時
      socketTimeoutMS: 5000 // 5秒套接字超時
    });
    
    console.log('✅ AI Service: MongoDB 連線成功');
    return true;
  } catch (error) {
    console.error('❌ AI Service: MongoDB 連線失敗:', error);
    return false;
  }
};

// 斷開連接
const disconnectMongoDB = async () => {
  try {
    await mongoose.disconnect();
    console.log('✅ AI Service: MongoDB 連線已關閉');
    return true;
  } catch (error) {
    console.error('❌ AI Service: MongoDB 斷開連接失敗:', error);
    return false;
  }
};

module.exports = {
  connectMongoDB,
  disconnectMongoDB
};
