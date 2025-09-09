const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const winston = require('winston');
const { createServer } = require('http');
const { Server } = require('socket.io');
const moment = require('moment');
const _ = require('lodash');
require('dotenv').config();

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

// 內存日誌存儲 (用於測試)
let logs = [];
let logIdCounter = 1;

// 日誌級別和類型
const LOG_LEVELS = ['error', 'warn', 'info', 'debug', 'trace'];
const LOG_TYPES = ['system', 'user_action', 'api_request', 'database', 'security', 'performance', 'business'];

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

// 創建日誌
app.post('/api/v1/logs', (req, res) => {
  try {
    const logData = {
      id: logIdCounter++,
      ...req.body,
      timestamp: req.body.timestamp || new Date(),
      date: moment().format('YYYY-MM-DD'),
      hour: moment().hour(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // 驗證必要欄位
    if (!logData.level || !logData.type || !logData.message || !logData.service) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: level, type, message, service'
      });
    }

    // 驗證枚舉值
    if (!LOG_LEVELS.includes(logData.level)) {
      return res.status(400).json({
        success: false,
        message: `Invalid log level. Must be one of: ${LOG_LEVELS.join(', ')}`
      });
    }

    if (!LOG_TYPES.includes(logData.type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid log type. Must be one of: ${LOG_TYPES.join(', ')}`
      });
    }

    logs.unshift(logData); // 添加到開頭
    
    // 限制內存中的日誌數量
    if (logs.length > 10000) {
      logs = logs.slice(0, 10000);
    }

    // 通過 WebSocket 推送新日誌
    io.emit('new-log', logData);

    res.status(201).json({
      success: true,
      data: logData,
      message: 'Log created successfully'
    });
  } catch (error) {
    logger.error('Create log error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create log',
      error: error.message
    });
  }
});

// 查詢日誌
app.get('/api/v1/logs', (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      service,
      level,
      type,
      startDate,
      endDate,
      userId,
      search,
      sortBy = 'timestamp',
      sortOrder = 'desc'
    } = req.query;

    let filteredLogs = [...logs];

    // 應用過濾器
    if (service) {
      filteredLogs = filteredLogs.filter(log => 
        log.service.toLowerCase().includes(service.toLowerCase())
      );
    }

    if (level) {
      filteredLogs = filteredLogs.filter(log => log.level === level);
    }

    if (type) {
      filteredLogs = filteredLogs.filter(log => log.type === type);
    }

    if (userId) {
      filteredLogs = filteredLogs.filter(log => log.userId === userId);
    }

    if (startDate || endDate) {
      filteredLogs = filteredLogs.filter(log => {
        const logDate = new Date(log.timestamp);
        if (startDate && logDate < new Date(startDate)) return false;
        if (endDate && logDate > new Date(endDate)) return false;
        return true;
      });
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filteredLogs = filteredLogs.filter(log => 
        log.message.toLowerCase().includes(searchLower) ||
        log.service.toLowerCase().includes(searchLower) ||
        (log.url && log.url.toLowerCase().includes(searchLower))
      );
    }

    // 排序
    filteredLogs.sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      
      if (sortOrder === 'desc') {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      } else {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      }
    });

    // 分頁
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedLogs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filteredLogs.length,
        pages: Math.ceil(filteredLogs.length / parseInt(limit))
      },
      message: `Found ${paginatedLogs.length} logs`
    });
  } catch (error) {
    logger.error('Get logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get logs',
      error: error.message
    });
  }
});

// 獲取日誌統計 (必須在 /api/v1/logs/:id 之前)
app.get('/api/v1/logs/stats', (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : moment().subtract(7, 'days').toDate();
    const end = endDate ? new Date(endDate) : new Date();

    const filteredLogs = logs.filter(log => {
      const logDate = new Date(log.timestamp);
      return logDate >= start && logDate <= end;
    });

    // 總體統計
    const totalLogs = filteredLogs.length;
    const errorLogs = filteredLogs.filter(log => log.level === 'error').length;
    const warningLogs = filteredLogs.filter(log => log.level === 'warn').length;

    // 按服務統計
    const serviceStats = _.chain(filteredLogs)
      .groupBy('service')
      .map((serviceLogs, service) => ({
        _id: service,
        count: serviceLogs.length,
        errors: serviceLogs.filter(log => log.level === 'error').length,
        warnings: serviceLogs.filter(log => log.level === 'warn').length
      }))
      .sortBy('count')
      .reverse()
      .value();

    // 按級別統計
    const levelStats = _.chain(filteredLogs)
      .groupBy('level')
      .map((levelLogs, level) => ({
        _id: level,
        count: levelLogs.length
      }))
      .sortBy('count')
      .reverse()
      .value();

    // 按小時統計
    const hourlyStats = _.chain(filteredLogs)
      .groupBy(log => moment(log.timestamp).hour())
      .map((hourLogs, hour) => ({
        _id: parseInt(hour),
        count: hourLogs.length,
        errors: hourLogs.filter(log => log.level === 'error').length
      }))
      .sortBy('_id')
      .value();

    res.json({
      success: true,
      data: {
        summary: {
          totalLogs,
          errorLogs,
          warningLogs,
          errorRate: totalLogs > 0 ? (errorLogs / totalLogs * 100).toFixed(2) : 0
        },
        serviceStats,
        levelStats,
        hourlyStats,
        dateRange: {
          start: start.toISOString(),
          end: end.toISOString()
        }
      },
      message: 'Log statistics retrieved successfully'
    });
  } catch (error) {
    logger.error('Get log stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get log statistics',
      error: error.message
    });
  }
});

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

// 健康檢查
app.get('/api/v1/health', (req, res) => {
  res.json({
    success: true,
    data: {
      service: 'log-service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.SERVICE_VERSION || '1.0.0',
      logsInMemory: logs.length
    },
    message: 'Log service is healthy'
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

// 啟動服務
const startServer = async () => {
  try {
    const port = process.env.PORT || 3018;
    const wsPort = process.env.WS_PORT || 3017;
    
    server.listen(port, () => {
      logger.info(`Log Service started on port ${port}`);
      logger.info(`WebSocket server running on port ${wsPort}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info('Using in-memory storage for testing');
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
