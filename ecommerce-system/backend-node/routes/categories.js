const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { postgresPool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');
const { asyncHandler, ValidationError, NotFoundError } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * @swagger
 * /api/v1/categories:
 *   get:
 *     summary: 獲取商品分類列表
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: integer
 *         description: 分類狀態 (1=啟用, 0=停用)
 *     responses:
 *       200:
 *         description: 成功獲取分類列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       category_id:
 *                         type: integer
 *                       public_id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       status:
 *                         type: integer
 *                       created_at:
 *                         type: string
 *                       updated_at:
 *                         type: string
 *       401:
 *         description: 認證失敗
 *       500:
 *         description: 服務器錯誤
 */
router.get('/', authenticateToken, checkPermission('view_products'), asyncHandler(async (req, res) => {
  const { status } = req.query;
  
  let query = 'SELECT * FROM categories';
  const params = [];
  
  if (status !== undefined) {
    query += ' WHERE status = $1';
    params.push(parseInt(status));
  }
  
  query += ' ORDER BY category_id ASC';
  
  const result = await postgresPool.query(query, params);
  
  res.json({
    success: true,
    data: result.rows.map(row => ({
      _id: row.public_id, // 前端期望的 _id 欄位
      category_id: row.category_id,
      public_id: row.public_id,
      name: row.name,
      description: row.description,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at
    }))
  });
}));

/**
 * @swagger
 * /api/v1/categories/{id}:
 *   get:
 *     summary: 獲取單個分類詳情
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 分類 ID (public_id)
 *     responses:
 *       200:
 *         description: 成功獲取分類詳情
 *       404:
 *         description: 分類不存在
 *       401:
 *         description: 認證失敗
 *       500:
 *         description: 服務器錯誤
 */
router.get('/:id', authenticateToken, checkPermission('view_products'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const result = await postgresPool.query(
    'SELECT * FROM categories WHERE public_id = $1',
    [id]
  );
  
  if (result.rows.length === 0) {
    throw new NotFoundError('分類不存在');
  }
  
  const category = result.rows[0];
  
  res.json({
    success: true,
    data: {
      _id: category.public_id,
      category_id: category.category_id,
      public_id: category.public_id,
      name: category.name,
      description: category.description,
      status: category.status,
      created_at: category.created_at,
      updated_at: category.updated_at
    }
  });
}));

/**
 * @swagger
 * /api/v1/categories:
 *   post:
 *     summary: 創建新分類
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: 分類名稱
 *               description:
 *                 type: string
 *                 description: 分類描述
 *               status:
 *                 type: integer
 *                 default: 1
 *                 description: 分類狀態
 *     responses:
 *       201:
 *         description: 分類創建成功
 *       400:
 *         description: 請求參數錯誤
 *       401:
 *         description: 認證失敗
 *       500:
 *         description: 服務器錯誤
 */
router.post('/', authenticateToken, checkPermission('create_products'), asyncHandler(async (req, res) => {
  const { name, description, status = 1 } = req.body;
  
  if (!name) {
    throw new ValidationError('分類名稱不能為空');
  }
  
  const publicId = uuidv4();
  
  const result = await postgresPool.query(
    'INSERT INTO categories (public_id, name, description, status) VALUES ($1, $2, $3, $4) RETURNING *',
    [publicId, name, description, status]
  );
  
  const category = result.rows[0];
  
  res.status(201).json({
    success: true,
    data: {
      _id: category.public_id,
      category_id: category.category_id,
      public_id: category.public_id,
      name: category.name,
      description: category.description,
      status: category.status,
      created_at: category.created_at,
      updated_at: category.updated_at
    }
  });
}));

/**
 * @swagger
 * /api/v1/categories/{id}:
 *   put:
 *     summary: 更新分類
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 分類 ID (public_id)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: 分類名稱
 *               description:
 *                 type: string
 *                 description: 分類描述
 *               status:
 *                 type: integer
 *                 description: 分類狀態
 *     responses:
 *       200:
 *         description: 分類更新成功
 *       404:
 *         description: 分類不存在
 *       400:
 *         description: 請求參數錯誤
 *       401:
 *         description: 認證失敗
 *       500:
 *         description: 服務器錯誤
 */
router.put('/:id', authenticateToken, checkPermission('update_products'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, status } = req.body;
  
  // 檢查分類是否存在
  const checkResult = await postgresPool.query(
    'SELECT * FROM categories WHERE public_id = $1',
    [id]
  );
  
  if (checkResult.rows.length === 0) {
    throw new NotFoundError('分類不存在');
  }
  
  // 構建更新查詢
  const updates = [];
  const values = [];
  let paramCount = 1;
  
  if (name !== undefined) {
    updates.push(`name = $${paramCount}`);
    values.push(name);
    paramCount++;
  }
  
  if (description !== undefined) {
    updates.push(`description = $${paramCount}`);
    values.push(description);
    paramCount++;
  }
  
  if (status !== undefined) {
    updates.push(`status = $${paramCount}`);
    values.push(status);
    paramCount++;
  }
  
  if (updates.length === 0) {
    throw new ValidationError('沒有提供要更新的欄位');
  }
  
  updates.push(`updated_at = NOW()`);
  values.push(id);
  
  const result = await postgresPool.query(
    `UPDATE categories SET ${updates.join(', ')} WHERE public_id = $${paramCount} RETURNING *`,
    values
  );
  
  const category = result.rows[0];
  
  res.json({
    success: true,
    data: {
      _id: category.public_id,
      category_id: category.category_id,
      public_id: category.public_id,
      name: category.name,
      description: category.description,
      status: category.status,
      created_at: category.created_at,
      updated_at: category.updated_at
    }
  });
}));

/**
 * @swagger
 * /api/v1/categories/{id}:
 *   delete:
 *     summary: 刪除分類
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 分類 ID (public_id)
 *     responses:
 *       200:
 *         description: 分類刪除成功
 *       404:
 *         description: 分類不存在
 *       401:
 *         description: 認證失敗
 *       500:
 *         description: 服務器錯誤
 */
router.delete('/:id', authenticateToken, checkPermission('delete_products'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // 檢查分類是否存在
  const checkResult = await postgresPool.query(
    'SELECT * FROM categories WHERE public_id = $1',
    [id]
  );
  
  if (checkResult.rows.length === 0) {
    throw new NotFoundError('分類不存在');
  }
  
  // 檢查是否有商品使用此分類
  const productCheck = await postgresPool.query(
    'SELECT COUNT(*) as count FROM products WHERE category_id = $1',
    [checkResult.rows[0].category_id]
  );
  
  if (parseInt(productCheck.rows[0].count) > 0) {
    throw new ValidationError('無法刪除，該分類下還有商品');
  }
  
  await postgresPool.query(
    'DELETE FROM categories WHERE public_id = $1',
    [id]
  );
  
  res.json({
    success: true,
    message: '分類刪除成功'
  });
}));

module.exports = router;
