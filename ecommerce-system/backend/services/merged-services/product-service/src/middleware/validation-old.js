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

// 商品相關驗證
const validateProduct = {
  create: [
    body('name')
      .trim()
      .isLength({ min: 2, max: 255 })
      .withMessage('商品名稱長度必須在2-255個字符之間'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('商品描述不能超過1000個字符'),
    body('price')
      .isNumeric()
      .withMessage('價格必須是數字')
      .isFloat({ min: 0 })
      .withMessage('價格必須大於等於0'),
    body('category_id')
      .isUUID()
      .withMessage('分類ID必須是有效的UUID格式'),
    body('status')
      .optional()
      .isIn(['active', 'inactive', 'draft'])
      .withMessage('狀態必須是 active、inactive 或 draft'),
    body('images')
      .optional()
      .isArray()
      .withMessage('圖片必須是陣列格式'),
    handleValidationErrors
  ],

  update: [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 255 })
      .withMessage('商品名稱長度必須在2-255個字符之間'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('商品描述不能超過1000個字符'),
    body('price')
      .optional()
      .isNumeric()
      .withMessage('價格必須是數字')
      .isFloat({ min: 0 })
      .withMessage('價格必須大於等於0'),
    body('category_id')
      .optional()
      .isUUID()
      .withMessage('分類ID必須是有效的UUID格式'),
    body('status')
      .optional()
      .isIn(['active', 'inactive', 'draft'])
      .withMessage('狀態必須是 active、inactive 或 draft'),
    body('images')
      .optional()
      .isArray()
      .withMessage('圖片必須是陣列格式'),
    handleValidationErrors
  ]
};

// 庫存相關驗證
const validateInventory = {
  create: [
    body('product_id')
      .isUUID()
      .withMessage('商品ID必須是有效的UUID'),
    body('sku')
      .trim()
      .isLength({ min: 3, max: 50 })
      .withMessage('SKU長度必須在3-50個字符之間'),
    body('quantity')
      .isInt({ min: 0 })
      .withMessage('數量必須是非負整數'),
    body('reserved_quantity')
      .optional()
      .isInt({ min: 0 })
      .withMessage('預留數量必須是非負整數'),
    body('reorder_point')
      .optional()
      .isInt({ min: 0 })
      .withMessage('補貨點必須是非負整數'),
    body('status')
      .optional()
      .isIn(['active', 'inactive'])
      .withMessage('狀態必須是 active 或 inactive'),
    handleValidationErrors
  ],

  update: [
    body('quantity')
      .optional()
      .isInt({ min: 0 })
      .withMessage('數量必須是非負整數'),
    body('reserved_quantity')
      .optional()
      .isInt({ min: 0 })
      .withMessage('預留數量必須是非負整數'),
    body('reorder_point')
      .optional()
      .isInt({ min: 0 })
      .withMessage('補貨點必須是非負整數'),
    body('status')
      .optional()
      .isIn(['active', 'inactive'])
      .withMessage('狀態必須是 active 或 inactive'),
    handleValidationErrors
  ]
};

module.exports = {
  validateProduct,
  validateInventory,
  handleValidationErrors
};
