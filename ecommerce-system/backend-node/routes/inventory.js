const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { 
  postgresPool, 
  authenticateToken
} = require('../config/database');
const { checkPermission } = require('../middleware/rbac');
const { asyncHandler, ValidationError, NotFoundError } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * @swagger
 * /api/v1/inventory:
 *   get:
 *     summary: 獲取庫存列表
 *     tags: [Inventory]
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
 *         name: low_stock
 *         schema:
 *           type: boolean
 *         description: 是否只顯示低庫存商品
 *     responses:
 *       200:
 *         description: 成功獲取庫存列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           product_id:
 *                             type: integer
 *                           public_id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           sku:
 *                             type: string
 *                           stock_quantity:
 *                             type: integer
 *                           min_stock_level:
 *                             type: integer
 *                           category_name:
 *                             type: string
 *                           brand:
 *                             type: string
 *                           status:
 *                             type: integer
 *                           last_updated:
 *                             type: string
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       401:
 *         description: 認證失敗
 *       500:
 *         description: 服務器錯誤
 */
router.get('/', authenticateToken, checkPermission('view_products'), asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search = '', category_id, low_stock } = req.query;
  const offset = (page - 1) * limit;
  
  let whereClause = '';
  let queryParams = [];
  let paramIndex = 1;
  
  if (search) {
    whereClause += ` AND (p.name ILIKE $${paramIndex} OR p.sku ILIKE $${paramIndex})`;
    queryParams.push(`%${search}%`);
    paramIndex++;
  }
  
  if (category_id) {
    const categoryValue = parseInt(category_id);
    if (!isNaN(categoryValue)) {
      whereClause += ` AND p.category_id = $${paramIndex}`;
      queryParams.push(categoryValue);
      paramIndex++;
    }
  }
  
  if (low_stock === 'true') {
    whereClause += ` AND p.stock_quantity <= 5`;
  }
  
  // 查詢庫存列表
  const result = await postgresPool.query(`
    SELECT 
      p.product_id,
      p.public_id,
      p.name,
      p.sku,
      p.stock_quantity,
      10 as min_stock_level,
      c.name as category_name,
      p.brand_id as brand,
      p.status,
      p.updated_at as last_updated
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.category_id
    WHERE p.status = 1 ${whereClause}
    ORDER BY p.stock_quantity DESC, p.name ASC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `, [...queryParams, limit, offset]);
  
  // 查詢總數
  const countResult = await postgresPool.query(`
    SELECT COUNT(*) as total
    FROM products p
    WHERE p.status = 1 ${whereClause}
  `, queryParams);
  
  const total = parseInt(countResult.rows[0].total);
  
  res.json({
    success: true,
    data: {
      items: result.rows,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit)
    }
  });
}));

/**
 * @swagger
 * /api/v1/inventory/alerts:
 *   get:
 *     summary: 獲取低庫存警告
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: threshold
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 庫存警告閾值
 *     responses:
 *       200:
 *         description: 成功獲取低庫存警告
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
 *                       product_id:
 *                         type: integer
 *                       public_id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       sku:
 *                         type: string
 *                       stock_quantity:
 *                         type: integer
 *                       category_name:
 *                         type: string
 *                       brand:
 *                         type: string
 *                       alert_level:
 *                         type: string
 *                       created_at:
 *                         type: string
 *       401:
 *         description: 認證失敗
 *       500:
 *         description: 服務器錯誤
 */
router.get('/alerts', authenticateToken, checkPermission('view_products'), asyncHandler(async (req, res) => {
  const { threshold = 5 } = req.query;
  const thresholdValue = parseInt(threshold);
  
  if (isNaN(thresholdValue)) {
    throw new ValidationError('庫存閾值必須是數字');
  }
  
  // 查詢低庫存商品
  const result = await postgresPool.query(`
    SELECT 
      p.product_id,
      p.public_id,
      p.name,
      p.sku,
      p.stock_quantity,
      c.name as category_name,
      p.brand_id as brand,
      CASE 
        WHEN p.stock_quantity = 0 THEN 'critical'
        WHEN p.stock_quantity <= 3 THEN 'high'
        WHEN p.stock_quantity <= 5 THEN 'medium'
        ELSE 'low'
      END as alert_level,
      NOW() as created_at
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.category_id
    WHERE p.status = 1 AND p.stock_quantity <= $1
    ORDER BY p.stock_quantity ASC, p.name ASC
  `, [thresholdValue]);
  
  res.json({
    success: true,
    data: result.rows
  });
}));

/**
 * @swagger
 * /api/v1/inventory/{productId}/adjust:
 *   post:
 *     summary: 調整商品庫存
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: 商品 ID (public_id)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - adjustment
 *               - reason
 *             properties:
 *               adjustment:
 *                 type: integer
 *                 description: 庫存調整數量 (正數為增加，負數為減少)
 *               reason:
 *                 type: string
 *                 description: 調整原因
 *               notes:
 *                 type: string
 *                 description: 備註
 *     responses:
 *       200:
 *         description: 庫存調整成功
 *       404:
 *         description: 商品不存在
 *       400:
 *         description: 請求參數錯誤
 *       401:
 *         description: 認證失敗
 *       500:
 *         description: 服務器錯誤
 */
router.post('/:productId/adjust', authenticateToken, checkPermission('update_products'), asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { adjustment, reason, notes } = req.body;
  
  if (!adjustment || typeof adjustment !== 'number') {
    throw new ValidationError('庫存調整數量必須是數字');
  }
  
  if (!reason) {
    throw new ValidationError('調整原因不能為空');
  }
  
  // 檢查商品是否存在
  const productResult = await postgresPool.query(
    'SELECT * FROM products WHERE public_id = $1',
    [productId]
  );
  
  if (productResult.rows.length === 0) {
    throw new NotFoundError('商品不存在');
  }
  
  const product = productResult.rows[0];
  const newStock = product.stock_quantity + adjustment;
  
  if (newStock < 0) {
    throw new ValidationError('庫存不能為負數');
  }
  
  // 更新庫存
  await postgresPool.query(
    'UPDATE products SET stock_quantity = $1, updated_at = NOW() WHERE public_id = $2',
    [newStock, productId]
  );
  
  // 記錄庫存變動 (這裡可以擴展為更詳細的庫存變動記錄表)
  console.log(`庫存調整: 商品 ${product.name} (${productId}), 調整: ${adjustment}, 新庫存: ${newStock}, 原因: ${reason}`);
  
  res.json({
    success: true,
    data: {
      product_id: productId,
      product_name: product.name,
      old_stock: product.stock_quantity,
      adjustment,
      new_stock: newStock,
      reason,
      notes,
      updated_at: new Date().toISOString()
    }
  });
}));

/**
 * @swagger
 * /api/v1/inventory/statistics:
 *   get:
 *     summary: 獲取庫存統計信息
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功獲取庫存統計
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     total_products:
 *                       type: integer
 *                     total_stock_value:
 *                       type: number
 *                     low_stock_count:
 *                       type: integer
 *                     out_of_stock_count:
 *                       type: integer
 *                     category_stats:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           category_name:
 *                             type: string
 *                           product_count:
 *                             type: integer
 *                           total_stock:
 *                             type: integer
 *                           low_stock_count:
 *                             type: integer
 *       401:
 *         description: 認證失敗
 *       500:
 *         description: 服務器錯誤
 */
router.get('/statistics', authenticateToken, checkPermission('view_products'), asyncHandler(async (req, res) => {
  // 獲取基本統計
  const [totalResult, stockValueResult, lowStockResult, outOfStockResult] = await Promise.all([
    // 總商品數
    postgresPool.query('SELECT COUNT(*) as count FROM products WHERE status = 1'),
    
    // 總庫存價值
    postgresPool.query('SELECT COALESCE(SUM(stock_quantity * price), 0) as total_value FROM products WHERE status = 1'),
    
    // 低庫存商品數
    postgresPool.query('SELECT COUNT(*) as count FROM products WHERE status = 1 AND stock_quantity <= 10 AND stock_quantity > 0'),
    
    // 缺貨商品數
    postgresPool.query('SELECT COUNT(*) as count FROM products WHERE status = 1 AND stock_quantity = 0')
  ]);
  
  // 獲取分類統計
  const categoryStatsResult = await postgresPool.query(`
    SELECT 
      c.name as category_name,
      COUNT(p.product_id) as product_count,
      COALESCE(SUM(p.stock_quantity), 0) as total_stock,
      COUNT(CASE WHEN p.stock_quantity <= 10 AND p.stock_quantity > 0 THEN 1 END) as low_stock_count
    FROM categories c
    LEFT JOIN products p ON c.category_id = p.category_id AND p.status = 1
    GROUP BY c.category_id, c.name
    ORDER BY c.name
  `);
  
  res.json({
    success: true,
    data: {
      total_products: parseInt(totalResult.rows[0].count),
      total_stock_value: parseFloat(stockValueResult.rows[0].total_value),
      low_stock_count: parseInt(lowStockResult.rows[0].count),
      out_of_stock_count: parseInt(outOfStockResult.rows[0].count),
      category_stats: categoryStatsResult.rows.map(row => ({
        category_name: row.category_name || '未分類',
        product_count: parseInt(row.product_count),
        total_stock: parseInt(row.total_stock),
        low_stock_count: parseInt(row.low_stock_count)
      }))
    }
  });
}));

module.exports = router;
