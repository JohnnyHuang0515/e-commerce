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
      .isIn(['ADMIN', 'MANAGER', 'MERCHANT', 'STAFF', 'CUSTOMER', 'GUEST'])
      .withMessage('角色必須是 ADMIN、MANAGER、MERCHANT、STAFF、CUSTOMER 或 GUEST'),
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
      .isIn(['ADMIN', 'MANAGER', 'MERCHANT', 'STAFF', 'CUSTOMER', 'GUEST'])
      .withMessage('角色必須是 ADMIN、MANAGER、MERCHANT、STAFF、CUSTOMER 或 GUEST'),
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
      .isIn(['ADMIN', 'MANAGER', 'MERCHANT', 'STAFF', 'CUSTOMER', 'GUEST'])
      .withMessage('角色必須是 ADMIN、MANAGER、MERCHANT、STAFF、CUSTOMER 或 GUEST'),
    body('status')
      .optional()
      .isIn(['active', 'inactive', 'suspended'])
      .withMessage('狀態必須是 active、inactive 或 suspended'),
    handleValidationErrors
  ],

  changePassword: [
    body('currentPassword')
      .isLength({ min: 6 })
      .withMessage('請提供目前的密碼'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('新密碼至少需要6個字符'),
    handleValidationErrors
  ],

  updateProfile: [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('姓名長度必須在2-50個字符之間'),
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
  ],

  create: [
    body('name')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('權限名稱長度必須在2-50個字符之間'),
    body('description')
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('權限描述長度必須在5-200個字符之間'),
    handleValidationErrors
  ],

  update: [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('權限名稱長度必須在2-50個字符之間'),
    body('description')
      .optional()
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('權限描述長度必須在5-200個字符之間'),
    handleValidationErrors
  ]
};

module.exports = {
  validateAuth,
  validateUser,
  validatePermission,
  handleValidationErrors
};
