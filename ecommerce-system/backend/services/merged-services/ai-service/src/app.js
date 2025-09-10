const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

// MongoDB 連接配置
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:password123@localhost:27017/ecommerce?authSource=admin';

// MongoDB 連接函數
const connectMongoDB = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      return true;
    }
    
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      socketTimeoutMS: 5000
    });
    
    console.log('✅ AI-SERVICE: MongoDB 連線成功');
    return true;
  } catch (error) {
    console.error('❌ AI-SERVICE: MongoDB 連接錯誤:', error);
    return false;
  }
};

// 簡化的路由（暫時移除複雜的 AI 功能）
// const searchRoutes = require('./routes/search');
// const recommendationRoutes = require('./routes/recommendation');
// const analyticsRoutes = require('./routes/analytics');
// const cacheRoutes = require('./routes/cache');

const app = express();
const PORT = process.env.PORT || 3007;

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
      title: 'AI Service API',
      version: '1.0.0',
      description: '合併AI搜尋、推薦、分析服務 API 文檔'
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
    
    res.json({
      success: true,
      service: 'AI Service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      databases: {
        mongodb: mongoStatus ? 'connected' : 'disconnected'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      service: 'AI Service',
      status: 'unhealthy',
      error: error.message
    });
  }
});

// API 健康檢查
app.get('/api/v1/health', async (req, res) => {
  try {
    const mongoStatus = await connectMongoDB();
    
    res.json({
      success: true,
      service: 'AI Service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      databases: {
        mongodb: mongoStatus ? 'connected' : 'disconnected'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      service: 'AI Service',
      status: 'unhealthy',
      error: error.message
    });
  }
});

// API 路由（簡化版本）
app.get('/api/v1/search', (req, res) => {
  res.json({
    success: true,
    message: 'AI 搜尋服務',
    data: []
  });
});

app.get('/search', (req, res) => {
  res.json({
    success: true,
    message: 'AI 搜尋服務',
    data: []
  });
});

app.get('/api/v1/recommendations', (req, res) => {
  res.json({
    success: true,
    message: 'AI 推薦服務',
    data: []
  });
});

app.get('/recommendations', (req, res) => {
  res.json({
    success: true,
    message: 'AI 推薦服務',
    data: []
  });
});

app.get('/api/v1/analytics', (req, res) => {
  res.json({
    success: true,
    message: 'AI 分析服務',
    data: []
  });
});

app.get('/analytics', (req, res) => {
  res.json({
    success: true,
    message: 'AI 分析服務',
    data: []
  });
});

app.get('/api/v1/cache', (req, res) => {
  res.json({
    success: true,
    message: 'AI 快取服務',
    data: []
  });
});

app.get('/cache', (req, res) => {
  res.json({
    success: true,
    message: 'AI 快取服務',
    data: []
  });
});

// 根路由
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'AI Service - 合併AI搜尋、推薦、分析服務',
    version: '1.0.0',
    endpoints: {
      search: '/api/v1/search',
      recommendations: '/api/v1/recommendations',
      analytics: '/api/v1/analytics',
      cache: '/api/v1/cache',
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
  console.error('AI Service Error:', error);
  
  res.status(error.status || 500).json({
    success: false,
    message: error.message || '內部服務器錯誤',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// 簡化的初始化（移除複雜的 AI 功能）
const initializeDatabase = async () => {
  try {
    console.log('🔄 初始化資料庫連接...');
    
    // MongoDB 初始化
    const mongoConnected = await connectMongoDB();
    
    console.log('✅ 資料庫和服務初始化完成');
    console.log(`   - MongoDB: ${mongoConnected ? '已連接' : '連接失敗'}`);
    
  } catch (error) {
    console.error('❌ 資料庫初始化失敗:', error);
    // 不退出，繼續啟動服務
    console.log('⚠️ 繼續啟動服務，但某些功能可能不可用');
  }
};

// 啟動服務器
const startServer = async () => {
  try {
    // 先連接 MongoDB
    const mongoConnected = await connectMongoDB();
    
    if (!mongoConnected) {
      console.error('❌ MongoDB 連接失敗，無法啟動服務');
      process.exit(1);
    }
    
    await initializeDatabase();
    
    app.listen(PORT, () => {
      console.log('');
      console.log('🚀 AI Service 啟動成功!');
      console.log('================================');
      console.log(`📍 服務地址: http://localhost:${PORT}`);
      console.log(`📚 API 文檔: http://localhost:${PORT}/api-docs`);
      console.log(`🔍 健康檢查: http://localhost:${PORT}/health`);
      console.log('');
      console.log('🔗 API 端點:');
      console.log('   - 搜尋: /api/v1/search');
      console.log('   - 推薦: /api/v1/recommendations');
      console.log('   - 分析: /api/v1/analytics');
      console.log('   - 快取: /api/v1/cache');
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
    console.log('✅ AI Service 已優雅關閉');
    process.exit(0);
  } catch (error) {
    console.error('❌ 關閉服務時發生錯誤:', error);
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  console.log('🔄 收到 SIGINT 信號，正在關閉服務...');
  try {
    console.log('✅ AI Service 已優雅關閉');
    process.exit(0);
  } catch (error) {
    console.error('❌ 關閉服務時發生錯誤:', error);
    process.exit(1);
  }
});

// 啟動服務
startServer();

module.exports = app;
