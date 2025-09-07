const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const cron = require('node-cron');
const { testConnection, syncDatabase } = require('./config/database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3010;

// 初始化資料庫
const initializeDatabase = async () => {
  try {
    await testConnection();
    await syncDatabase();
    console.log('Logistics Service: 資料庫初始化完成');
  } catch (error) {
    console.error('Logistics Service: 資料庫初始化失敗:', error.message);
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
      title: 'Logistics Service API',
      version: '1.0.0',
      description: '電商系統物流服務 API 文檔',
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
app.use('/api/v1/logistics', require('./routes/logistics'));

// 健康檢查
app.get('/api/v1/health', async (req, res) => {
  try {
    const { sequelize } = require('./config/database');
    await sequelize.authenticate();
    res.json({
      success: true,
      message: 'Logistics Service 運行正常',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      database: 'connected'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Logistics Service 資料庫連接異常',
      error: error.message
    });
  }
});

// 根路由
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Logistics Service API',
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

// 定時任務：更新配送狀態
cron.schedule('*/5 * * * *', async () => {
  try {
    const Shipment = require('./models/Shipment');
    const { LogisticsProviderFactory } = require('./utils/logisticsProviders');
    
    // 取得需要更新的配送記錄
    const shipments = await Shipment.find({
      status: { $in: ['pending', 'picked_up', 'in_transit', 'out_for_delivery'] },
      'shippingInfo.trackingNumber': { $exists: true }
    });

    for (const shipment of shipments) {
      try {
        const provider = LogisticsProviderFactory.createProvider(shipment.shippingInfo.provider, {
          apiUrl: process.env[`${shipment.shippingInfo.provider.toUpperCase()}_API_URL`],
          apiKey: process.env[`${shipment.shippingInfo.provider.toUpperCase()}_API_KEY`],
          apiSecret: process.env[`${shipment.shippingInfo.provider.toUpperCase()}_API_SECRET`],
        });

        const trackingResult = await provider.trackShipment(shipment.shippingInfo.trackingNumber);
        
        if (trackingResult.success && trackingResult.data.events.length > 0) {
          const latestEvent = trackingResult.data.events[trackingResult.data.events.length - 1];
          
          if (latestEvent.status !== shipment.status) {
            await shipment.updateStatus(
              latestEvent.status,
              latestEvent.description,
              latestEvent.location
            );
            
            logger.info(`配送狀態更新: ${shipment.shipmentId} -> ${latestEvent.status}`);
          }
        }
      } catch (error) {
        logger.error(`更新配送狀態失敗: ${shipment.shipmentId}`, error);
      }
    }
  } catch (error) {
    logger.error('定時任務執行失敗:', error);
  }
});

// 定時任務：清理過期追蹤記錄
cron.schedule('0 2 * * *', async () => {
  try {
    const Shipment = require('./models/Shipment');
    const retentionDays = parseInt(process.env.TRACKING_RETENTION_DAYS) || 90;
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    
    const result = await Shipment.updateMany(
      {
        status: 'delivered',
        'shippingInfo.actualDelivery': { $lt: cutoffDate }
      },
      {
        $pull: {
          trackingEvents: {
            timestamp: { $lt: cutoffDate }
          }
        }
      }
    );
    
    if (result.modifiedCount > 0) {
      logger.info(`清理過期追蹤記錄: ${result.modifiedCount} 筆`);
    }
  } catch (error) {
    logger.error('清理過期追蹤記錄失敗:', error);
  }
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
  console.log(`🚀 Logistics Service 啟動成功`);
  console.log(`📡 服務地址: http://localhost:${PORT}`);
  console.log(`🏥 健康檢查: http://localhost:${PORT}/api/v1/health`);
  console.log(`📚 API 文檔: http://localhost:${PORT}/api-docs`);
  console.log(`⏰ 啟動時間: ${new Date().toLocaleString('zh-TW')}`);
});

module.exports = app;
