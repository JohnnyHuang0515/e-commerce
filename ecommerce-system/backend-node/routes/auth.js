const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { 
  postgresPool, 
  getUserByEmail, 
  getUserByPublicId,
  getUserPermissions 
} = require('../config/database');
const { checkPermission } = require('../middleware/rbac');
const { authenticateToken } = require('../config/database');
const { asyncHandler, ValidationError, UnauthorizedError } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: admin@ecommerce.com
 *         password:
 *           type: string
 *           example: admin123
 *     LoginResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         data:
 *           type: object
 *           properties:
 *             token:
 *               type: string
 *             user:
 *               type: object
 *               properties:
 *                 public_id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
 *                 permissions:
 *                   type: array
 *                   items:
 *                     type: string
 */

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: 用戶登入
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: 登入成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: 認證失敗
 *       400:
 *         description: 請求數據無效
 */
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  // 驗證輸入
  if (!email || !password) {
    throw new ValidationError('請提供電子郵件和密碼');
  }
  
  // 查找用戶
  const user = await getUserByEmail(email);
  if (!user) {
    throw new UnauthorizedError('無效的電子郵件或密碼');
  }
  
  // 檢查用戶狀態
  if (user.status !== 'active' && user.status !== 1) {
    throw new UnauthorizedError('用戶帳號已被停用');
  }
  
  // 驗證密碼
  const isValidPassword = await bcrypt.compare(password, user.password_hash);
  if (!isValidPassword) {
    throw new UnauthorizedError('無效的電子郵件或密碼');
  }
  
  // 獲取用戶權限
  const permissions = await getUserPermissions(user.user_id);
  
  // 生成 JWT Token
  const token = jwt.sign(
    { 
      user_id: user.user_id,
      public_id: user.public_id,
      email: user.email 
    },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
  
  // 記錄登入事件到 MongoDB
  try {
    const { mongoClient } = require('../config/database');
    await mongoClient.db('ecommerce').collection('user_events').insertOne({
      user_id: user.user_id,
      event_type: 'login',
      event_data: {
        ip: req.ip,
        user_agent: req.get('User-Agent'),
        timestamp: new Date()
      },
      created_at: new Date()
    });
  } catch (error) {
    console.error('記錄登入事件失敗:', error);
  }
  
  res.json({
    success: true,
    data: {
      token,
      user: {
        public_id: user.public_id,
        name: user.name,
        email: user.email,
        permissions
      }
    }
  });
}));

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: 用戶登出
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 登出成功
 */
router.post('/logout', authenticateToken, asyncHandler(async (req, res) => {
  // 記錄登出事件到 MongoDB
  try {
    const { mongoClient } = require('../config/database');
    await mongoClient.db('ecommerce').collection('user_events').insertOne({
      user_id: req.user.user_id,
      event_type: 'logout',
      event_data: {
        ip: req.ip,
        user_agent: req.get('User-Agent'),
        timestamp: new Date()
      },
      created_at: new Date()
    });
  } catch (error) {
    console.error('記錄登出事件失敗:', error);
  }
  
  res.json({
    success: true,
    message: '登出成功'
  });
}));

/**
 * @swagger
 * /api/v1/auth/profile:
 *   get:
 *     summary: 獲取用戶資料
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 獲取成功
 *       401:
 *         description: 未認證
 */
router.get('/profile', authenticateToken, asyncHandler(async (req, res) => {
  const user = await getUserByPublicId(req.user.public_id);
  if (!user) {
    throw new UnauthorizedError('用戶不存在');
  }
  
  // 獲取用戶權限
  const permissions = await getUserPermissions(user.user_id);
  
  // 獲取用戶角色
  const roleResult = await postgresPool.query(`
    SELECT r.role_name, r.description
    FROM users u
    JOIN user_roles ur ON u.user_id = ur.user_id
    JOIN roles r ON ur.role_id = r.role_id
    WHERE u.user_id = $1 AND ur.is_active = true
  `, [user.user_id]);
  
  const roles = roleResult.rows.map(row => ({
    name: row.role_name,
    description: row.description
  }));
  
  res.json({
    success: true,
    data: {
      public_id: user.public_id,
      name: user.name,
      email: user.email,
      status: user.status,
      roles,
      permissions,
      created_at: user.created_at,
      updated_at: user.updated_at
    }
  });
}));

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     summary: 刷新 Token
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 刷新成功
 *       401:
 *         description: 認證失敗
 */
router.post('/refresh', authenticateToken, asyncHandler(async (req, res) => {
  const user = await getUserByPublicId(req.user.public_id);
  if (!user || user.status !== 1) {
    throw new UnauthorizedError('用戶不存在或已被停用');
  }
  
  // 生成新的 JWT Token
  const token = jwt.sign(
    { 
      user_id: user.user_id,
      public_id: user.public_id,
      email: user.email 
    },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
  
  res.json({
    success: true,
    data: {
      token
    }
  });
}));

/**
 * @swagger
 * /api/v1/auth/change-password:
 *   put:
 *     summary: 修改密碼
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - current_password
 *               - new_password
 *             properties:
 *               current_password:
 *                 type: string
 *               new_password:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: 修改成功
 *       400:
 *         description: 請求數據無效
 *       401:
 *         description: 認證失敗
 */
router.put('/change-password', authenticateToken, asyncHandler(async (req, res) => {
  const { current_password, new_password } = req.body;
  
  if (!current_password || !new_password) {
    throw new ValidationError('請提供當前密碼和新密碼');
  }
  
  if (new_password.length < 6) {
    throw new ValidationError('新密碼長度至少需要 6 個字符');
  }
  
  // 獲取用戶完整信息（包含密碼哈希）
  const userResult = await postgresPool.query(`
    SELECT user_id, password_hash
    FROM users
    WHERE user_id = $1
  `, [req.user.user_id]);
  
  const user = userResult.rows[0];
  if (!user) {
    throw new UnauthorizedError('用戶不存在');
  }
  
  // 驗證當前密碼
  const isValidPassword = await bcrypt.compare(current_password, user.password_hash);
  if (!isValidPassword) {
    throw new UnauthorizedError('當前密碼不正確');
  }
  
  // 加密新密碼
  const saltRounds = 12;
  const newPasswordHash = await bcrypt.hash(new_password, saltRounds);
  
  // 更新密碼
  await postgresPool.query(`
    UPDATE users
    SET password_hash = $1, updated_at = NOW()
    WHERE user_id = $2
  `, [newPasswordHash, req.user.user_id]);
  
  // 記錄密碼修改事件
  try {
    const { mongoClient } = require('../config/database');
    await mongoClient.db('ecommerce').collection('user_events').insertOne({
      user_id: req.user.user_id,
      event_type: 'password_change',
      event_data: {
        ip: req.ip,
        user_agent: req.get('User-Agent'),
        timestamp: new Date()
      },
      created_at: new Date()
    });
  } catch (error) {
    console.error('記錄密碼修改事件失敗:', error);
  }
  
  res.json({
    success: true,
    message: '密碼修改成功'
  });
}));

/**
 * @swagger
 * /api/v1/auth/permissions:
 *   get:
 *     summary: 獲取用戶權限列表
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 獲取成功
 */
router.get('/permissions', authenticateToken, asyncHandler(async (req, res) => {
  const permissions = await getUserPermissions(req.user.user_id);
  
  res.json({
    success: true,
    data: {
      permissions,
      count: permissions.length
    }
  });
}));

module.exports = router;
