const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();

const settingsRoutes = require('./routes/settings');
const specs = require('./swagger');
const { testConnection, syncDatabase } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3007;

// 初始化資料庫
const initializeDatabase = async () => {
  try {
    await testConnection();
    await syncDatabase();
    console.log('Settings Service: 資料庫初始化完成');
  } catch (error) {
    console.error('Settings Service: 資料庫初始化失敗:', error.message);
    process.exit(1);
  }
};

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
app.use('/api/v1/settings', settingsRoutes);

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Settings Service API 文檔'
}));

// 健康檢查
app.get('/api/v1/health', async (req, res) => {
  try {
    const { sequelize } = require('./config/database');
    await sequelize.authenticate();
    
    res.json({
      success: true,
      message: 'Settings Service 運行正常',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      database: 'connected'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Settings Service 運行異常',
      error: error.message
    });
  }
});

// 根路徑
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Settings Service API',
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
  console.error('Settings Service 錯誤:', error);
  
  // Sequelize 錯誤處理
  if (error.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      message: '資料驗證錯誤',
      errors: error.errors.map(err => ({
        field: err.path,
        message: err.message
      }))
    });
  }
  
  if (error.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      success: false,
      message: '資料重複錯誤',
      field: error.errors[0].path
    });
  }
  
  res.status(error.status || 500).json({
    success: false,
    message: error.message || '伺服器內部錯誤',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// 優雅關閉
process.on('SIGTERM', async () => {
  console.log('🛑 收到 SIGTERM 信號，準備關閉 Settings Service...');
  try {
    const { sequelize } = require('./config/database');
    await sequelize.close();
    console.log('✅ Settings Service 已優雅關閉');
    process.exit(0);
  } catch (error) {
    console.error('❌ 關閉 Settings Service 時發生錯誤:', error);
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  console.log('🛑 收到 SIGINT 信號，準備關閉 Settings Service...');
  try {
    const { sequelize } = require('./config/database');
    await sequelize.close();
    console.log('✅ Settings Service 已優雅關閉');
    process.exit(0);
  } catch (error) {
    console.error('❌ 關閉 Settings Service 時發生錯誤:', error);
    process.exit(1);
  }
});

// 啟動伺服器
const startServer = async () => {
  try {
    await initializeDatabase();
    
    app.listen(PORT, () => {
      console.log('🚀 Settings Service 啟動成功');
      console.log(`📡 服務地址: http://localhost:${PORT}`);
      console.log(`🏥 健康檢查: http://localhost:${PORT}/api/v1/health`);
      console.log(`📚 API 文檔: http://localhost:${PORT}/api-docs`);
      console.log(`⏰ 啟動時間: ${new Date().toLocaleString('zh-TW')}`);
    });
  } catch (error) {
    console.error('❌ Settings Service 啟動失敗:', error);
    process.exit(1);
  }
};

startServer();
