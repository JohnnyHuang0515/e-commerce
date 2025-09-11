const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

// MongoDB 連接
const connectMongoDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://admin:password123@mongodb:27017/ecommerce?authSource=admin';
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      socketTimeoutMS: 5000
    });
    
    console.log('✅ DASHBOARD-SERVICE: MongoDB 連線成功');
    return true;
  } catch (error) {
    console.error('❌ DASHBOARD-SERVICE: MongoDB 連線失敗:', error);
    return false;
  }
};

// 初始化資料庫連接
connectMongoDB();

const dashboardRoutes = require('./routes/dashboard');
const { errorHandler } = require('./middleware/errorHandler');
const { logger } = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3008; // <--- 修正端口

// Swagger 配置
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Dashboard Service API',
      version: '1.0.0',
      description: '電商系統儀表板服務 API 文檔',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: '開發環境'
      }
    ],
  },
  apis: ['./src/routes/*.js']
};

const specs = swaggerJsdoc(swaggerOptions);

// 中間件
app.use(helmet());
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['DNT', 'User-Agent', 'X-Requested-With', 'If-Modified-Since', 'Cache-Control', 'Content-Type', 'Range', 'Authorization', 'x-request-id']
}));
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 健康檢查
app.get('/api/v1/health', (req, res) => {
  res.json({
    service: 'dashboard-service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

// Swagger 文檔
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// API 路由
app.use('/api/v1/dashboard', dashboardRoutes);

// 404 處理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API 端點不存在',
  });
});

// 錯誤處理
app.use(errorHandler);

// 啟動服務器
app.listen(PORT, () => {
  logger.info(`🚀 Dashboard Service 啟動成功 on port ${PORT}`);
});

module.exports = app;
