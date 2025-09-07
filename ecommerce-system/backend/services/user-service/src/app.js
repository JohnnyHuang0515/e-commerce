const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const specs = require('./swagger');
require('dotenv').config();

const { sequelize, testConnection, syncDatabase } = require('./config/database');
const userRoutes = require('./routes/user');

const app = express();
const PORT = process.env.PORT || 3002;

// 中間件
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Swagger API 文檔
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: '電商系統 User Service API 文檔'
}));

// 健康檢查
app.get('/api/v1/health', async (req, res) => {
  try {
    // 檢查 PostgreSQL 連線
    await sequelize.authenticate();
    const dbStatus = 'connected';
    
    res.json({
      success: true,
      data: {
        service: 'User Service',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: dbStatus,
        uptime: process.uptime()
      },
      message: '服務正常運行'
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: '服務異常',
      error: error.message
    });
  }
});

// API 路由
app.use('/api/v1/users', userRoutes);

// 404 處理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '找不到請求的資源',
    error: `路徑 ${req.originalUrl} 不存在`
  });
});

// 錯誤處理中間件
app.use((error, req, res, next) => {
  console.error('錯誤:', error);
  
  res.status(error.status || 500).json({
    success: false,
    message: error.message || '內部伺服器錯誤',
    error: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });
});

// 啟動伺服器
app.listen(PORT, () => {
  console.log(`🚀 User Service 啟動成功`);
  console.log(`📍 服務地址: http://localhost:${PORT}`);
  console.log(`📚 API 文檔: http://localhost:${PORT}/api-docs`);
  console.log(`🏥 健康檢查: http://localhost:${PORT}/api/v1/health`);
  console.log(`🔗 API 端點: http://localhost:${PORT}/api/v1/users`);
});

module.exports = app;
