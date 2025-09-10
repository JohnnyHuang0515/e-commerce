const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const winston = require('winston');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

// 導入路由
const logRoutes = require('./routes/logRoutes');

// 創建 Express 應用
const app = express();
const server = createServer(app);

// Socket.IO 配置
const io = new Server(server, {
  cors: {
    origin: process.env.WS_CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Winston 日誌配置
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'log-service' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// 中間件配置
app.use(helmet());
app.use(cors());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 請求日誌中間件
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('HTTP Request', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });
  });
  
  next();
});

// 路由配置
app.use('/api/v1', logRoutes);

// Socket.IO 連接處理
io.on('connection', (socket) => {
  logger.info('WebSocket client connected', { socketId: socket.id });
  
  // 訂閱日誌事件
  socket.on('subscribe-logs', (data) => {
    const { service, level, type } = data;
    logger.info('Client subscribed to logs', { 
      socketId: socket.id, 
      service, 
      level, 
      type 
    });
    
    // 加入相應的房間
    if (service) socket.join(`service:${service}`);
    if (level) socket.join(`level:${level}`);
    if (type) socket.join(`type:${type}`);
  });
  
  // 取消訂閱
  socket.on('unsubscribe-logs', (data) => {
    const { service, level, type } = data;
    logger.info('Client unsubscribed from logs', { 
      socketId: socket.id, 
      service, 
      level, 
      type 
    });
    
    if (service) socket.leave(`service:${service}`);
    if (level) socket.leave(`level:${level}`);
    if (type) socket.leave(`type:${type}`);
  });
  
  socket.on('disconnect', () => {
    logger.info('WebSocket client disconnected', { socketId: socket.id });
  });
});

// 錯誤處理中間件
app.use((err, req, res, next) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method
  });
  
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 處理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// MongoDB 連接
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://admin:password123@localhost:27017/ecommerce_logs?authSource=admin';
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
    const { Log } = require('./models/Log');
    await Log.createIndexes();
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

// 監聽關閉信號
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// 未處理的 Promise 拒絕
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// 未捕獲的異常
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// 啟動服務
const startServer = async () => {
  try {
    await connectDB();
    
    const port = process.env.PORT || 3018;
    const wsPort = process.env.WS_PORT || 3017;
    
    server.listen(port, () => {
      logger.info(`Log Service started on port ${port}`);
      logger.info(`WebSocket server running on port ${wsPort}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// 導出 io 實例供其他模組使用
module.exports = { app, server, io };

// 如果直接運行此文件，則啟動服務
if (require.main === module) {
  startServer();
}
