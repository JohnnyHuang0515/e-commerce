const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const { testConnection, syncDatabase } = require('./config/database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3009;

// 初始化資料庫
const initializeDatabase = async () => {
  try {
    await testConnection();
    await syncDatabase();
    console.log('Payment Service: 資料庫初始化完成');
  } catch (error) {
    console.error('Payment Service: 資料庫初始化失敗:', error.message);
    process.exit(1);
  }
};

initializeDatabase();

// 中間件設定
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 速率限制
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 分鐘
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 限制每個 IP 100 次請求
  message: {
    success: false,
    message: '請求過於頻繁，請稍後再試',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Swagger 設定
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Payment Service API',
      version: '1.0.0',
      description: '電商系統支付服務 API 文檔',
      contact: {
        name: '電商系統開發團隊',
        email: 'dev@ecommerce.com',
      },
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: '開發環境',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// 路由
app.use('/api/v1/payments', require('./routes/payment'));

// 健康檢查
app.get('/api/v1/health', async (req, res) => {
  try {
    const { sequelize } = require('./config/database');
    await sequelize.authenticate();
    res.json({
      success: true,
      message: 'Payment Service 運行正常',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      database: 'connected'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Payment Service 資料庫連接異常',
      error: error.message
    });
  }
});

// 根路由
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Payment Service API',
    version: '1.0.0',
    documentation: `/api-docs`,
    health: `/api/v1/health`,
  });
});

// 404 處理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API 端點不存在',
    path: req.originalUrl,
  });
});

// 錯誤處理中間件
app.use((error, req, res, next) => {
  console.error('未處理的錯誤:', error);
  
  // Sequelize 錯誤處理
  if (error.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      message: '資料驗證失敗',
      errors: error.errors.map(err => ({
        field: err.path,
        message: err.message
      }))
    });
  }
  
  if (error.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      success: false,
      message: '資料重複',
      field: error.errors[0].path
    });
  }
  
  res.status(error.status || 500).json({
    success: false,
    message: error.message || '伺服器內部錯誤',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
});

// 優雅關閉
process.on('SIGTERM', async () => {
  console.log('收到 SIGTERM 信號，開始優雅關閉...');
  const { sequelize } = require('./config/database');
  await sequelize.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('收到 SIGINT 信號，開始優雅關閉...');
  const { sequelize } = require('./config/database');
  await sequelize.close();
  process.exit(0);
});

// 啟動伺服器
app.listen(PORT, () => {
  console.log(`🚀 Payment Service 啟動成功`);
  console.log(`📡 服務地址: http://localhost:${PORT}`);
  console.log(`🏥 健康檢查: http://localhost:${PORT}/api/v1/health`);
  console.log(`📚 API 文檔: http://localhost:${PORT}/api-docs`);
  console.log(`⏰ 啟動時間: ${new Date().toLocaleString('zh-TW')}`);
});

module.exports = app;
