const { body, validationResult } = require('express-validator');

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

// 訂單相關驗證
const validateOrder = {
  create: [
    body('items')
      .isArray({ min: 1 })
      .withMessage('訂單項目不能為空'),
    body('items.*.product_id')
      .isUUID()
      .withMessage('商品ID必須是有效的UUID'),
    body('items.*.quantity')
      .isInt({ min: 1 })
      .withMessage('商品數量必須是大於0的整數'),
    body('shipping_address')
      .isObject()
      .withMessage('配送地址必須是物件'),
    body('billing_address')
      .isObject()
      .withMessage('帳單地址必須是物件'),
    body('notes')
      .optional()
      .isString()
      .isLength({ max: 500 })
      .withMessage('備註不能超過500個字符'),
    handleValidationErrors
  ]
};

// 支付相關驗證
const validatePayment = {
  create: [
    body('order_id')
      .isUUID()
      .withMessage('訂單ID必須是有效的UUID'),
    body('payment_method')
      .isString()
      .isLength({ min: 2, max: 50 })
      .withMessage('支付方式長度必須在2-50個字符之間'),
    body('payment_provider')
      .isString()
      .isLength({ min: 2, max: 50 })
      .withMessage('支付提供商長度必須在2-50個字符之間'),
    body('amount')
      .isNumeric()
      .withMessage('金額必須是數字')
      .isFloat({ min: 0 })
      .withMessage('金額必須大於等於0'),
    body('currency')
      .optional()
      .isString()
      .isLength({ min: 3, max: 3 })
      .withMessage('貨幣代碼必須是3個字符'),
    handleValidationErrors
  ]
};

// 物流相關驗證
const validateLogistics = {
  create: [
    body('order_id')
      .isUUID()
      .withMessage('訂單ID必須是有效的UUID'),
    body('shipping_method')
      .isString()
      .isLength({ min: 2, max: 50 })
      .withMessage('配送方式長度必須在2-50個字符之間'),
    body('carrier')
      .isString()
      .isLength({ min: 2, max: 50 })
      .withMessage('承運商長度必須在2-50個字符之間'),
    body('tracking_number')
      .optional()
      .isString()
      .isLength({ min: 5, max: 100 })
      .withMessage('追蹤號碼長度必須在5-100個字符之間'),
    body('shipping_address')
      .isObject()
      .withMessage('配送地址必須是物件'),
    body('shipping_cost')
      .optional()
      .isNumeric()
      .withMessage('配送費用必須是數字')
      .isFloat({ min: 0 })
      .withMessage('配送費用必須大於等於0'),
    handleValidationErrors
  ]
};

module.exports = {
  validateOrder,
  validatePayment,
  validateLogistics,
  handleValidationErrors
};
