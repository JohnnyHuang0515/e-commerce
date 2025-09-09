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

// 認證相關驗證
const validateAuth = {
  login: [
    body('email')
      .isEmail()
      .withMessage('請提供有效的郵箱地址')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 6 })
      .withMessage('密碼至少需要6個字符'),
    handleValidationErrors
  ],

  register: [
    body('email')
      .isEmail()
      .withMessage('請提供有效的郵箱地址')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 6 })
      .withMessage('密碼至少需要6個字符')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('密碼必須包含大小寫字母和數字'),
    body('name')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('姓名長度必須在2-50個字符之間'),
    body('role')
      .optional()
      .isIn(['admin', 'manager', 'user'])
      .withMessage('角色必須是 admin、manager 或 user'),
    handleValidationErrors
  ]
};

// 用戶相關驗證
const validateUser = {
  create: [
    body('email')
      .isEmail()
      .withMessage('請提供有效的郵箱地址')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 6 })
      .withMessage('密碼至少需要6個字符')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('密碼必須包含大小寫字母和數字'),
    body('name')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('姓名長度必須在2-50個字符之間'),
    body('role')
      .optional()
      .isIn(['admin', 'manager', 'user'])
      .withMessage('角色必須是 admin、manager 或 user'),
    body('status')
      .optional()
      .isIn(['active', 'inactive', 'suspended'])
      .withMessage('狀態必須是 active、inactive 或 suspended'),
    handleValidationErrors
  ],

  update: [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('姓名長度必須在2-50個字符之間'),
    body('email')
      .optional()
      .isEmail()
      .withMessage('請提供有效的郵箱地址')
      .normalizeEmail(),
    body('role')
      .optional()
      .isIn(['admin', 'manager', 'user'])
      .withMessage('角色必須是 admin、manager 或 user'),
    body('status')
      .optional()
      .isIn(['active', 'inactive', 'suspended'])
      .withMessage('狀態必須是 active、inactive 或 suspended'),
    handleValidationErrors
  ]
};

// 權限相關驗證
const validatePermission = {
  createRole: [
    body('name')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('角色名稱長度必須在2-50個字符之間'),
    body('description')
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('角色描述長度必須在5-200個字符之間'),
    body('permissions')
      .optional()
      .isArray()
      .withMessage('權限必須是陣列格式'),
    handleValidationErrors
  ],

  updateRole: [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('角色名稱長度必須在2-50個字符之間'),
    body('description')
      .optional()
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('角色描述長度必須在5-200個字符之間'),
    body('permissions')
      .optional()
      .isArray()
      .withMessage('權限必須是陣列格式'),
    handleValidationErrors
  ]
};

module.exports = {
  validateAuth,
  validateUser,
  validatePermission,
  handleValidationErrors
};
