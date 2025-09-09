const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();

const dashboardRoutes = require('./routes/dashboard');
const { errorHandler } = require('./middleware/errorHandler');
const { logger } = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3011;

// Swagger 配置
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Dashboard Service API',
      version: '1.0.0',
      description: '電商系統儀表板服務 API 文檔',
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      }
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: '開發環境'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./src/routes/*.js']
};

const specs = swaggerJsdoc(swaggerOptions);

// 中間件
app.use(helmet());
app.use(cors());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 健康檢查
app.get('/api/v1/health', (req, res) => {
  res.json({
    service: 'dashboard-service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0'
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
    path: req.originalUrl
  });
});

// 錯誤處理
app.use(errorHandler);

// MongoDB 連線
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce_dashboard')
.then(() => {
  logger.info('✅ MongoDB 連線成功');
})
.catch((error) => {
  logger.error('❌ MongoDB 連線失敗:', error);
  process.exit(1);
});

// 優雅關閉
process.on('SIGTERM', async () => {
  logger.info('收到 SIGTERM 信號，準備關閉服務...');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('收到 SIGINT 信號，準備關閉服務...');
  await mongoose.connection.close();
  process.exit(0);
});

// 啟動服務器
app.listen(PORT, () => {
  logger.info(`🚀 Dashboard Service 啟動成功`);
  logger.info(`📍 服務地址: http://localhost:${PORT}`);
  logger.info(`📊 API 文檔: http://localhost:${PORT}/api-docs`);
  logger.info(`💚 健康檢查: http://localhost:${PORT}/api/v1/health`);
});

module.exports = app;
