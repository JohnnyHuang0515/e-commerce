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
const PORT = process.env.PORT || 3011;

// 初始化資料庫
const initializeDatabase = async () => {
  try {
    await testConnection();
    await syncDatabase();
    console.log('Inventory Service: 資料庫初始化完成');
  } catch (error) {
    console.error('Inventory Service: 資料庫初始化失敗:', error.message);
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
      title: 'Inventory Service API',
      version: '1.0.0',
      description: '電商系統庫存管理服務 API 文檔',
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
app.use('/api/v1/inventory', require('./routes/inventory'));

// 健康檢查
app.get('/api/v1/health', async (req, res) => {
  try {
    const { sequelize } = require('./config/database');
    await sequelize.authenticate();
    res.json({
      success: true,
      message: 'Inventory Service 運行正常',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      database: 'connected'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Inventory Service 資料庫連接異常',
      error: error.message
    });
  }
});

// 根路由
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Inventory Service API',
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

// 定時任務：庫存同步
cron.schedule('*/5 * * * *', async () => {
  try {
    const Inventory = require('./models/Inventory');
    
    // 同步庫存狀態
    const inventories = await Inventory.find({
      $or: [
        { status: { $ne: 'discontinued' } },
        { currentStock: { $gt: 0 } }
      ]
    });

    for (const inventory of inventories) {
      const newStatus = inventory.stockStatus;
      if (newStatus !== inventory.status) {
        inventory.status = newStatus;
        await inventory.save();
        logger.info(`庫存狀態更新: ${inventory.productId} -> ${newStatus}`);
      }
    }
  } catch (error) {
    logger.error('庫存同步失敗:', error);
  }
});

// 定時任務：低庫存預警
cron.schedule('0 9 * * *', async () => {
  try {
    const Inventory = require('./models/Inventory');
    const axios = require('axios');
    
    const lowStockItems = await Inventory.find({
      currentStock: { $lte: parseInt(process.env.LOW_STOCK_THRESHOLD) || 10 },
      status: { $ne: 'discontinued' }
    }).populate('productId', 'name category brand');

    if (lowStockItems.length > 0 && process.env.STOCK_ALERT_ENABLED === 'true') {
      const alertData = {
        message: `庫存預警: ${lowStockItems.length} 個商品庫存不足`,
        items: lowStockItems.map(item => ({
          productId: item.productId._id,
          productName: item.productId.name,
          sku: item.sku,
          currentStock: item.currentStock,
          minStock: item.minStock
        })),
        timestamp: new Date().toISOString()
      };

      // 發送 Webhook 通知
      if (process.env.STOCK_ALERT_WEBHOOK_URL) {
        try {
          await axios.post(process.env.STOCK_ALERT_WEBHOOK_URL, alertData);
          logger.info(`庫存預警通知已發送: ${lowStockItems.length} 個商品`);
        } catch (error) {
          logger.error('發送庫存預警通知失敗:', error);
        }
      }
    }
  } catch (error) {
    logger.error('庫存預警檢查失敗:', error);
  }
});

// 定時任務：自動補貨
cron.schedule('0 10 * * *', async () => {
  try {
    const Inventory = require('./models/Inventory');
    
    if (process.env.AUTO_REORDER_ENABLED === 'true') {
      const reorderItems = await Inventory.find({
        'autoReorder.enabled': true,
        currentStock: { $lte: '$autoReorder.threshold' }
      });

      for (const item of reorderItems) {
        const reorderQuantity = item.autoReorder.quantity;
        const transaction = await item.updateStock(
          reorderQuantity,
          'purchase',
          'manual_adjustment',
          null,
          `自動補貨: ${reorderQuantity}`,
          null
        );

        item.autoReorder.lastReorderDate = new Date();
        item.autoReorder.nextReorderDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30天後
        await item.save();

        logger.info(`自動補貨完成: ${item.productId} - ${reorderQuantity} 單位`);
      }
    }
  } catch (error) {
    logger.error('自動補貨失敗:', error);
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
  console.log(`🚀 Inventory Service 啟動成功`);
  console.log(`📡 服務地址: http://localhost:${PORT}`);
  console.log(`🏥 健康檢查: http://localhost:${PORT}/api/v1/health`);
  console.log(`📚 API 文檔: http://localhost:${PORT}/api-docs`);
  console.log(`⏰ 啟動時間: ${new Date().toLocaleString('zh-TW')}`);
});

module.exports = app;
