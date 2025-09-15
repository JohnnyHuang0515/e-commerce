const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { 
  postgresPool, 
  authenticateToken,
  mongoClient,
  getIdMapping 
} = require('../config/database');
const { checkPermission } = require('../middleware/rbac');
const { asyncHandler, ValidationError, NotFoundError } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * @swagger
 * /api/v1/products:
 *   get:
 *     summary: 獲取商品列表
 *     tags: [Products]
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
 *         name: category_id
 *         schema:
 *           type: integer
 *         description: 分類 ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: integer
 *         description: 商品狀態
 *     responses:
 *       200:
 *         description: 獲取成功
 */
router.get('/', authenticateToken, checkPermission('view_products'), asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search = '', category_id, status } = req.query;
  const offset = (page - 1) * limit;
  
  let whereClause = '';
  let queryParams = [];
  let paramIndex = 1;
  
  if (search) {
    whereClause += ` AND (p.name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`;
    queryParams.push(`%${search}%`);
    paramIndex++;
  }
  
  if (category_id) {
    whereClause += ` AND p.category_id = $${paramIndex}`;
    queryParams.push(parseInt(category_id));
    paramIndex++;
  }
  
  if (status !== undefined) {
    whereClause += ` AND p.status = $${paramIndex}`;
    queryParams.push(parseInt(status));
    paramIndex++;
  }
  
  // 查詢商品列表
  const result = await postgresPool.query(`
    SELECT 
      p.product_id,
      p.public_id,
      p.name,
      p.description,
      p.price,
      p.sku,
      p.stock_quantity,
      p.status,
      p.created_at,
      p.updated_at,
      c.name as category_name,
      pi.image_url as main_image
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.category_id
    LEFT JOIN product_images pi ON p.product_id = pi.product_id AND pi.is_main = true
    WHERE 1=1 ${whereClause}
    ORDER BY p.created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `, [...queryParams, limit, offset]);
  
  // 查詢總數
  const countResult = await postgresPool.query(`
    SELECT COUNT(*) as total
    FROM products p
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
 * /api/v1/products/{publicId}:
 *   get:
 *     summary: 獲取商品詳情
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: publicId
 *         required: true
 *         schema:
 *           type: string
 *         description: 商品公開 ID
 *     responses:
 *       200:
 *         description: 獲取成功
 *       404:
 *         description: 商品不存在
 */
router.get('/:publicId', authenticateToken, checkPermission('view_products'), asyncHandler(async (req, res) => {
  const { publicId } = req.params;
  
  // 獲取商品基本信息
  const productResult = await postgresPool.query(`
    SELECT 
      p.product_id,
      p.public_id,
      p.name,
      p.description,
      p.price,
      p.sku,
      p.stock_quantity,
      p.status,
      p.created_at,
      p.updated_at,
      c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.category_id
    WHERE p.public_id = $1
  `, [publicId]);
  
  if (productResult.rows.length === 0) {
    throw new NotFoundError('商品不存在');
  }
  
  const product = productResult.rows[0];
  
  // 獲取商品圖片
  const imagesResult = await postgresPool.query(`
    SELECT image_id, public_id, image_url, is_main
    FROM product_images
    WHERE product_id = $1
    ORDER BY is_main DESC, created_at ASC
  `, [product.product_id]);
  
  // 從 MongoDB 獲取詳細信息
  let productDetails = null;
  try {
    const detailsCollection = mongoClient.db('ecommerce').collection('product_details');
    productDetails = await detailsCollection.findOne({ product_id: product.product_id });
  } catch (error) {
    console.error('獲取商品詳細信息失敗:', error);
  }
  
  res.json({
    success: true,
    data: {
      ...product,
      images: imagesResult.rows,
      details: productDetails
    }
  });
}));

/**
 * @swagger
 * /api/v1/products:
 *   post:
 *     summary: 創建新商品
 *     tags: [Products]
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
 *               - description
 *               - price
 *               - sku
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               sku:
 *                 type: string
 *               category_id:
 *                 type: integer
 *               stock_quantity:
 *                 type: integer
 *               attributes:
 *                 type: object
 *     responses:
 *       201:
 *         description: 創建成功
 *       400:
 *         description: 請求數據無效
 */
router.post('/', authenticateToken, checkPermission('create_product'), asyncHandler(async (req, res) => {
  const { name, description, price, sku, category_id, stock_quantity = 0, attributes = {} } = req.body;
  
  if (!name || !description || !price || !sku) {
    throw new ValidationError('請提供商品名稱、描述、價格和 SKU');
  }
  
  if (price < 0) {
    throw new ValidationError('商品價格不能為負數');
  }
  
  if (stock_quantity < 0) {
    throw new ValidationError('庫存數量不能為負數');
  }
  
  // 檢查 SKU 是否已存在
  const existingProduct = await postgresPool.query(`
    SELECT product_id FROM products WHERE sku = $1
  `, [sku]);
  
  if (existingProduct.rows.length > 0) {
    throw new ValidationError('SKU 已被使用');
  }
  
  // 生成公開 ID
  const publicId = uuidv4();
  
  // 創建商品
  const result = await postgresPool.query(`
    INSERT INTO products (name, description, price, sku, category_id, stock_quantity, public_id, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, 1)
    RETURNING product_id, public_id, name, description, price, sku, stock_quantity, status, created_at
  `, [name, description, price, sku, category_id, stock_quantity, publicId]);
  
  const newProduct = result.rows[0];
  
  // 在 MongoDB 中創建詳細信息
  try {
    await mongoClient.db('ecommerce').collection('product_details').insertOne({
      product_id: newProduct.product_id,
      attributes,
      description_html: description,
      version: 1,
      created_at: new Date(),
      updated_at: new Date()
    });
  } catch (error) {
    console.error('創建商品詳細信息失敗:', error);
  }
  
  // 記錄創建事件
  try {
    await mongoClient.db('ecommerce').collection('user_events').insertOne({
      user_id: req.user.user_id,
      event_type: 'product_created',
      event_data: {
        product_id: newProduct.product_id,
        product_name: newProduct.name,
        ip: req.ip,
        user_agent: req.get('User-Agent'),
        timestamp: new Date()
      },
      created_at: new Date()
    });
  } catch (error) {
    console.error('記錄商品創建事件失敗:', error);
  }
  
  res.status(201).json({
    success: true,
    data: newProduct,
    message: '商品創建成功'
  });
}));

/**
 * @swagger
 * /api/v1/products/{publicId}:
 *   put:
 *     summary: 更新商品
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: publicId
 *         required: true
 *         schema:
 *           type: string
 *         description: 商品公開 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               sku:
 *                 type: string
 *               category_id:
 *                 type: integer
 *               stock_quantity:
 *                 type: integer
 *               status:
 *                 type: integer
 *               attributes:
 *                 type: object
 *     responses:
 *       200:
 *         description: 更新成功
 *       404:
 *         description: 商品不存在
 */
router.put('/:publicId', authenticateToken, checkPermission('update_product'), asyncHandler(async (req, res) => {
  const { publicId } = req.params;
  const { name, description, price, sku, category_id, stock_quantity, status, attributes } = req.body;
  
  // 獲取商品信息
  const productResult = await postgresPool.query(`
    SELECT product_id FROM products WHERE public_id = $1
  `, [publicId]);
  
  if (productResult.rows.length === 0) {
    throw new NotFoundError('商品不存在');
  }
  
  const productId = productResult.rows[0].product_id;
  
  // 檢查 SKU 是否被其他商品使用
  if (sku) {
    const existingProduct = await postgresPool.query(`
      SELECT product_id FROM products WHERE sku = $1 AND product_id != $2
    `, [sku, productId]);
    
    if (existingProduct.rows.length > 0) {
      throw new ValidationError('SKU 已被其他商品使用');
    }
  }
  
  // 更新商品基本信息
  const updateFields = [];
  const updateValues = [];
  let paramIndex = 1;
  
  if (name !== undefined) {
    updateFields.push(`name = $${paramIndex}`);
    updateValues.push(name);
    paramIndex++;
  }
  
  if (description !== undefined) {
    updateFields.push(`description = $${paramIndex}`);
    updateValues.push(description);
    paramIndex++;
  }
  
  if (price !== undefined) {
    if (price < 0) {
      throw new ValidationError('商品價格不能為負數');
    }
    updateFields.push(`price = $${paramIndex}`);
    updateValues.push(price);
    paramIndex++;
  }
  
  if (sku !== undefined) {
    updateFields.push(`sku = $${paramIndex}`);
    updateValues.push(sku);
    paramIndex++;
  }
  
  if (category_id !== undefined) {
    updateFields.push(`category_id = $${paramIndex}`);
    updateValues.push(category_id);
    paramIndex++;
  }
  
  if (stock_quantity !== undefined) {
    if (stock_quantity < 0) {
      throw new ValidationError('庫存數量不能為負數');
    }
    updateFields.push(`stock_quantity = $${paramIndex}`);
    updateValues.push(stock_quantity);
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
  updateValues.push(productId);
  
  await postgresPool.query(`
    UPDATE products
    SET ${updateFields.join(', ')}
    WHERE product_id = $${paramIndex}
  `, updateValues);
  
  // 更新 MongoDB 中的詳細信息
  if (attributes !== undefined || description !== undefined) {
    try {
      const updateData = {};
      if (attributes !== undefined) {
        updateData.attributes = attributes;
      }
      if (description !== undefined) {
        updateData.description_html = description;
      }
      updateData.updated_at = new Date();
      
      await mongoClient.db('ecommerce').collection('product_details').updateOne(
        { product_id: productId },
        { $set: updateData }
      );
    } catch (error) {
      console.error('更新商品詳細信息失敗:', error);
    }
  }
  
  // 記錄更新事件
  try {
    await mongoClient.db('ecommerce').collection('user_events').insertOne({
      user_id: req.user.user_id,
      event_type: 'product_updated',
      event_data: {
        product_id: productId,
        changes: { name, description, price, sku, category_id, stock_quantity, status },
        ip: req.ip,
        user_agent: req.get('User-Agent'),
        timestamp: new Date()
      },
      created_at: new Date()
    });
  } catch (error) {
    console.error('記錄商品更新事件失敗:', error);
  }
  
  res.json({
    success: true,
    message: '商品更新成功'
  });
}));

/**
 * @swagger
 * /api/v1/products/{publicId}:
 *   delete:
 *     summary: 刪除商品（軟刪除）
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: publicId
 *         required: true
 *         schema:
 *           type: string
 *         description: 商品公開 ID
 *     responses:
 *       200:
 *         description: 刪除成功
 *       404:
 *         description: 商品不存在
 */
router.delete('/:publicId', authenticateToken, checkPermission('delete_product'), asyncHandler(async (req, res) => {
  const { publicId } = req.params;
  
  // 獲取商品信息
  const productResult = await postgresPool.query(`
    SELECT product_id, name FROM products WHERE public_id = $1
  `, [publicId]);
  
  if (productResult.rows.length === 0) {
    throw new NotFoundError('商品不存在');
  }
  
  const { product_id, name } = productResult.rows[0];
  
  // 軟刪除商品
  await postgresPool.query(`
    UPDATE products
    SET status = 0, updated_at = NOW()
    WHERE product_id = $1
  `, [product_id]);
  
  // 記錄刪除事件
  try {
    await mongoClient.db('ecommerce').collection('user_events').insertOne({
      user_id: req.user.user_id,
      event_type: 'product_deleted',
      event_data: {
        product_id,
        product_name: name,
        ip: req.ip,
        user_agent: req.get('User-Agent'),
        timestamp: new Date()
      },
      created_at: new Date()
    });
  } catch (error) {
    console.error('記錄商品刪除事件失敗:', error);
  }
  
  res.json({
    success: true,
    message: '商品刪除成功'
  });
}));

/**
 * @swagger
 * /api/v1/categories:
 *   get:
 *     summary: 獲取分類列表
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 獲取成功
 */
router.get('/categories', authenticateToken, checkPermission('view_products'), asyncHandler(async (req, res) => {
  const result = await postgresPool.query(`
    SELECT category_id, public_id, name, parent_id, created_at
    FROM categories
    ORDER BY name ASC
  `);
  
  res.json({
    success: true,
    data: result.rows
  });
}));

/**
 * @swagger
 * /api/v1/categories:
 *   post:
 *     summary: 創建新分類
 *     tags: [Products]
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
 *               parent_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: 創建成功
 */
router.post('/categories', authenticateToken, checkPermission('create_product'), asyncHandler(async (req, res) => {
  const { name, parent_id } = req.body;
  
  if (!name) {
    throw new ValidationError('請提供分類名稱');
  }
  
  // 生成公開 ID
  const publicId = uuidv4();
  
  // 創建分類
  const result = await postgresPool.query(`
    INSERT INTO categories (name, parent_id, public_id)
    VALUES ($1, $2, $3)
    RETURNING category_id, public_id, name, parent_id, created_at
  `, [name, parent_id, publicId]);
  
  res.status(201).json({
    success: true,
    data: result.rows[0],
    message: '分類創建成功'
  });
}));

module.exports = router;
