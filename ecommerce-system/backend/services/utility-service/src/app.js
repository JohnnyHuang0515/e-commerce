const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

// MongoDB 連接配置
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:password123@localhost:27017/ecommerce?authSource=admin';

// 創建 Express 應用
const app = express();
const PORT = process.env.PORT || 3019;

// 中間件
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// MongoDB 連接測試
const testMongoConnection = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      return true;
    }
    
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      socketTimeoutMS: 5000
    });
    
    return true;
  } catch (error) {
    console.error('MongoDB 連接失敗:', error.message);
    return false;
  }
};

// 健康檢查
app.get('/health', async (req, res) => {
  try {
    const mongoStatus = await testMongoConnection();
    
    res.json({
      success: true,
      service: 'Utility Service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      databases: {
        mongodb: mongoStatus ? 'connected' : 'disconnected'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      service: 'Utility Service',
      status: 'unhealthy',
      error: error.message,
      databases: {
        mongodb: 'disconnected'
      }
    });
  }
});

// API 健康檢查
app.get('/api/v1/health', async (req, res) => {
  try {
    const mongoStatus = await testMongoConnection();
    
    res.json({
      success: true,
      service: 'Utility Service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      databases: {
        mongodb: mongoStatus ? 'connected' : 'disconnected'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      service: 'Utility Service',
      status: 'unhealthy',
      error: error.message,
      databases: {
        mongodb: 'disconnected'
      }
    });
  }
});

// 根路由
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Utility Service - 工具服務',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      apiHealth: '/api/v1/health'
    }
  });
});

// 404 處理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API 端點不存在',
    path: req.originalUrl
  });
});

// 錯誤處理中間件
app.use((error, req, res, next) => {
  console.error('Log Service Error:', error);
  
  res.status(error.status || 500).json({
    success: false,
    message: error.message || '內部服務器錯誤',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// 啟動服務器
app.listen(PORT, () => {
  console.log('');
  console.log('🚀 Utility Service 啟動成功!');
  console.log('================================');
  console.log(`📍 服務地址: http://localhost:${PORT}`);
  console.log(`🔍 健康檢查: http://localhost:${PORT}/health`);
  console.log('================================');
});

module.exports = app;
