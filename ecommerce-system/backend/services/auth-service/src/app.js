const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const specs = require('./swagger');
require('dotenv').config();

const authRoutes = require('./routes/auth');

const app = express();
const PORT = 3005;

// 中間件
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 資料庫連線
mongoose.connect(process.env.MONGODB_URI || 'mongodb://admin:password123@localhost:27017/ecommerce?authSource=admin', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('✅ MongoDB 連線成功');
})
.catch((error) => {
  console.error('❌ MongoDB 連線失敗:', error);
});

// Swagger API 文檔
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: '電商系統 Auth Service API 文檔'
}));

// 健康檢查
/**
 * @swagger
 * /health:
 *   get:
 *     summary: 健康檢查
 *     description: 檢查服務是否正常運行
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: 服務正常
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: 'string', example: 'healthy' }
 *                 service: { type: 'string', example: 'auth-service' }
 *                 timestamp: { type: 'string', format: 'date-time' }
 */
app.get('/api/v1/health', async (req, res) => {
  try {
    // 檢查資料庫連線
    await mongoose.connection.db.admin().ping();
    
    res.json({
      status: 'healthy',
      service: 'auth-service',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      service: 'auth-service',
      error: error.message
    });
  }
});

// API 路由
app.use('/api/v1/auth', authRoutes);

// 404 處理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: '找不到請求的資源'
    }
  });
});

// 錯誤處理中間件
app.use((error, req, res, next) => {
  console.error('錯誤:', error);
  
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: '伺服器內部錯誤'
    }
  });
});

// 啟動伺服器
app.listen(PORT, () => {
  console.log(`🚀 Auth Service 啟動成功`);
  console.log(`📍 服務地址: http://localhost:${PORT}`);
  console.log(`📚 API 文檔: http://localhost:${PORT}/api-docs`);
  console.log(`🏥 健康檢查: http://localhost:${PORT}/api/v1/health`);
});

module.exports = app;
