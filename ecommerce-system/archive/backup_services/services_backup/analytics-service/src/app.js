const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();

const analyticsRoutes = require('./routes/analytics');
const specs = require('./swagger');

const app = express();
const PORT = process.env.PORT || 3006;

// 連線到 MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://admin:password123@localhost:27017/ecommerce?authSource=admin')
  .then(() => {
    console.log('✅ Analytics Service 已連線到 MongoDB');
  })
  .catch((error) => {
    console.error('❌ MongoDB 連線失敗:', error);
  });

// 中間件
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// 請求限制
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 分鐘
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 限制每個 IP 100 個請求
  message: {
    success: false,
    message: '請求過於頻繁，請稍後再試'
  }
});
app.use('/api/', limiter);

// 日誌記錄
app.use(morgan('combined'));

// 解析 JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API 路由
app.use('/api/v1/analytics', analyticsRoutes);

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Analytics Service API 文檔'
}));

// 健康檢查
app.get('/api/v1/health', (req, res) => {
  res.json({
    success: true,
    service: 'Analytics Service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// 根路徑
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Analytics Service API',
    version: '1.0.0',
    documentation: '/api-docs',
    health: '/api/v1/health'
  });
});

// 404 處理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: '找不到請求的資源'
  });
});

// 錯誤處理中間件
app.use((error, req, res, next) => {
  console.error('Analytics Service 錯誤:', error);
  
  res.status(error.status || 500).json({
    success: false,
    message: error.message || '伺服器內部錯誤',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// 優雅關閉
process.on('SIGTERM', async () => {
  console.log('🛑 收到 SIGTERM 信號，準備關閉 Analytics Service...');
  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB 連線已關閉');
    process.exit(0);
  } catch (error) {
    console.error('❌ 關閉 MongoDB 連線時發生錯誤:', error);
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  console.log('🛑 收到 SIGINT 信號，準備關閉 Analytics Service...');
  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB 連線已關閉');
    process.exit(0);
  } catch (error) {
    console.error('❌ 關閉 MongoDB 連線時發生錯誤:', error);
    process.exit(1);
  }
});

// 啟動伺服器
app.listen(PORT, () => {
  console.log('🚀 Analytics Service 啟動成功');
  console.log(`📍 服務地址: http://localhost:${PORT}`);
  console.log(`📚 API 文檔: http://localhost:${PORT}/api-docs`);
  console.log(`💚 健康檢查: http://localhost:${PORT}/api/v1/health`);
  console.log(`⏰ 啟動時間: ${new Date().toLocaleString('zh-TW')}`);
});
