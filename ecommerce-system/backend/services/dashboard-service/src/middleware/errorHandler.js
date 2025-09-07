const { logger } = require('../utils/logger');

// 錯誤處理中間件
const errorHandler = (err, req, res, next) => {
  logger.error('錯誤處理中間件:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // 預設錯誤
  let error = {
    message: err.message || '內部服務器錯誤',
    statusCode: err.statusCode || 500
  };

  // Mongoose 驗證錯誤
  if (err.name === 'ValidationError') {
    error.message = '資料驗證失敗';
    error.statusCode = 400;
    error.details = Object.values(err.errors).map(e => e.message);
  }

  // Mongoose 重複鍵錯誤
  if (err.code === 11000) {
    error.message = '資料已存在';
    error.statusCode = 409;
  }

  // JWT 錯誤
  if (err.name === 'JsonWebTokenError') {
    error.message = '無效的 Token';
    error.statusCode = 401;
  }

  // JWT 過期錯誤
  if (err.name === 'TokenExpiredError') {
    error.message = 'Token 已過期';
    error.statusCode = 401;
  }

  // 回應錯誤
  res.status(error.statusCode).json({
    success: false,
    message: error.message,
    ...(error.details && { details: error.details }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = { errorHandler };
