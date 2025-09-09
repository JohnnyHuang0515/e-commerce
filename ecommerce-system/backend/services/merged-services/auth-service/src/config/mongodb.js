const mongoose = require('mongoose');

// MongoDB 連接配置
const connectMongoDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://admin:password123@localhost:27017/ecommerce?authSource=admin';
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('✅ AUTH Service: MongoDB 連線成功');
    return true;
  } catch (error) {
    console.error('❌ AUTH Service: MongoDB 連線失敗:', error);
    return false;
  }
};

// 斷開連接
const disconnectMongoDB = async () => {
  try {
    await mongoose.disconnect();
    console.log('✅ AUTH Service: MongoDB 連線已關閉');
    return true;
  } catch (error) {
    console.error('❌ AUTH Service: MongoDB 斷開連接失敗:', error);
    return false;
  }
};

module.exports = {
  connectMongoDB,
  disconnectMongoDB
};
