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

// 搜尋相關驗證
const validateSearch = {
  search: [
    body('query')
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage('搜尋關鍵字長度必須在1-255個字符之間'),
    body('search_type')
      .optional()
      .isIn(['product', 'content', 'user'])
      .withMessage('搜尋類型必須是 product、content 或 user'),
    body('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('結果數量限制必須在1-100之間'),
    body('offset')
      .optional()
      .isInt({ min: 0 })
      .withMessage('結果偏移量必須是非負整數'),
    handleValidationErrors
  ]
};

// 推薦相關驗證
const validateRecommendation = {
  click: [
    body('item_id')
      .isString()
      .isLength({ min: 1, max: 100 })
      .withMessage('項目ID長度必須在1-100個字符之間'),
    body('recommendation_type')
      .isIn(['collaborative', 'content_based', 'hybrid', 'trending'])
      .withMessage('推薦類型必須是 collaborative、content_based、hybrid 或 trending'),
    body('score')
      .optional()
      .isFloat({ min: 0, max: 1 })
      .withMessage('推薦分數必須在0-1之間'),
    handleValidationErrors
  ]
};

// 查詢參數驗證
const validateQuery = {
  period: [
    query('period')
      .optional()
      .isIn(['day', 'week', 'month', 'quarter', 'year'])
      .withMessage('時間週期必須是 day、week、month、quarter 或 year'),
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
  validateSearch,
  validateRecommendation,
  validateQuery,
  handleValidationErrors
};
