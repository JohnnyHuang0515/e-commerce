// 統一錯誤處理中間件
const { clickhouseClient } = require('../config/database');
const config = require('../config/env');

/**
 * 錯誤處理中間件
 * @param {Error} err - 錯誤對象
 * @param {Object} req - Express 請求對象
 * @param {Object} res - Express 響應對象
 * @param {Function} next - Express next 函數
 */
const errorHandler = (err, req, res, next) => {
  // 記錄錯誤到控制台
  console.error('API Error:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    user: req.user?.user_id,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  
  // 準備日誌數據
  const logData = {
    level: 'error',
    service: 'ecommerce-api',
    message: err.message,
    stack: err.stack,
    user_id: req.user?.user_id || null,
    url: req.url,
    method: req.method,
    ip: req.ip,
    user_agent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
    error_code: err.code || 'UNKNOWN_ERROR',
    error_type: err.name || 'Error'
  };
  
  // 異步記錄到 ClickHouse，不阻塞響應
  setImmediate(async () => {
    try {
      await clickhouseClient.insert('system_logs', logData);
    } catch (logError) {
      console.error('記錄日誌到 ClickHouse 失敗:', logError);
    }
  });
  
  // 根據錯誤類型返回適當的響應
  let statusCode = err.status || err.statusCode || 500;
  let errorMessage = err.message || '內部服務器錯誤';
  let errorCode = err.code || 'INTERNAL_SERVER_ERROR';
  
  // 處理特定錯誤類型
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    errorMessage = '請求數據驗證失敗';
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    errorCode = 'UNAUTHORIZED';
    errorMessage = '認證失敗';
  } else if (err.name === 'ForbiddenError') {
    statusCode = 403;
    errorCode = 'FORBIDDEN';
    errorMessage = '權限不足';
  } else if (err.name === 'NotFoundError') {
    statusCode = 404;
    errorCode = 'NOT_FOUND';
    errorMessage = '資源不存在';
  } else if (err.name === 'ConflictError') {
    statusCode = 409;
    errorCode = 'CONFLICT';
    errorMessage = '資源衝突';
  } else if (err.name === 'TooManyRequestsError') {
    statusCode = 429;
    errorCode = 'TOO_MANY_REQUESTS';
    errorMessage = '請求過於頻繁';
  }
  
  // 處理資料庫錯誤
  if (err.code && err.code.startsWith('23')) {
    statusCode = 400;
    errorCode = 'DATABASE_CONSTRAINT_ERROR';
    errorMessage = '資料庫約束錯誤';
  } else if (err.code === 'ECONNREFUSED') {
    statusCode = 503;
    errorCode = 'DATABASE_CONNECTION_ERROR';
    errorMessage = '資料庫連接失敗';
  }
  
  // 在開發環境中返回詳細錯誤信息
  const isDevelopment = config.nodeEnv === 'development';
  
  const errorResponse = {
    success: false,
    error: errorMessage,
    code: errorCode,
    timestamp: new Date().toISOString(),
    request_id: req.headers['x-request-id'] || null
  };
  
  // 開發環境添加詳細信息
  if (isDevelopment) {
    errorResponse.details = {
      stack: err.stack,
      url: req.url,
      method: req.method,
      user: req.user?.user_id
    };
  }
  
  res.status(statusCode).json(errorResponse);
};

/**
 * 404 處理中間件
 * @param {Object} req - Express 請求對象
 * @param {Object} res - Express 響應對象
 */
const notFoundHandler = (req, res) => {
  const errorResponse = {
    success: false,
    error: 'API 端點不存在',
    code: 'NOT_FOUND',
    timestamp: new Date().toISOString(),
    available_endpoints: [
      '/api/v1/auth',
      '/api/v1/users',
      '/api/v1/products',
      '/api/v1/orders',
      '/api/v1/cart',
      '/api/v1/recommendations',
      '/api-docs',
      '/health'
    ]
  };
  
  res.status(404).json(errorResponse);
};

/**
 * 異步錯誤捕獲包裝器
 * @param {Function} fn - 異步函數
 * @returns {Function} Express 中間件函數
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 自定義錯誤類
 */
class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// 預定義錯誤類
class ValidationError extends AppError {
  constructor(message = '驗證失敗') {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

class UnauthorizedError extends AppError {
  constructor(message = '認證失敗') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

class ForbiddenError extends AppError {
  constructor(message = '權限不足') {
    super(message, 403, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

class NotFoundError extends AppError {
  constructor(message = '資源不存在') {
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

class ConflictError extends AppError {
  constructor(message = '資源衝突') {
    super(message, 409, 'CONFLICT');
    this.name = 'ConflictError';
  }
}

class TooManyRequestsError extends AppError {
  constructor(message = '請求過於頻繁') {
    super(message, 429, 'TOO_MANY_REQUESTS');
    this.name = 'TooManyRequestsError';
  }
}

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  AppError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  TooManyRequestsError
};
