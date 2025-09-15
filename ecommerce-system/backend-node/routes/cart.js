const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { 
  postgresPool, 
  authenticateToken,
  redisClient,
  getIdMapping 
} = require('../config/database');
const { checkPermission } = require('../middleware/rbac');
const { asyncHandler, ValidationError, NotFoundError } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * @swagger
 * /api/v1/cart:
 *   get:
 *     summary: 獲取購物車
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 獲取成功
 */
router.get('/', authenticateToken, checkPermission('manage_cart'), asyncHandler(async (req, res) => {
  const userId = req.user.user_id;
  
  // 先從 Redis 快取獲取
  try {
    const cachedCart = await redisClient.get(`cart:${userId}`);
    if (cachedCart) {
      return res.json({
        success: true,
        data: JSON.parse(cachedCart),
        source: 'cache'
      });
    }
  } catch (error) {
    console.error('獲取購物車快取失敗:', error);
  }
  
  // 從 PostgreSQL 獲取
  const result = await postgresPool.query(`
    SELECT 
      ci.cart_item_id,
      ci.public_id,
      ci.product_id,
      ci.quantity,
      ci.created_at,
      ci.updated_at,
      p.name as product_name,
      p.price,
      p.public_id as product_public_id,
      p.stock_quantity,
      p.status as product_status,
      pi.image_url as product_image
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.product_id
    LEFT JOIN product_images pi ON p.product_id = pi.product_id AND pi.is_main = true
    WHERE ci.cart_id = (SELECT cart_id FROM cart WHERE user_id = $1)
    ORDER BY ci.created_at DESC
  `, [userId]);
  
  // 快取到 Redis (1小時)
  try {
    await redisClient.setEx(`cart:${userId}`, 3600, JSON.stringify(result.rows));
  } catch (error) {
    console.error('快取購物車失敗:', error);
  }
  
  res.json({
    success: true,
    data: result.rows,
    source: 'database'
  });
}));

/**
 * @swagger
 * /api/v1/cart/items:
 *   post:
 *     summary: 添加商品到購物車
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - product_id
 *               - quantity
 *             properties:
 *               product_id:
 *                 type: string
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *     responses:
 *       201:
 *         description: 添加成功
 *       400:
 *         description: 請求數據無效
 */
router.post('/items', authenticateToken, checkPermission('manage_cart'), asyncHandler(async (req, res) => {
  const { product_id, quantity } = req.body;
  const userId = req.user.user_id;
  
  if (!product_id || !quantity || quantity <= 0) {
    throw new ValidationError('請提供有效的商品 ID 和數量');
  }
  
  // 獲取商品信息
  const productMapping = await getIdMapping('products', product_id);
  if (!productMapping) {
    throw new NotFoundError('商品不存在');
  }
  
  const productResult = await postgresPool.query(`
    SELECT product_id, name, price, stock_quantity, status
    FROM products
    WHERE product_id = $1
  `, [productMapping.internal_id]);
  
  if (productResult.rows.length === 0) {
    throw new NotFoundError('商品不存在');
  }
  
  const product = productResult.rows[0];
  
  if (product.status !== 1) {
    throw new ValidationError('商品已下架');
  }
  
  if (product.stock_quantity < quantity) {
    throw new ValidationError('商品庫存不足');
  }
  
  // 獲取或創建購物車
  let cartResult = await postgresPool.query(`
    SELECT cart_id FROM cart WHERE user_id = $1
  `, [userId]);
  
  let cartId;
  if (cartResult.rows.length === 0) {
    // 創建新購物車
    const newCartResult = await postgresPool.query(`
      INSERT INTO cart (user_id, created_at)
      VALUES ($1, NOW())
      RETURNING cart_id
    `, [userId]);
    cartId = newCartResult.rows[0].cart_id;
  } else {
    cartId = cartResult.rows[0].cart_id;
  }
  
  // 檢查商品是否已在購物車中
  const existingItemResult = await postgresPool.query(`
    SELECT cart_item_id, quantity FROM cart_items 
    WHERE cart_id = $1 AND product_id = $2
  `, [cartId, productMapping.internal_id]);
  
  if (existingItemResult.rows.length > 0) {
    // 更新現有項目數量
    const newQuantity = existingItemResult.rows[0].quantity + quantity;
    
    if (product.stock_quantity < newQuantity) {
      throw new ValidationError('購物車中商品數量超過庫存');
    }
    
    await postgresPool.query(`
      UPDATE cart_items
      SET quantity = $1, updated_at = NOW()
      WHERE cart_item_id = $2
    `, [newQuantity, existingItemResult.rows[0].cart_item_id]);
  } else {
    // 添加新項目
    const itemPublicId = uuidv4();
    await postgresPool.query(`
      INSERT INTO cart_items (cart_id, product_id, quantity, public_id)
      VALUES ($1, $2, $3, $4)
    `, [cartId, productMapping.internal_id, quantity, itemPublicId]);
  }
  
  // 清除購物車快取
  try {
    await redisClient.del(`cart:${userId}`);
  } catch (error) {
    console.error('清除購物車快取失敗:', error);
  }
  
  res.status(201).json({
    success: true,
    message: '商品已添加到購物車'
  });
}));

/**
 * @swagger
 * /api/v1/cart/items/{itemId}:
 *   put:
 *     summary: 更新購物車項目數量
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *         description: 購物車項目公開 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: integer
 *                 minimum: 0
 *     responses:
 *       200:
 *         description: 更新成功
 *       404:
 *         description: 項目不存在
 */
router.put('/items/:itemId', authenticateToken, checkPermission('manage_cart'), asyncHandler(async (req, res) => {
  const { itemId } = req.params;
  const { quantity } = req.body;
  const userId = req.user.user_id;
  
  if (quantity < 0) {
    throw new ValidationError('數量不能為負數');
  }
  
  // 獲取購物車項目信息
  const itemResult = await postgresPool.query(`
    SELECT ci.cart_item_id, ci.product_id, ci.quantity
    FROM cart_items ci
    JOIN cart c ON ci.cart_id = c.cart_id
    WHERE ci.public_id = $1 AND c.user_id = $2
  `, [itemId, userId]);
  
  if (itemResult.rows.length === 0) {
    throw new NotFoundError('購物車項目不存在');
  }
  
  const item = itemResult.rows[0];
  
  if (quantity === 0) {
    // 刪除項目
    await postgresPool.query(`
      DELETE FROM cart_items WHERE cart_item_id = $1
    `, [item.cart_item_id]);
  } else {
    // 檢查庫存
    const productResult = await postgresPool.query(`
      SELECT stock_quantity FROM products WHERE product_id = $1
    `, [item.product_id]);
    
    if (productResult.rows.length === 0) {
      throw new NotFoundError('商品不存在');
    }
    
    const stockQuantity = productResult.rows[0].stock_quantity;
    if (stockQuantity < quantity) {
      throw new ValidationError('商品庫存不足');
    }
    
    // 更新數量
    await postgresPool.query(`
      UPDATE cart_items
      SET quantity = $1, updated_at = NOW()
      WHERE cart_item_id = $2
    `, [quantity, item.cart_item_id]);
  }
  
  // 清除購物車快取
  try {
    await redisClient.del(`cart:${userId}`);
  } catch (error) {
    console.error('清除購物車快取失敗:', error);
  }
  
  res.json({
    success: true,
    message: quantity === 0 ? '商品已從購物車移除' : '購物車項目更新成功'
  });
}));

/**
 * @swagger
 * /api/v1/cart/items/{itemId}:
 *   delete:
 *     summary: 移除購物車項目
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *         description: 購物車項目公開 ID
 *     responses:
 *       200:
 *         description: 移除成功
 *       404:
 *         description: 項目不存在
 */
router.delete('/items/:itemId', authenticateToken, checkPermission('manage_cart'), asyncHandler(async (req, res) => {
  const { itemId } = req.params;
  const userId = req.user.user_id;
  
  // 獲取購物車項目信息
  const itemResult = await postgresPool.query(`
    SELECT ci.cart_item_id
    FROM cart_items ci
    JOIN cart c ON ci.cart_id = c.cart_id
    WHERE ci.public_id = $1 AND c.user_id = $2
  `, [itemId, userId]);
  
  if (itemResult.rows.length === 0) {
    throw new NotFoundError('購物車項目不存在');
  }
  
  // 刪除項目
  await postgresPool.query(`
    DELETE FROM cart_items WHERE cart_item_id = $1
  `, [itemResult.rows[0].cart_item_id]);
  
  // 清除購物車快取
  try {
    await redisClient.del(`cart:${userId}`);
  } catch (error) {
    console.error('清除購物車快取失敗:', error);
  }
  
  res.json({
    success: true,
    message: '商品已從購物車移除'
  });
}));

/**
 * @swagger
 * /api/v1/cart:
 *   delete:
 *     summary: 清空購物車
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 清空成功
 */
router.delete('/', authenticateToken, checkPermission('manage_cart'), asyncHandler(async (req, res) => {
  const userId = req.user.user_id;
  
  // 獲取購物車 ID
  const cartResult = await postgresPool.query(`
    SELECT cart_id FROM cart WHERE user_id = $1
  `, [userId]);
  
  if (cartResult.rows.length === 0) {
    return res.json({
      success: true,
      message: '購物車已經是空的'
    });
  }
  
  const cartId = cartResult.rows[0].cart_id;
  
  // 清空購物車項目
  await postgresPool.query(`
    DELETE FROM cart_items WHERE cart_id = $1
  `, [cartId]);
  
  // 清除購物車快取
  try {
    await redisClient.del(`cart:${userId}`);
  } catch (error) {
    console.error('清除購物車快取失敗:', error);
  }
  
  res.json({
    success: true,
    message: '購物車已清空'
  });
}));

/**
 * @swagger
 * /api/v1/cart/sync:
 *   post:
 *     summary: 同步購物車（從前端批量更新）
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     product_id:
 *                       type: string
 *                     quantity:
 *                       type: integer
 *     responses:
 *       200:
 *         description: 同步成功
 */
router.post('/sync', authenticateToken, checkPermission('manage_cart'), asyncHandler(async (req, res) => {
  const { items } = req.body;
  const userId = req.user.user_id;
  
  if (!Array.isArray(items)) {
    throw new ValidationError('請提供有效的商品列表');
  }
  
  // 獲取或創建購物車
  let cartResult = await postgresPool.query(`
    SELECT cart_id FROM cart WHERE user_id = $1
  `, [userId]);
  
  let cartId;
  if (cartResult.rows.length === 0) {
    const newCartResult = await postgresPool.query(`
      INSERT INTO cart (user_id, created_at)
      VALUES ($1, NOW())
      RETURNING cart_id
    `, [userId]);
    cartId = newCartResult.rows[0].cart_id;
  } else {
    cartId = cartResult.rows[0].cart_id;
  }
  
  // 開始事務
  const client = await postgresPool.connect();
  try {
    await client.query('BEGIN');
    
    // 清空現有購物車項目
    await client.query(`
      DELETE FROM cart_items WHERE cart_id = $1
    `, [cartId]);
    
    // 添加新項目
    for (const item of items) {
      const { product_id, quantity } = item;
      
      if (!product_id || !quantity || quantity <= 0) {
        continue; // 跳過無效項目
      }
      
      const productMapping = await getIdMapping('products', product_id);
      if (!productMapping) {
        continue; // 跳過不存在的商品
      }
      
      // 檢查庫存
      const productResult = await client.query(`
        SELECT stock_quantity, status FROM products WHERE product_id = $1
      `, [productMapping.internal_id]);
      
      if (productResult.rows.length === 0 || productResult.rows[0].status !== 1) {
        continue; // 跳過不存在的商品或已下架商品
      }
      
      const stockQuantity = productResult.rows[0].stock_quantity;
      const finalQuantity = Math.min(quantity, stockQuantity);
      
      if (finalQuantity > 0) {
        const itemPublicId = uuidv4();
        await client.query(`
          INSERT INTO cart_items (cart_id, product_id, quantity, public_id)
          VALUES ($1, $2, $3, $4)
        `, [cartId, productMapping.internal_id, finalQuantity, itemPublicId]);
      }
    }
    
    await client.query('COMMIT');
    
    // 清除購物車快取
    try {
      await redisClient.del(`cart:${userId}`);
    } catch (error) {
      console.error('清除購物車快取失敗:', error);
    }
    
    res.json({
      success: true,
      message: '購物車同步成功'
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}));

/**
 * @swagger
 * /api/v1/cart/count:
 *   get:
 *     summary: 獲取購物車項目數量
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 獲取成功
 */
router.get('/count', authenticateToken, checkPermission('manage_cart'), asyncHandler(async (req, res) => {
  const userId = req.user.user_id;
  
  const result = await postgresPool.query(`
    SELECT COUNT(*) as item_count, SUM(ci.quantity) as total_quantity
    FROM cart_items ci
    JOIN cart c ON ci.cart_id = c.cart_id
    WHERE c.user_id = $1
  `, [userId]);
  
  const count = result.rows[0];
  
  res.json({
    success: true,
    data: {
      item_count: parseInt(count.item_count) || 0,
      total_quantity: parseInt(count.total_quantity) || 0
    }
  });
}));

module.exports = router;
