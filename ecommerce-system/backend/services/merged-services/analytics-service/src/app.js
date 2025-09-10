const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

// ClickHouse 配置
const ClickHouseManager = require('./config/clickhouse');
const AnalyticsModels = require('./models/analyticsModels');
const logger = require('./utils/logger');

// 創建 ClickHouse 管理器
const clickhouseManager = new ClickHouseManager({
  clickhouse: {
    host: process.env.CLICKHOUSE_HOST || 'clickhouse',
    port: process.env.CLICKHOUSE_PORT || 8123,
    username: process.env.CLICKHOUSE_USERNAME || 'default',
    password: process.env.CLICKHOUSE_PASSWORD || '',
    database: process.env.CLICKHOUSE_DATABASE || 'analytics'
  }
});

// 創建分析模型
const analyticsModels = new AnalyticsModels(clickhouseManager);

// 路由
const analyticsRoutes = require('./routes/analytics');

// Swagger 配置
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Analytics Service API',
      version: '1.0.0',
      description: '電商系統數據分析服務 API 文檔'
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3005}`,
        description: 'Analytics Service'
      }
    ]
  },
  apis: ['./src/routes/*.js']
};
const specs = swaggerJsdoc(swaggerOptions);

// 創建 Express 應用
const app = express();

// 信任代理 - 修復 rate limit 問題
app.set('trust proxy', true);

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
  },
  trustProxy: true, // 信任代理
  skip: (req) => {
    // 跳過健康檢查和 API 端點
    return req.path === '/api/v1/health' || 
           req.path === '/health' || 
           req.path === '/api/v1/analytics/';
  }
});
app.use('/api/', limiter);

// 日誌記錄
app.use(morgan('combined'));

// 解析 JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 將分析模型傳遞給路由
app.locals.analyticsModels = analyticsModels;

// API 路由
app.use('/api/v1/analytics', analyticsRoutes);

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Analytics Service API 文檔'
}));

// 生產環境健康檢查
app.get('/api/v1/health', async (req, res) => {
  try {
    // 生產環境：嚴格檢查 ClickHouse 連接
    let clickhouseStatus = 'disconnected';
    let clickhouseError = null;
    
    try {
      // 使用 ClickHouse 管理器的連接狀態
      if (clickhouseManager && clickhouseManager.connected) {
        clickhouseStatus = 'connected';
      } else {
        // 重新測試連接
        const testResult = await clickhouseManager.testConnection();
        clickhouseStatus = testResult ? 'connected' : 'disconnected';
        if (!testResult) {
          clickhouseError = 'ClickHouse connection test failed';
        }
      }
    } catch (error) {
      clickhouseError = error.message;
      console.error('ClickHouse 健康檢查失敗:', error);
    }
    
    // 生產環境：如果 ClickHouse 連接失敗，返回不健康狀態
    const isHealthy = clickhouseStatus === 'connected';
    const statusCode = isHealthy ? 200 : 503;
    
    res.status(statusCode).json({
      success: isHealthy,
      service: 'Analytics Service',
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'production',
      version: '1.0.0',
      databases: {
        clickhouse: clickhouseStatus
      },
      ...(clickhouseError && { error: clickhouseError })
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      service: 'Analytics Service',
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
      databases: {
        clickhouse: 'disconnected'
      }
    });
  }
});

// 路由註冊
app.use('/api/v1/analytics', analyticsRoutes);

// 根路徑
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Analytics Service API',
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
  console.error('Analytics Service 錯誤:', error);
  
  res.status(error.status || 500).json({
    success: false,
    message: error.message || '伺服器內部錯誤',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// 初始化 ClickHouse 連接
const initializeClickHouse = async () => {
  try {
    console.log('🔄 初始化 ClickHouse 連接...');
    
    // 生產環境：必須成功連接 ClickHouse
    const connected = await clickhouseManager.connect();
    
    if (connected) {
      await clickhouseManager.createTables();
      console.log('✅ ClickHouse 初始化完成');
      return true;
    } else {
      console.log('❌ ClickHouse 初始化失敗');
      // 生產環境：連接失敗時拋出錯誤
      if (process.env.NODE_ENV === 'production') {
        throw new Error('ClickHouse connection failed in production environment');
      }
      return false;
    }
  } catch (error) {
    console.error('❌ ClickHouse 初始化錯誤:', error);
    // 生產環境：初始化失敗時拋出錯誤
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
    return false;
  }
};

// 優雅關閉
process.on('SIGTERM', async () => {
  console.log('🛑 收到 SIGTERM 信號，準備關閉 Analytics Service...');
  try {
    await clickhouseManager.disconnect();
    console.log('✅ ClickHouse 連線已關閉');
    process.exit(0);
  } catch (error) {
    console.error('❌ 關閉 ClickHouse 連線時發生錯誤:', error);
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  console.log('🛑 收到 SIGINT 信號，準備關閉 Analytics Service...');
  try {
    await clickhouseManager.disconnect();
    console.log('✅ ClickHouse 連線已關閉');
    process.exit(0);
  } catch (error) {
    console.error('❌ 關閉 ClickHouse 連線時發生錯誤:', error);
    process.exit(1);
  }
});

// 啟動伺服器
const PORT = process.env.PORT || 3004;

const startServer = async () => {
  try {
    // 初始化 ClickHouse
    const clickhouseConnected = await initializeClickHouse();
    
    if (!clickhouseConnected) {
      console.log('⚠️ ClickHouse 連接失敗，但服務仍會啟動');
    }

    app.listen(PORT, () => {
      console.log('🚀 Analytics Service 啟動成功');
      console.log(`📍 服務地址: http://localhost:${PORT}`);
      console.log(`📚 API 文檔: http://localhost:${PORT}/api-docs`);
      console.log(`💚 健康檢查: http://localhost:${PORT}/api/v1/health`);
      console.log(`🗄️ 資料庫: ClickHouse ${clickhouseConnected ? '(已連接)' : '(連接失敗)'}`);
      console.log(`⏰ 啟動時間: ${new Date().toLocaleString('zh-TW')}`);
    });
  } catch (error) {
    console.error('❌ 啟動伺服器失敗:', error);
    process.exit(1);
  }
};

startServer();
