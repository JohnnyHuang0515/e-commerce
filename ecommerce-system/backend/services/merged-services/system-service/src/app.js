const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
require('dotenv').config();

// 資料庫連接
const { connectMongoDB } = require('./config/mongodb');
const { testPostgresConnection, closePostgresPool } = require('./config/postgres');

// 路由
const systemRoutes = require('./routes/system');
const monitoringRoutes = require('./routes/monitoring');
const utilityRoutes = require('./routes/utility');
const notificationRoutes = require('./routes/notification');
const logRoutes = require('./routes/log');

const app = express();
const PORT = process.env.PORT || 3005;

// 中間件
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// 速率限制
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 200,
  message: {
    success: false,
    message: '請求過於頻繁，請稍後再試'
  }
});
app.use('/api/', limiter);

// Swagger 配置
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'System Service API',
      version: '1.0.0',
      description: '合併系統管理、監控、工具服務 API 文檔'
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: '開發環境'
      }
    ]
  },
  apis: ['./src/routes/*.js']
};

const specs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// 健康檢查
app.get('/health', async (req, res) => {
  try {
    const mongoStatus = await connectMongoDB();
    const postgresStatus = await testPostgresConnection();
    
    res.json({
      success: true,
      service: 'System Service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      databases: {
        mongodb: mongoStatus ? 'connected' : 'disconnected',
        postgresql: postgresStatus ? 'connected' : 'disconnected'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      service: 'System Service',
      status: 'unhealthy',
      error: error.message
    });
  }
});

// API 路由
app.use('/api/v1/system', systemRoutes);
app.use('/api/v1/monitoring', monitoringRoutes);
app.use('/api/v1/utilities', utilityRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/logs', logRoutes);

// 根路由
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'System Service - 合併系統管理、監控、工具服務',
    version: '1.0.0',
    endpoints: {
      system: '/api/v1/system',
      monitoring: '/api/v1/monitoring',
      utilities: '/api/v1/utilities',
      notifications: '/api/v1/notifications',
      logs: '/api/v1/logs',
      docs: '/api-docs',
      health: '/health'
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
  console.error('System Service Error:', error);
  
  res.status(error.status || 500).json({
    success: false,
    message: error.message || '內部服務器錯誤',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// 初始化資料庫
const initializeDatabase = async () => {
  try {
    console.log('🔄 初始化資料庫連接...');
    
    // MongoDB 初始化
    const mongoConnected = await connectMongoDB();
    
    // PostgreSQL 初始化
    const postgresConnected = await testPostgresConnection();
    
    console.log('✅ 資料庫初始化完成');
    console.log(`   - MongoDB: ${mongoConnected ? '已連接' : '連接失敗'}`);
    console.log(`   - PostgreSQL: ${postgresConnected ? '已連接' : '連接失敗'}`);
    
  } catch (error) {
    console.error('❌ 資料庫初始化失敗:', error);
    // 不退出，繼續啟動服務
    console.log('⚠️ 繼續啟動服務，但某些功能可能不可用');
  }
};

// 啟動服務器
const startServer = async () => {
  try {
    await initializeDatabase();
    
    app.listen(PORT, () => {
      console.log('');
      console.log('🚀 SYSTEM Service 啟動成功!');
      console.log('================================');
      console.log(`📍 服務地址: http://localhost:${PORT}`);
      console.log(`📚 API 文檔: http://localhost:${PORT}/api-docs`);
      console.log(`🔍 健康檢查: http://localhost:${PORT}/health`);
      console.log('');
      console.log('🔗 API 端點:');
      console.log('   - 系統管理: /api/v1/system');
      console.log('   - 監控: /api/v1/monitoring');
      console.log('   - 工具: /api/v1/utilities');
      console.log('   - 通知: /api/v1/notifications');
      console.log('   - 日誌: /api/v1/logs');
      console.log('================================');
    });
  } catch (error) {
    console.error('❌ 服務啟動失敗:', error);
    process.exit(1);
  }
};

// 優雅關閉
process.on('SIGTERM', async () => {
  console.log('🔄 收到 SIGTERM 信號，正在關閉服務...');
  try {
    await closePostgresPool();
    console.log('✅ SYSTEM Service 已優雅關閉');
    process.exit(0);
  } catch (error) {
    console.error('❌ 關閉服務時發生錯誤:', error);
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  console.log('🔄 收到 SIGINT 信號，正在關閉服務...');
  try {
    await closePostgresPool();
    console.log('✅ SYSTEM Service 已優雅關閉');
    process.exit(0);
  } catch (error) {
    console.error('❌ 關閉服務時發生錯誤:', error);
    process.exit(1);
  }
});

// 啟動服務
startServer();

module.exports = app;
