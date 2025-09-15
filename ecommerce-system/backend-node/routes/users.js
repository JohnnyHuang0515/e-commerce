const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { 
  postgresPool, 
  authenticateToken,
  getUserByPublicId,
  getIdMapping 
} = require('../config/database');
const { checkPermission, checkResourceOwner } = require('../middleware/rbac');
const { asyncHandler, ValidationError, NotFoundError } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         public_id:
 *           type: string
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         status:
 *           type: integer
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *     CreateUserRequest:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *       properties:
 *         name:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           minLength: 6
 *         role_id:
 *           type: integer
 */

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: 獲取用戶列表
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 頁碼
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 每頁數量
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: 搜尋關鍵字
 *       - in: query
 *         name: status
 *         schema:
 *           type: integer
 *         description: 用戶狀態
 *     responses:
 *       200:
 *         description: 獲取成功
 *       403:
 *         description: 權限不足
 */
router.get('/', authenticateToken, checkPermission('view_users'), asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search = '', status } = req.query;
  const offset = (page - 1) * limit;
  
  let whereClause = '';
  let queryParams = [];
  let paramIndex = 1;
  
  if (search) {
    whereClause += ` AND (u.name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`;
    queryParams.push(`%${search}%`);
    paramIndex++;
  }
  
  if (status !== undefined) {
    whereClause += ` AND u.status = $${paramIndex}`;
    queryParams.push(parseInt(status));
    paramIndex++;
  }
  
  // 查詢用戶列表
  const result = await postgresPool.query(`
    SELECT 
      u.user_id,
      u.public_id,
      u.name,
      u.email,
      u.status,
      u.created_at,
      u.updated_at,
      r.role_name
    FROM users u
    LEFT JOIN user_roles ur ON u.user_id = ur.user_id AND ur.is_active = true
    LEFT JOIN roles r ON ur.role_id = r.role_id
    WHERE 1=1 ${whereClause}
    ORDER BY u.created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `, [...queryParams, limit, offset]);
  
  // 查詢總數
  const countResult = await postgresPool.query(`
    SELECT COUNT(*) as total
    FROM users u
    WHERE 1=1 ${whereClause}
  `, queryParams);
  
  const total = parseInt(countResult.rows[0].total);
  
  res.json({
    success: true,
    data: result.rows,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

/**
 * @swagger
 * /api/v1/users/{publicId}:
 *   get:
 *     summary: 獲取用戶詳情
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: publicId
 *         required: true
 *         schema:
 *           type: string
 *         description: 用戶公開 ID
 *     responses:
 *       200:
 *         description: 獲取成功
 *       404:
 *         description: 用戶不存在
 */
router.get('/:publicId', authenticateToken, checkPermission('view_users'), asyncHandler(async (req, res) => {
  const { publicId } = req.params;
  
  const user = await getUserByPublicId(publicId);
  if (!user) {
    throw new NotFoundError('用戶不存在');
  }
  
  // 獲取用戶角色
  const roleResult = await postgresPool.query(`
    SELECT r.role_name, r.description
    FROM users u
    JOIN user_roles ur ON u.user_id = ur.user_id
    JOIN roles r ON ur.role_id = r.role_id
    WHERE u.user_id = $1 AND ur.is_active = true
  `, [user.user_id]);
  
  // 獲取用戶權限
  const { getUserPermissions } = require('../config/database');
  const permissions = await getUserPermissions(user.user_id);
  
  res.json({
    success: true,
    data: {
      ...user,
      roles: roleResult.rows,
      permissions
    }
  });
}));

/**
 * @swagger
 * /api/v1/users:
 *   post:
 *     summary: 創建新用戶
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUserRequest'
 *     responses:
 *       201:
 *         description: 創建成功
 *       400:
 *         description: 請求數據無效
 */
router.post('/', authenticateToken, checkPermission('manage_users'), asyncHandler(async (req, res) => {
  const { name, email, password, role_id } = req.body;
  
  if (!name || !email || !password) {
    throw new ValidationError('請提供姓名、電子郵件和密碼');
  }
  
  if (password.length < 6) {
    throw new ValidationError('密碼長度至少需要 6 個字符');
  }
  
  // 檢查電子郵件是否已存在
  const existingUser = await postgresPool.query(`
    SELECT user_id FROM users WHERE email = $1
  `, [email]);
  
  if (existingUser.rows.length > 0) {
    throw new ValidationError('電子郵件已被使用');
  }
  
  // 加密密碼
  const saltRounds = 12;
  const passwordHash = await bcrypt.hash(password, saltRounds);
  
  // 生成公開 ID
  const publicId = uuidv4();
  
  // 創建用戶
  const result = await postgresPool.query(`
    INSERT INTO users (name, email, password_hash, public_id, status)
    VALUES ($1, $2, $3, $4, 1)
    RETURNING user_id, public_id, name, email, status, created_at
  `, [name, email, passwordHash, publicId]);
  
  const newUser = result.rows[0];
  
  // 分配角色
  if (role_id) {
    await postgresPool.query(`
      INSERT INTO user_roles (user_id, role_id, is_active)
      VALUES ($1, $2, true)
    `, [newUser.user_id, role_id]);
  }
  
  // 記錄創建事件
  try {
    const { mongoClient } = require('../config/database');
    await mongoClient.db('ecommerce').collection('user_events').insertOne({
      user_id: newUser.user_id,
      event_type: 'user_created',
      event_data: {
        created_by: req.user.user_id,
        ip: req.ip,
        user_agent: req.get('User-Agent'),
        timestamp: new Date()
      },
      created_at: new Date()
    });
  } catch (error) {
    console.error('記錄用戶創建事件失敗:', error);
  }
  
  res.status(201).json({
    success: true,
    data: newUser,
    message: '用戶創建成功'
  });
}));

/**
 * @swagger
 * /api/v1/users/{publicId}:
 *   put:
 *     summary: 更新用戶資料
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: publicId
 *         required: true
 *         schema:
 *           type: string
 *         description: 用戶公開 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               status:
 *                 type: integer
 *     responses:
 *       200:
 *         description: 更新成功
 *       404:
 *         description: 用戶不存在
 */
router.put('/:publicId', authenticateToken, checkPermission('manage_users'), asyncHandler(async (req, res) => {
  const { publicId } = req.params;
  const { name, email, status } = req.body;
  
  const user = await getUserByPublicId(publicId);
  if (!user) {
    throw new NotFoundError('用戶不存在');
  }
  
  // 檢查電子郵件是否被其他用戶使用
  if (email && email !== user.email) {
    const existingUser = await postgresPool.query(`
      SELECT user_id FROM users WHERE email = $1 AND user_id != $2
    `, [email, user.user_id]);
    
    if (existingUser.rows.length > 0) {
      throw new ValidationError('電子郵件已被其他用戶使用');
    }
  }
  
  // 更新用戶資料
  const updateFields = [];
  const updateValues = [];
  let paramIndex = 1;
  
  if (name !== undefined) {
    updateFields.push(`name = $${paramIndex}`);
    updateValues.push(name);
    paramIndex++;
  }
  
  if (email !== undefined) {
    updateFields.push(`email = $${paramIndex}`);
    updateValues.push(email);
    paramIndex++;
  }
  
  if (status !== undefined) {
    updateFields.push(`status = $${paramIndex}`);
    updateValues.push(status);
    paramIndex++;
  }
  
  if (updateFields.length === 0) {
    throw new ValidationError('沒有提供要更新的資料');
  }
  
  updateFields.push(`updated_at = NOW()`);
  updateValues.push(user.user_id);
  
  await postgresPool.query(`
    UPDATE users
    SET ${updateFields.join(', ')}
    WHERE user_id = $${paramIndex}
  `, updateValues);
  
  // 記錄更新事件
  try {
    const { mongoClient } = require('../config/database');
    await mongoClient.db('ecommerce').collection('user_events').insertOne({
      user_id: user.user_id,
      event_type: 'user_updated',
      event_data: {
        updated_by: req.user.user_id,
        changes: { name, email, status },
        ip: req.ip,
        user_agent: req.get('User-Agent'),
        timestamp: new Date()
      },
      created_at: new Date()
    });
  } catch (error) {
    console.error('記錄用戶更新事件失敗:', error);
  }
  
  res.json({
    success: true,
    message: '用戶資料更新成功'
  });
}));

/**
 * @swagger
 * /api/v1/users/{publicId}/role:
 *   put:
 *     summary: 更新用戶角色
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: publicId
 *         required: true
 *         schema:
 *           type: string
 *         description: 用戶公開 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role_id
 *             properties:
 *               role_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: 更新成功
 *       404:
 *         description: 用戶不存在
 */
router.put('/:publicId/role', authenticateToken, checkPermission('assign_roles'), asyncHandler(async (req, res) => {
  const { publicId } = req.params;
  const { role_id } = req.body;
  
  if (!role_id) {
    throw new ValidationError('請提供角色 ID');
  }
  
  const user = await getUserByPublicId(publicId);
  if (!user) {
    throw new NotFoundError('用戶不存在');
  }
  
  // 檢查角色是否存在
  const roleResult = await postgresPool.query(`
    SELECT role_id FROM roles WHERE role_id = $1
  `, [role_id]);
  
  if (roleResult.rows.length === 0) {
    throw new ValidationError('角色不存在');
  }
  
  // 更新用戶角色
  await postgresPool.query(`
    UPDATE user_roles
    SET is_active = false, updated_at = NOW()
    WHERE user_id = $1
  `, [user.user_id]);
  
  await postgresPool.query(`
    INSERT INTO user_roles (user_id, role_id, is_active)
    VALUES ($1, $2, true)
  `, [user.user_id, role_id]);
  
  // 清除權限快取
  try {
    const { redisClient } = require('../config/database');
    await redisClient.del(`permissions:${user.user_id}`);
  } catch (error) {
    console.error('清除權限快取失敗:', error);
  }
  
  res.json({
    success: true,
    message: '用戶角色更新成功'
  });
}));

/**
 * @swagger
 * /api/v1/users/{publicId}:
 *   delete:
 *     summary: 刪除用戶（軟刪除）
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: publicId
 *         required: true
 *         schema:
 *           type: string
 *         description: 用戶公開 ID
 *     responses:
 *       200:
 *         description: 刪除成功
 *       404:
 *         description: 用戶不存在
 */
router.delete('/:publicId', authenticateToken, checkPermission('manage_users'), asyncHandler(async (req, res) => {
  const { publicId } = req.params;
  
  const user = await getUserByPublicId(publicId);
  if (!user) {
    throw new NotFoundError('用戶不存在');
  }
  
  // 軟刪除用戶
  await postgresPool.query(`
    UPDATE users
    SET status = 0, updated_at = NOW()
    WHERE user_id = $1
  `, [user.user_id]);
  
  // 停用用戶角色
  await postgresPool.query(`
    UPDATE user_roles
    SET is_active = false, updated_at = NOW()
    WHERE user_id = $1
  `, [user.user_id]);
  
  // 記錄刪除事件
  try {
    const { mongoClient } = require('../config/database');
    await mongoClient.db('ecommerce').collection('user_events').insertOne({
      user_id: user.user_id,
      event_type: 'user_deleted',
      event_data: {
        deleted_by: req.user.user_id,
        ip: req.ip,
        user_agent: req.get('User-Agent'),
        timestamp: new Date()
      },
      created_at: new Date()
    });
  } catch (error) {
    console.error('記錄用戶刪除事件失敗:', error);
  }
  
  res.json({
    success: true,
    message: '用戶刪除成功'
  });
}));

/**
 * @swagger
 * /api/v1/users/overview:
 *   get:
 *     summary: 獲取用戶概覽統計
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 獲取成功
 */
router.get('/overview', authenticateToken, checkPermission('view_reports'), asyncHandler(async (req, res) => {
  // 獲取用戶統計
  const statsResult = await postgresPool.query(`
    SELECT 
      COUNT(*) as total_users,
      COUNT(CASE WHEN status = 1 THEN 1 END) as active_users,
      COUNT(CASE WHEN status = 0 THEN 1 END) as inactive_users,
      COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as new_users_30d
    FROM users
  `);
  
  // 獲取角色分布
  const roleStatsResult = await postgresPool.query(`
    SELECT 
      r.role_name,
      COUNT(ur.user_id) as user_count
    FROM roles r
    LEFT JOIN user_roles ur ON r.role_id = ur.role_id AND ur.is_active = true
    GROUP BY r.role_id, r.role_name
    ORDER BY user_count DESC
  `);
  
  res.json({
    success: true,
    data: {
      user_stats: statsResult.rows[0],
      role_distribution: roleStatsResult.rows
    }
  });
}));

module.exports = router;
