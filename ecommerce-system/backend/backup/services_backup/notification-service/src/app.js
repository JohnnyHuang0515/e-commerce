const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const moment = require('moment');
require('dotenv').config();

const notificationRoutes = require('./routes/notificationRoutes');
const notificationController = require('./controllers/notificationController');
const { Notification } = require('./models/Notification');

// 創建 Express 應用
const app = express();
const server = createServer(app);

// Socket.IO 配置
const io = new Server(server, {
  cors: {
    origin: process.env.SOCKET_CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// 日誌配置
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: process.env.SERVICE_NAME || 'notification-service' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new DailyRotateFile({
      filename: 'logs/notification-service-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: process.env.LOG_RETENTION_DAYS || '30d'
    })
  ]
});

// 中間件
app.use(helmet());
app.use(compression());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 速率限制
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15分鐘
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 限制每個IP每15分鐘100個請求
  message: {
    success: false,
    message: '請求過於頻繁，請稍後再試'
  }
});
app.use('/api/v1/', limiter);

// 健康檢查
app.get('/api/v1/health', (req, res) => {
  res.json({
    success: true,
    data: {
      service: process.env.SERVICE_NAME || 'notification-service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.SERVICE_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    },
    message: 'Notification service is healthy'
  });
});

// API 路由
app.use('/api/v1/notifications', notificationRoutes);

// 錯誤處理中間件
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: '內部服務器錯誤',
    error: process.env.NODE_ENV === 'development' ? err.message : '請聯繫管理員'
  });
});

// 404 處理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API 端點不存在'
  });
});

// Socket.IO 連接處理
io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id}`);
  
  socket.on('join-notifications', (userId) => {
    socket.join(`user-${userId}`);
    logger.info(`User ${userId} joined notification room`);
  });
  
  socket.on('disconnect', () => {
    logger.info(`Socket disconnected: ${socket.id}`);
  });
});

// 定期處理待發送通知
setInterval(async () => {
  try {
    const notifications = await Notification.getPendingNotifications(50);
    for (const notification of notifications) {
      try {
        await notificationController.processNotification(notification);
        logger.info(`Processed notification ${notification._id}`);
      } catch (error) {
        logger.error(`Failed to process notification ${notification._id}:`, error);
      }
    }
  } catch (error) {
    logger.error('Error processing pending notifications:', error);
  }
}, 60000); // 每分鐘檢查一次

// 定期重試失敗的通知
setInterval(async () => {
  try {
    const notifications = await Notification.getFailedNotifications(20);
    for (const notification of notifications) {
      try {
        await notificationController.processNotification(notification);
        logger.info(`Retried notification ${notification._id}`);
      } catch (error) {
        logger.error(`Failed to retry notification ${notification._id}:`, error);
      }
    }
  } catch (error) {
    logger.error('Error retrying failed notifications:', error);
  }
}, 300000); // 每5分鐘重試一次

// 數據庫連接
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://admin:password123@localhost:27017/ecommerce_notifications?authSource=admin';
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    await mongoose.connect(mongoUri, options);
    logger.info('MongoDB connected successfully');
    
    // 創建索引（處理衝突）
    try {
      await mongoose.connection.db.collection('notificationtemplates').createIndex({ name: 1 }, { unique: true, background: true });
    } catch (error) {
      if (error.code !== 86) { // 不是索引衝突錯誤
        logger.warn('Index creation warning:', error.message);
      }
    }
    
    try {
      await mongoose.connection.db.collection('notificationtemplates').createIndex({ type: 1, category: 1 }, { background: true });
    } catch (error) {
      if (error.code !== 86) {
        logger.warn('Index creation warning:', error.message);
      }
    }
    
    try {
      await mongoose.connection.db.collection('notifications').createIndex({ recipientId: 1, recipientType: 1 }, { background: true });
    } catch (error) {
      if (error.code !== 86) {
        logger.warn('Index creation warning:', error.message);
      }
    }
    
    try {
      await mongoose.connection.db.collection('notifications').createIndex({ status: 1 }, { background: true });
    } catch (error) {
      if (error.code !== 86) {
        logger.warn('Index creation warning:', error.message);
      }
    }
    
    try {
      await mongoose.connection.db.collection('notifications').createIndex({ scheduledAt: 1 }, { background: true });
    } catch (error) {
      if (error.code !== 86) {
        logger.warn('Index creation warning:', error.message);
      }
    }
    
    logger.info('Database indexes created');
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// 優雅關閉
const gracefulShutdown = (signal) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  server.close(() => {
    logger.info('HTTP server closed');
    
  mongoose.connection.close();
  logger.info('MongoDB connection closed');
  process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// 啟動服務器
const PORT = process.env.PORT || 3017;
const SOCKET_PORT = process.env.SOCKET_PORT || 3016;

const startServer = async () => {
  try {
    await connectDB();
    
    server.listen(PORT, () => {
      logger.info(`Notification Service started on port ${PORT}`);
      logger.info(`Socket.IO server running on port ${SOCKET_PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = { app, server, io };
