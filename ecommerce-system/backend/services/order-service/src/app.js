const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();

const { sequelize, testConnection, syncDatabase } = require('./config/database');
const orderRoutes = require('./routes/order');
const swaggerSpec = require('./swagger');

const app = express();
const PORT = process.env.PORT || 3003;

// PostgreSQL 連線
const initializeDatabase = async () => {
  try {
    const connected = await testConnection();
    if (connected) {
      // 同步數據庫（僅在開發環境）
      if (process.env.NODE_ENV === 'development') {
        await syncDatabase(false); // 不強制重建表
      }
    }
  } catch (error) {
    console.error('❌ 數據庫初始化失敗:', error);
  }
};

// 初始化數據庫
initializeDatabase();

// 速率限制
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 分鐘
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 限制每個 IP 100 個請求
  message: {
    success: false,
    message: '請求過於頻繁，請稍後再試'
  }
});

// 中間件
app.use(helmet()); // 安全標頭
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('combined')); // 日誌記錄
app.use(limiter); // 速率限制
app.use(express.json({ limit: '10mb' })); // JSON 解析
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // URL 編碼解析

// API 路由
app.use('/api/v1/orders', orderRoutes);

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Order Service API Documentation'
}));

// 健康檢查
app.get('/api/v1/health', async (req, res) => {
  try {
    // 檢查 PostgreSQL 連線
    await sequelize.authenticate();
    const dbStatus = 'connected';
    
    res.json({
      success: true,
      service: 'Order Service',
      version: '1.0.0',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: dbStatus
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      service: 'Order Service',
      status: 'unhealthy',
      error: error.message
    });
  }
});

// 根路徑
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Order Service API',
    version: '1.0.0',
    endpoints: {
      orders: '/api/v1/orders',
      documentation: '/api-docs',
      health: '/api/v1/health'
    }
  });
});

// 404 處理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API 端點不存在',
    path: req.path
  });
});

// 錯誤處理中間件
app.use((error, req, res, next) => {
  console.error('Order Service 錯誤:', error);
  
  res.status(error.status || 500).json({
    success: false,
    message: error.message || '內部伺服器錯誤',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// 啟動伺服器
app.listen(PORT, () => {
  console.log(`🚀 Order Service 啟動成功`);
  console.log(`📍 服務地址: http://localhost:${PORT}`);
  console.log(`📚 API 文檔: http://localhost:${PORT}/api-docs`);
  console.log(`💚 健康檢查: http://localhost:${PORT}/api/v1/health`);
  console.log(`⏰ 啟動時間: ${new Date().toLocaleString('zh-TW')}`);
});

// 優雅關閉
process.on('SIGTERM', async () => {
  console.log('🛑 收到 SIGTERM 信號，準備關閉 Order Service...');
  await mongoose.connection.close();
  console.log('✅ MongoDB 連線已關閉');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 收到 SIGINT 信號，準備關閉 Order Service...');
  await sequelize.close();
  console.log('✅ PostgreSQL 連線已關閉');
  process.exit(0);
});

module.exports = app;
