const express = require('express');
const router = express.Router();
const logController = require('../controllers/logController');
const Joi = require('joi');

// 驗證中間件
const validateLog = (req, res, next) => {
  const schema = Joi.object({
    level: Joi.string().valid('error', 'warn', 'info', 'debug', 'trace').required(),
    type: Joi.string().valid('system', 'user_action', 'api_request', 'database', 'security', 'performance', 'business').required(),
    message: Joi.string().max(1000).required(),
    service: Joi.string().required(),
    serviceVersion: Joi.string().optional(),
    userId: Joi.string().optional(),
    sessionId: Joi.string().optional(),
    requestId: Joi.string().optional(),
    method: Joi.string().valid('GET', 'POST', 'PUT', 'DELETE', 'PATCH').optional(),
    url: Joi.string().max(500).optional(),
    statusCode: Joi.number().min(100).max(599).optional(),
    responseTime: Joi.number().min(0).optional(),
    error: Joi.object({
      name: Joi.string().optional(),
      message: Joi.string().optional(),
      stack: Joi.string().optional(),
      code: Joi.string().optional()
    }).optional(),
    metadata: Joi.object().optional(),
    tags: Joi.array().items(Joi.string().max(50)).optional(),
    ip: Joi.string().max(45).optional(),
    userAgent: Joi.string().max(500).optional(),
    orderId: Joi.string().optional(),
    productId: Joi.string().optional(),
    customerId: Joi.string().optional()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      error: error.details[0].message
    });
  }
  next();
};

const validateBatchLogs = (req, res, next) => {
  const schema = Joi.object({
    logs: Joi.array().items(
      Joi.object({
        level: Joi.string().valid('error', 'warn', 'info', 'debug', 'trace').required(),
        type: Joi.string().valid('system', 'user_action', 'api_request', 'database', 'security', 'performance', 'business').required(),
        message: Joi.string().max(1000).required(),
        service: Joi.string().required(),
        serviceVersion: Joi.string().optional(),
        userId: Joi.string().optional(),
        sessionId: Joi.string().optional(),
        requestId: Joi.string().optional(),
        method: Joi.string().valid('GET', 'POST', 'PUT', 'DELETE', 'PATCH').optional(),
        url: Joi.string().max(500).optional(),
        statusCode: Joi.number().min(100).max(599).optional(),
        responseTime: Joi.number().min(0).optional(),
        error: Joi.object({
          name: Joi.string().optional(),
          message: Joi.string().optional(),
          stack: Joi.string().optional(),
          code: Joi.string().optional()
        }).optional(),
        metadata: Joi.object().optional(),
        tags: Joi.array().items(Joi.string().max(50)).optional(),
        ip: Joi.string().max(45).optional(),
        userAgent: Joi.string().max(500).optional(),
        orderId: Joi.string().optional(),
        productId: Joi.string().optional(),
        customerId: Joi.string().optional()
      })
    ).min(1).required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      error: error.details[0].message
    });
  }
  next();
};

// 日誌管理路由
router.post('/logs', validateLog, logController.createLog);
router.post('/logs/batch', validateBatchLogs, logController.createBatchLogs);
router.get('/logs', logController.getLogs);
router.get('/logs/:id', logController.getLogById);
router.delete('/logs/:id', logController.deleteLog);

// 日誌統計路由
router.get('/logs/stats', logController.getLogStats);
router.post('/logs/cleanup', logController.cleanupLogs);

// 健康檢查路由
router.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      service: 'log-service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.SERVICE_VERSION || '1.0.0'
    },
    message: 'Log service is healthy'
  });
});

module.exports = router;
