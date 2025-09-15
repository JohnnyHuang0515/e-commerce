const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const { initializeConnections } = require('./config/database');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// 導入路由
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const cartRoutes = require('./routes/cart');
const recommendationRoutes = require('./routes/recommendations');
const dashboardRoutes = require('./routes/dashboard');
const categoryRoutes = require('./routes/categories');
const inventoryRoutes = require('./routes/inventory');

const app = express();

// 基本中間件
app.use(helmet()); // 安全標頭
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 請求日誌中間件
app.use((req, res, next) => {
  const start = Date.now();
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - IP: ${req.ip}`);
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
  });
  
  next();
});

// 速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分鐘
  max: 100, // 限制每個 IP 每 15 分鐘最多 100 個請求
  message: {
    success: false,
    error: '請求過於頻繁，請稍後再試',
    code: 'TOO_MANY_REQUESTS'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// 更嚴格的認證端點速率限制
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分鐘
  max: 5, // 認證端點每 15 分鐘最多 5 次嘗試
  message: {
    success: false,
    error: '登入嘗試過於頻繁，請稍後再試',
    code: 'AUTH_TOO_MANY_REQUESTS'
  }
});

app.use('/api/v1/auth/login', authLimiter);

// Swagger 文檔配置
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '電商系統 API',
      version: '1.0.0',
      description: '基於 Node.js 的電商系統 API 文檔',
      contact: {
        name: 'API 支援',
        email: 'support@ecommerce.com'
      }
    },
    servers: [
      {
        url: process.env.API_BASE_URL || 'http://localhost:3001',
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
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./routes/*.js'] // 掃描路由文件中的 Swagger 註解
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: '電商系統 API 文檔'
}));

// API 文檔 JSON
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// 健康檢查端點
app.get('/health', async (req, res) => {
  try {
    const { postgresPool, mongoClient, redisClient, clickhouseClient } = require('./config/database');
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {}
    };
    
    // 檢查 PostgreSQL
    try {
      await postgresPool.query('SELECT NOW()');
      health.services.postgresql = { status: 'healthy', response_time: Date.now() };
    } catch (error) {
      health.services.postgresql = { status: 'unhealthy', error: error.message };
      health.status = 'degraded';
    }
    
    // 檢查 MongoDB
    try {
      await mongoClient.db('admin').admin().ping();
      health.services.mongodb = { status: 'healthy', response_time: Date.now() };
    } catch (error) {
      health.services.mongodb = { status: 'unhealthy', error: error.message };
      health.status = 'degraded';
    }
    
    // 檢查 Redis
    try {
      await redisClient.ping();
      health.services.redis = { status: 'healthy', response_time: Date.now() };
    } catch (error) {
      health.services.redis = { status: 'unhealthy', error: error.message };
      health.status = 'degraded';
    }
    
    // 檢查 ClickHouse
    try {
      await clickhouseClient.query('SELECT 1');
      health.services.clickhouse = { status: 'healthy', response_time: Date.now() };
    } catch (error) {
      health.services.clickhouse = { status: 'unhealthy', error: error.message };
      health.status = 'degraded';
    }
    
    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// API 路由
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/cart', cartRoutes);
app.use('/api/v1/recommendations', recommendationRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/inventory', inventoryRoutes);

// API 版本信息
app.get('/api/v1', (req, res) => {
  res.json({
    success: true,
    data: {
      version: '1.0.0',
      name: '電商系統 API',
      description: '基於 Node.js 的電商系統 API',
      endpoints: {
        auth: '/api/v1/auth',
        users: '/api/v1/users',
        products: '/api/v1/products',
        orders: '/api/v1/orders',
        cart: '/api/v1/cart',
        recommendations: '/api/v1/recommendations',
        dashboard: '/api/v1/dashboard',
        categories: '/api/v1/categories',
        inventory: '/api/v1/inventory',
        docs: '/api-docs',
        health: '/health'
      },
      features: [
        'JWT 認證',
        'RBAC 權限控制',
        '多資料庫支援',
        'Redis 快取',
        'Swagger 文檔',
        '速率限制',
        '健康檢查'
      ]
    }
  });
});

// 根路徑
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '歡迎使用電商系統 API',
    version: '1.0.0',
    documentation: '/api-docs',
    health: '/health',
    api: '/api/v1'
  });
});

// 404 處理
app.use(notFoundHandler);

// 錯誤處理中間件（必須放在最後）
app.use(errorHandler);

// 優雅關閉處理
process.on('SIGTERM', async () => {
  console.log('收到 SIGTERM 信號，開始優雅關閉...');
  
  try {
    const { postgresPool, mongoClient, redisClient } = require('./config/database');
    
    // 關閉資料庫連接
    await postgresPool.end();
    await mongoClient.close();
    await redisClient.quit();
    
    console.log('所有資料庫連接已關閉');
    process.exit(0);
  } catch (error) {
    console.error('關閉資料庫連接時發生錯誤:', error);
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  console.log('收到 SIGINT 信號，開始優雅關閉...');
  
  try {
    const { postgresPool, mongoClient, redisClient } = require('./config/database');
    
    // 關閉資料庫連接
    await postgresPool.end();
    await mongoClient.close();
    await redisClient.quit();
    
    console.log('所有資料庫連接已關閉');
    process.exit(0);
  } catch (error) {
    console.error('關閉資料庫連接時發生錯誤:', error);
    process.exit(1);
  }
});

// 未處理的 Promise 拒絕
process.on('unhandledRejection', (reason, promise) => {
  console.error('未處理的 Promise 拒絕:', reason);
  console.error('Promise:', promise);
});

// 未捕獲的異常
process.on('uncaughtException', (error) => {
  console.error('未捕獲的異常:', error);
  process.exit(1);
});

// 初始化資料庫連接
const startServer = async () => {
  try {
    console.log('正在初始化資料庫連接...');
    await initializeConnections();
    console.log('✅ 所有資料庫連接初始化成功');
    
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      console.log(`🚀 電商系統 API 服務已啟動`);
      console.log(`📡 服務地址: http://localhost:${PORT}`);
      console.log(`📚 API 文檔: http://localhost:${PORT}/api-docs`);
      console.log(`🏥 健康檢查: http://localhost:${PORT}/health`);
      console.log(`🔧 環境: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ 服務啟動失敗:', error);
    process.exit(1);
  }
};

// 啟動服務
startServer();

module.exports = app;
