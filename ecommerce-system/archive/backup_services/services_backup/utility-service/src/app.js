const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const moment = require('moment');
require('dotenv').config();

const utilityRoutes = require('./routes/utilityRoutes');

// 創建 Express 應用
const app = express();

// 日誌配置
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: process.env.SERVICE_NAME || 'utility-service' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new DailyRotateFile({
      filename: 'logs/utility-service-%DATE%.log',
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
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 靜態檔案服務
app.use('/uploads', express.static('uploads'));

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
      service: process.env.SERVICE_NAME || 'utility-service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.SERVICE_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uploadDir: process.env.UPLOAD_DIR || 'uploads',
      backupDir: process.env.BACKUP_DIR || 'backups'
    },
    message: 'Utility service is healthy'
  });
});

// API 路由
app.use('/api/v1/utility', utilityRoutes);

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

// 數據庫連接
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce_utility';
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    await mongoose.connect(mongoUri, options);
    logger.info('MongoDB connected successfully');
    
    // 創建索引
    await mongoose.connection.db.collection('files').createIndex({ filename: 1 });
    await mongoose.connection.db.collection('files').createIndex({ uploadedBy: 1, uploadedByType: 1 });
    await mongoose.connection.db.collection('files').createIndex({ category: 1 });
    await mongoose.connection.db.collection('backups').createIndex({ name: 1 });
    await mongoose.connection.db.collection('backups').createIndex({ type: 1, status: 1 });
    await mongoose.connection.db.collection('restores').createIndex({ backupId: 1 });
    await mongoose.connection.db.collection('restores').createIndex({ status: 1 });
    
    logger.info('Database indexes created');
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// 定期清理過期備份
setInterval(async () => {
  try {
    const retentionDays = parseInt(process.env.BACKUP_RETENTION_DAYS) || 30;
    const cutoffDate = moment().subtract(retentionDays, 'days').toDate();
    
    const expiredBackups = await mongoose.model('Backup').find({
      createdAt: { $lt: cutoffDate },
      status: 'completed'
    });
    
    for (const backup of expiredBackups) {
      try {
        // 刪除備份檔案
        const fs = require('fs-extra');
        if (await fs.pathExists(backup.destination)) {
          await fs.remove(backup.destination);
        }
        
        // 刪除資料庫記錄
        await mongoose.model('Backup').findByIdAndDelete(backup._id);
        
        logger.info(`Cleaned up expired backup: ${backup.name}`);
      } catch (error) {
        logger.error(`Failed to clean up backup ${backup.name}:`, error);
      }
    }
  } catch (error) {
    logger.error('Error cleaning up expired backups:', error);
  }
}, 24 * 60 * 60 * 1000); // 每24小時執行一次

// 優雅關閉
const gracefulShutdown = (signal) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  mongoose.connection.close();
  logger.info('MongoDB connection closed');
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// 啟動服務器
const PORT = process.env.PORT || 3019;

const startServer = async () => {
  try {
    await connectDB();
    
    app.listen(PORT, () => {
      logger.info(`Utility Service started on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`Upload directory: ${process.env.UPLOAD_DIR || 'uploads'}`);
      logger.info(`Backup directory: ${process.env.BACKUP_DIR || 'backups'}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
