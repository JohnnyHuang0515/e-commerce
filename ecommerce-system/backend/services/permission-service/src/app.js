const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();

const { sequelize, testConnection, syncDatabase } = require('./config/database');
const permissionRoutes = require('./routes/permission');
// const permissionService = require('./services/permissionService');
// const { initializeSystemData } = require('./utils/initializeData');

const app = express();
const PORT = process.env.PORT || 3013;

// 安全中間件
app.use(helmet());

// CORS 配置
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));

// 速率限制
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15分鐘
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 限制每個IP 100次請求
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: '請求過於頻繁，請稍後再試'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use(limiter);

// 請求解析中間件
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 請求日誌中間件
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  next();
});

// Swagger 配置
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Permission Service API',
      version: '1.0.0',
      description: '電商系統權限管理服務 API 文檔',
      contact: {
        name: '電商開發團隊',
        email: 'dev@ecommerce.com'
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
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// API 文檔路由
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// 健康檢查路由
app.get('/api/v1/health', async (req, res) => {
  try {
    const dbStatus = await sequelize.authenticate();
    res.json({
      success: true,
      service: 'Permission Service',
      version: '1.0.0',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      service: 'Permission Service',
      version: '1.0.0',
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'disconnected',
      error: error.message
    });
  }
});

// API 路由
app.use('/api/v1/permissions', permissionRoutes);

// 根路由
app.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      service: 'Permission Service',
      version: '1.0.0',
      description: '電商系統權限管理服務',
      endpoints: {
        health: '/api/v1/health',
        apiDocs: '/api-docs',
        permissions: '/api/v1/permissions'
      }
    }
  });
});

// 404 處理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: '請求的資源不存在'
    }
  });
});

// 全局錯誤處理中間件
app.use((error, req, res, next) => {
  console.error('全局錯誤:', error);

  // Sequelize 驗證錯誤
  if (error.name === 'SequelizeValidationError') {
    const errors = error.errors.map(err => err.message);
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: '數據驗證失敗',
        details: errors
      }
    });
  }

  // Sequelize 重複鍵錯誤
  if (error.name === 'SequelizeUniqueConstraintError') {
    const field = error.errors[0].path;
    return res.status(409).json({
      success: false,
      error: {
        code: 'DUPLICATE_KEY',
        message: `${field} 已存在`
      }
    });
  }

  // JWT 錯誤
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: '認證令牌無效'
      }
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_EXPIRED',
        message: '認證令牌已過期'
      }
    });
  }

  // 默認錯誤
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production' 
        ? '內部服務錯誤' 
        : error.message
    }
  });
});

// 優雅關閉處理
const gracefulShutdown = async (signal) => {
  console.log(`🛑 收到 ${signal} 信號，準備關閉 Permission Service...`);
  
  try {
    // 關閉數據庫連接
    await sequelize.close();
    console.log('✅ PostgreSQL 連線已關閉');
    process.exit(0);
  } catch (error) {
    console.error('優雅關閉過程中發生錯誤:', error);
    process.exit(1);
  }
};

// 監聽關閉信號
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// 初始化資料庫
async function initializeDatabase() {
  try {
    await testConnection();
    await syncDatabase();
    console.log('✅ 資料庫初始化完成');
  } catch (error) {
    console.error('❌ 資料庫初始化失敗:', error);
    throw error;
  }
}

// 啟動服務器
const startServer = async () => {
  try {
    // 初始化資料庫
    await initializeDatabase();

    // 初始化系統數據 (暫時跳過)
    // await initializeSystemData();

    // 啟動 HTTP 服務器
    const server = app.listen(PORT, () => {
      console.log('🚀 Permission Service 啟動成功');
      console.log(`📍 服務地址: http://localhost:${PORT}`);
      console.log(`📚 API 文檔: http://localhost:${PORT}/api-docs`);
      console.log(`💚 健康檢查: http://localhost:${PORT}/api/v1/health`);
      console.log(`⏰ 啟動時間: ${new Date().toLocaleString('zh-TW')}`);
    });

    return server;
  } catch (error) {
    console.error('啟動服務器失敗:', error);
    process.exit(1);
  }
};

// 啟動服務
if (require.main === module) {
  startServer();
}

module.exports = app;
