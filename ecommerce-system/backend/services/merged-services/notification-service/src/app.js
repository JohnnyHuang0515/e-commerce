const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3007;

// 中間件
app.use(cors());
app.use(express.json());

// MongoDB 連接
const connectToMongoDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://mongodb:27017/ecommerce';
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB 連接成功');
  } catch (error) {
    console.error('❌ MongoDB 連接失敗:', error.message);
  }
};

// 健康檢查
app.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'Notification Service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    port: PORT,
    databases: {
      mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    }
  });
});

// 根路由
app.get('/', (req, res) => {
  res.json({
    success: true,
    service: 'Notification Service',
    message: '通知服務運行中',
    version: '1.0.0'
  });
});

// API 路由
app.get('/api/v1/notifications', (req, res) => {
  res.json({
    success: true,
    message: '通知列表 API - 待實現',
    data: []
  });
});

// 404 處理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: '路由未找到'
  });
});

// 錯誤處理
app.use((error, req, res, next) => {
  console.error('服務錯誤:', error);
  res.status(500).json({
    success: false,
    message: '內部服務器錯誤'
  });
});

// 啟動服務器
const startServer = async () => {
  await connectToMongoDB();
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Notification Service 啟動成功`);
    console.log(`📡 端口: ${PORT}`);
    console.log(`🌐 健康檢查: http://localhost:${PORT}/health`);
  });
};

startServer().catch(console.error);
