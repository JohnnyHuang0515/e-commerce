const { body, query, validationResult } = require('express-validator');

// 處理驗證錯誤
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: '請求參數驗證失敗',
      errors: errors.array()
    });
  }
  next();
};

// 系統配置驗證
const validateSystem = {
  config: [
    body('key')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('配置鍵長度必須在1-100個字符之間'),
    body('value')
      .notEmpty()
      .withMessage('配置值不能為空'),
    body('type')
      .optional()
      .isIn(['string', 'number', 'boolean', 'object', 'array'])
      .withMessage('配置類型必須是 string、number、boolean、object 或 array'),
    body('category')
      .optional()
      .isIn(['general', 'email', 'notification', 'security', 'performance', 'feature'])
      .withMessage('配置分類必須是 general、email、notification、security、performance 或 feature'),
    handleValidationErrors
  ],

  updateConfig: [
    body('value')
      .optional()
      .notEmpty()
      .withMessage('配置值不能為空'),
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('描述長度不能超過500個字符'),
    handleValidationErrors
  ]
};

// 通知驗證
const validateNotification = {
  create: [
    body('user_id')
      .isString()
      .isLength({ min: 1, max: 100 })
      .withMessage('用戶ID長度必須在1-100個字符之間'),
    body('type')
      .isIn(['email', 'sms', 'push', 'in_app', 'webhook'])
      .withMessage('通知類型必須是 email、sms、push、in_app 或 webhook'),
    body('title')
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('標題長度必須在1-200個字符之間'),
    body('message')
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage('消息長度必須在1-1000個字符之間'),
    body('priority')
      .optional()
      .isIn(['low', 'normal', 'high', 'urgent'])
      .withMessage('優先級必須是 low、normal、high 或 urgent'),
    body('scheduled_at')
      .optional()
      .isISO8601()
      .withMessage('計劃時間格式不正確'),
    handleValidationErrors
  ],

  bulkCreate: [
    body('user_ids')
      .isArray({ min: 1, max: 1000 })
      .withMessage('用戶ID列表必須是包含1-1000個元素的數組'),
    body('user_ids.*')
      .isString()
      .isLength({ min: 1, max: 100 })
      .withMessage('每個用戶ID長度必須在1-100個字符之間'),
    body('type')
      .isIn(['email', 'sms', 'push', 'in_app', 'webhook'])
      .withMessage('通知類型必須是 email、sms、push、in_app 或 webhook'),
    body('title')
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('標題長度必須在1-200個字符之間'),
    body('message')
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage('消息長度必須在1-1000個字符之間'),
    body('priority')
      .optional()
      .isIn(['low', 'normal', 'high', 'urgent'])
      .withMessage('優先級必須是 low、normal、high 或 urgent'),
    body('scheduled_at')
      .optional()
      .isISO8601()
      .withMessage('計劃時間格式不正確'),
    handleValidationErrors
  ],

  update: [
    body('title')
      .optional()
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('標題長度必須在1-200個字符之間'),
    body('message')
      .optional()
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage('消息長度必須在1-1000個字符之間'),
    body('priority')
      .optional()
      .isIn(['low', 'normal', 'high', 'urgent'])
      .withMessage('優先級必須是 low、normal、high 或 urgent'),
    body('scheduled_at')
      .optional()
      .isISO8601()
      .withMessage('計劃時間格式不正確'),
    handleValidationErrors
  ]
};

// 查詢參數驗證
const validateQuery = {
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('頁碼必須是大於0的整數'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('每頁數量必須在1-100之間'),
    handleValidationErrors
  ],

  dateRange: [
    query('start_date')
      .optional()
      .isISO8601()
      .withMessage('開始日期格式不正確'),
    query('end_date')
      .optional()
      .isISO8601()
      .withMessage('結束日期格式不正確'),
    handleValidationErrors
  ]
};

module.exports = {
  validateSystem,
  validateNotification,
  validateQuery,
  handleValidationErrors
};
