const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
require('dotenv').config({ path: '../.env' });

// 資料庫連接 - 簡化版本
const { Client } = require('pg');
const { sequelize } = require('./models');
// const mongoose = require('mongoose'); // 暫時移除 mongoose

const testPostgresConnection = async () => {
  try {
    const client = new Client({
      host: process.env.POSTGRES_HOST || 'postgresql',
      port: process.env.POSTGRES_PORT || 5432,
      database: process.env.POSTGRES_DB || 'ecommerce_transactions',
      user: process.env.POSTGRES_USER || 'admin',
      password: process.env.POSTGRES_PASSWORD || 'password123',
    });
    
    await client.connect();
    await client.query('SELECT 1');
    await client.end();
    return true;
  } catch (error) {
    console.error('PostgreSQL 連接失敗:', error.message);
    return false;
  }
};

const testMongoConnection = async () => {
  try {
    // 暫時返回 false，因為 mongoose 被移除
    return false;
  } catch (error) {
    console.error('MongoDB 連接失敗:', error.message);
    return false;
  }
};

// 路由
const orderRoutes = require('./routes/order');
const paymentRoutes = require('./routes/payment');
const logisticsRoutes = require('./routes/logistics');

const app = express();
const PORT = process.env.PORT || 3003;

// 中間件
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 速率限制
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
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
      title: 'ORDER Service API',
      version: '1.0.0',
      description: '合併訂單、支付、物流管理服務 API 文檔'
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
    const postgresStatus = await testPostgresConnection();
    const mongoStatus = await testMongoConnection();
    
    res.json({
      success: true,
      service: 'ORDER Service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      databases: {
        postgresql: postgresStatus ? 'connected' : 'disconnected',
        mongodb: mongoStatus ? 'connected' : 'disconnected'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      service: 'ORDER Service',
      status: 'unhealthy',
      error: error.message
    });
  }
});

// API 健康檢查
app.get('/api/v1/health', async (req, res) => {
  try {
    const postgresStatus = await testPostgresConnection();
    const mongoStatus = await testMongoConnection();
    
    res.json({
      success: true,
      service: 'ORDER Service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      databases: {
        postgresql: postgresStatus ? 'connected' : 'disconnected',
        mongodb: mongoStatus ? 'connected' : 'disconnected'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      service: 'ORDER Service',
      status: 'unhealthy',
      error: error.message
    });
  }
});

// API 路由
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/logistics', logisticsRoutes);

// 簡單的 API 端點
app.get('/api/v1/orders', (req, res) => {
  res.json({
    success: true,
    message: 'Order Service API',
    data: [],
    endpoints: {
      orders: '/api/v1/orders',
      payments: '/api/v1/payments',
      logistics: '/api/v1/logistics'
    }
  });
});

app.get('/api/v1/payments', (req, res) => {
  res.json({
    success: true,
    message: 'Payment Service API',
    data: [],
    endpoints: {
      orders: '/api/v1/orders',
      payments: '/api/v1/payments',
      logistics: '/api/v1/logistics'
    }
  });
});

app.get('/api/v1/logistics', (req, res) => {
  res.json({
    success: true,
    message: 'Logistics Service API',
    data: [],
    endpoints: {
      orders: '/api/v1/orders',
      payments: '/api/v1/payments',
      logistics: '/api/v1/logistics'
    }
  });
});

// 根路由
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'ORDER Service - 合併訂單、支付、物流管理服務',
    version: '1.0.0',
    endpoints: {
      orders: '/api/v1/orders',
      payments: '/api/v1/payments',
      logistics: '/api/v1/logistics',
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
  console.error('ORDER Service Error:', error);
  
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
    
    // PostgreSQL 初始化
    const postgresConnected = await testPostgresConnection();
    
    console.log('✅ 資料庫初始化完成');
    console.log(`   - PostgreSQL: ${postgresConnected ? '已連接' : '連接失敗'}`);
    
  } catch (error) {
    console.error('❌ 資料庫初始化失敗:', error);
    process.exit(1);
  }
};

// 啟動服務器
const startServer = async () => {
  try {
    await initializeDatabase();
    
    app.listen(PORT, () => {
      console.log('');
      console.log('🚀 ORDER Service 啟動成功!');
      console.log('================================');
      console.log(`📍 服務地址: http://localhost:${PORT}`);
      console.log(`📚 API 文檔: http://localhost:${PORT}/api-docs`);
      console.log(`🔍 健康檢查: http://localhost:${PORT}/health`);
      console.log('');
      console.log('🔗 API 端點:');
      console.log('   - 訂單: /api/v1/orders');
      console.log('   - 支付: /api/v1/payments');
      console.log('   - 物流: /api/v1/logistics');
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
    await sequelize.close();
    console.log('✅ ORDER Service 已優雅關閉');
    process.exit(0);
  } catch (error) {
    console.error('❌ 關閉服務時發生錯誤:', error);
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  console.log('🔄 收到 SIGINT 信號，正在關閉服務...');
  try {
    await sequelize.close();
    console.log('✅ ORDER Service 已優雅關閉');
    process.exit(0);
  } catch (error) {
    console.error('❌ 關閉服務時發生錯誤:', error);
    process.exit(1);
  }
});

// 啟動服務
startServer();

module.exports = app;
