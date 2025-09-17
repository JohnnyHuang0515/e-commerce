const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { 
  postgresPool, 
  mongoClient,
} = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { getIdMapping } = require('../utils/idMapper');
const { checkPermission } = require('../middleware/rbac');
const { asyncHandler, ValidationError, NotFoundError } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * @swagger
 * /api/v1/orders:
 *   get:
 *     summary: 獲取訂單列表
 *     tags: [Orders]
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
 *         name: status
 *         schema:
 *           type: string
 *         description: 訂單狀態
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: string
 *         description: 用戶公開 ID
 *     responses:
 *       200:
 *         description: 獲取成功
 */
router.get('/', authenticateToken, checkPermission('view_orders'), asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, user_id } = req.query;
  const offset = (page - 1) * limit;
  
  let whereClause = '';
  let queryParams = [];
  let paramIndex = 1;
  
  if (status) {
    whereClause += ` AND o.status = $${paramIndex}`;
    queryParams.push(status);
    paramIndex++;
  }
  
  if (user_id) {
    // 將用戶公開 ID 轉換為內部 ID
    const userMapping = await getIdMapping('users', user_id);
    if (userMapping) {
      whereClause += ` AND o.user_id = $${paramIndex}`;
      queryParams.push(userMapping.internal_id);
      paramIndex++;
    }
  }
  
  // 查詢訂單列表
  const result = await postgresPool.query(`
    SELECT 
      o.order_id as id,
      o.public_id,
      o.public_id as "orderNumber",
      o.user_id as "userId",
      LOWER(o.status) as status,
      o.total_amount as total,
      o.shipping_address,
      o.payment_status as "paymentStatus",
      o.created_at as "createdAt",
      o.updated_at as "updatedAt",
      u.name as user_name,
      u.email as user_email,
      '[]'::json as items,
      json_build_object(
        'status', o.payment_status,
        'method', o.payment_method
      ) as payment,
      json_build_object(
        'address', o.shipping_address
      ) as shipping
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.user_id
    WHERE 1=1 ${whereClause}
    ORDER BY o.created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `, [...queryParams, limit, offset]);
  
  // 查詢總數
  const countResult = await postgresPool.query(`
    SELECT COUNT(*) as total
    FROM orders o
    WHERE 1=1 ${whereClause}
  `, queryParams);
  
  const total = parseInt(countResult.rows[0].total);
  
  res.json({
    success: true,
    data: {
      items: result.rows,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    }
  });
}));

/**
 * @swagger
 * /api/v1/orders/stats:
 *   get:
 *     summary: 獲取訂單統計
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 獲取成功
 */
router.get('/stats', authenticateToken, checkPermission('view_orders'), asyncHandler(async (req, res) => {
  // 獲取訂單統計
  const statsResult = await postgresPool.query(`
    SELECT 
      COUNT(*) as total_orders,
      COUNT(CASE WHEN UPPER(status) = 'PENDING' THEN 1 END) as pending_orders,
      COUNT(CASE WHEN UPPER(status) = 'CONFIRMED' THEN 1 END) as confirmed_orders,
      COUNT(CASE WHEN UPPER(status) = 'PROCESSING' THEN 1 END) as processing_orders,
      COUNT(CASE WHEN UPPER(status) = 'SHIPPED' THEN 1 END) as shipped_orders,
      COUNT(CASE WHEN UPPER(status) = 'DELIVERED' THEN 1 END) as delivered_orders,
      COUNT(CASE WHEN UPPER(status) = 'COMPLETED' THEN 1 END) as completed_orders,
      COUNT(CASE WHEN UPPER(status) = 'CANCELLED' THEN 1 END) as cancelled_orders,
      SUM(total_amount) as total_revenue,
      AVG(total_amount) as avg_order_value
    FROM orders
  `);
  
  // 獲取最近 30 天的訂單趨勢
  const trendResult = await postgresPool.query(`
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as order_count,
      SUM(total_amount) as daily_revenue
    FROM orders 
    WHERE created_at >= NOW() - INTERVAL '30 days'
    GROUP BY DATE(created_at)
    ORDER BY date DESC
    LIMIT 30
  `);

  const stats = statsResult.rows[0];
  
  res.json({
    success: true,
    message: '訂單統計獲取成功',
    data: {
      total: parseInt(stats.total_orders) || 0,
      pending: parseInt(stats.pending_orders) || 0,
      shipped: parseInt(stats.shipped_orders) || 0,
      totalRevenue: parseFloat(stats.total_revenue) || 0,
      averageOrderValue: parseFloat(stats.avg_order_value) || 0,
      trends: trendResult.rows
    }
  });
}));

/**
 * @swagger
 * /api/v1/orders/{publicId}:
 *   get:
 *     summary: 獲取訂單詳情
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: publicId
 *         required: true
 *         schema:
 *           type: string
 *         description: 訂單公開 ID
 *     responses:
 *       200:
 *         description: 獲取成功
 *       404:
 *         description: 訂單不存在
 */
router.get('/:publicId', authenticateToken, checkPermission('view_orders'), asyncHandler(async (req, res) => {
  const { publicId } = req.params;
  
  // 獲取訂單基本信息
  const orderResult = await postgresPool.query(`
    SELECT 
      o.order_id,
      o.public_id,
      o.user_id,
      o.status,
      o.total_amount,
      o.shipping_address,
      o.created_at,
      o.updated_at,
      u.name as user_name,
      u.email as user_email
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.user_id
    WHERE o.public_id = $1
  `, [publicId]);
  
  if (orderResult.rows.length === 0) {
    throw new NotFoundError('訂單不存在');
  }
  
  const order = orderResult.rows[0];
  
  // 獲取訂單項目
  const itemsResult = await postgresPool.query(`
    SELECT 
      oi.order_item_id,
      oi.public_id,
      oi.product_id,
      oi.product_name,
      oi.unit_price,
      oi.quantity,
      oi.subtotal,
      p.public_id as product_public_id
    FROM order_items oi
    LEFT JOIN products p ON oi.product_id = p.product_id
    WHERE oi.order_id = $1
  `, [order.order_id]);
  
  // 獲取支付信息
  const paymentResult = await postgresPool.query(`
    SELECT 
      payment_id,
      public_id,
      payment_method,
      amount,
      payment_status,
      paid_at
    FROM payments
    WHERE order_id = $1
  `, [order.order_id]);
  
  // 獲取物流信息
  const shipmentResult = await postgresPool.query(`
    SELECT 
      shipment_id,
      public_id,
      carrier,
      tracking_number,
      shipped_at,
      delivered_at
    FROM shipments
    WHERE order_id = $1
  `, [order.order_id]);
  
  res.json({
    success: true,
    data: {
      ...order,
      items: itemsResult.rows,
      payment: paymentResult.rows[0] || null,
      shipment: shipmentResult.rows[0] || null
    }
  });
}));

/**
 * @swagger
 * /api/v1/orders:
 *   post:
 *     summary: 創建新訂單
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *               - shipping_address
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
 *               shipping_address:
 *                 type: string
 *               payment_method:
 *                 type: string
 *     responses:
 *       201:
 *         description: 創建成功
 *       400:
 *         description: 請求數據無效
 */
router.post('/', authenticateToken, checkPermission('create_order'), asyncHandler(async (req, res) => {
  const { items, shipping_address, payment_method = 'credit_card' } = req.body;
  
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new ValidationError('請提供訂單項目');
  }
  
  if (!shipping_address) {
    throw new ValidationError('請提供收貨地址');
  }
  
  // 驗證商品和計算總金額
  let totalAmount = 0;
  const orderItems = [];
  
  for (const item of items) {
    const { product_id, quantity } = item;
    
    if (!product_id || !quantity || quantity <= 0) {
      throw new ValidationError('商品 ID 和數量必須有效');
    }
    
    // 獲取商品信息
    const productMapping = await getIdMapping('products', product_id);
    if (!productMapping) {
      throw new ValidationError(`商品 ${product_id} 不存在`);
    }
    
    const productResult = await postgresPool.query(`
      SELECT name, price, stock_quantity, status
      FROM products
      WHERE product_id = $1
    `, [productMapping.internal_id]);
    
    if (productResult.rows.length === 0) {
      throw new ValidationError(`商品 ${product_id} 不存在`);
    }
    
    const product = productResult.rows[0];
    
    if (product.status !== 1) {
      throw new ValidationError(`商品 ${product.name} 已下架`);
    }
    
    if (product.stock_quantity < quantity) {
      throw new ValidationError(`商品 ${product.name} 庫存不足`);
    }
    
    const subtotal = product.price * quantity;
    totalAmount += subtotal;
    
    orderItems.push({
      product_id: productMapping.internal_id,
      product_name: product.name,
      unit_price: product.price,
      quantity,
      subtotal
    });
  }
  
  // 生成訂單公開 ID
  const orderPublicId = uuidv4();
  
  // 開始事務
  const client = await postgresPool.connect();
  try {
    await client.query('BEGIN');
    
    // 創建訂單
    const orderResult = await client.query(`
      INSERT INTO orders (user_id, status, total_amount, shipping_address, public_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING order_id, public_id, total_amount, created_at
    `, [req.user.user_id, 'pending', totalAmount, shipping_address, orderPublicId]);
    
    const order = orderResult.rows[0];
    
    // 創建訂單項目
    for (const item of orderItems) {
      const itemPublicId = uuidv4();
      await client.query(`
        INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, subtotal, public_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [order.order_id, item.product_id, item.product_name, item.unit_price, item.quantity, item.subtotal, itemPublicId]);
      
      // 更新庫存
      await client.query(`
        UPDATE products
        SET stock_quantity = stock_quantity - $1, updated_at = NOW()
        WHERE product_id = $2
      `, [item.quantity, item.product_id]);
    }
    
    // 創建支付記錄
    const paymentPublicId = uuidv4();
    await client.query(`
      INSERT INTO payments (order_id, payment_method, amount, payment_status, public_id)
      VALUES ($1, $2, $3, $4, $5)
    `, [order.order_id, payment_method, totalAmount, 'pending', paymentPublicId]);
    
    await client.query('COMMIT');
    
    // 記錄訂單創建事件
    try {
      await mongoClient.db('ecommerce').collection('user_events').insertOne({
        user_id: req.user.user_id,
        event_type: 'order_created',
        event_data: {
          order_id: order.order_id,
          total_amount: totalAmount,
          item_count: orderItems.length,
          ip: req.ip,
          user_agent: req.get('User-Agent'),
          timestamp: new Date()
        },
        created_at: new Date()
      });
    } catch (error) {
      console.error('記錄訂單創建事件失敗:', error);
    }
    
    res.status(201).json({
      success: true,
      data: {
        order_id: order.public_id,
        total_amount: order.total_amount,
        status: 'pending',
        created_at: order.created_at
      },
      message: '訂單創建成功'
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
 * /api/v1/orders/{publicId}/status:
 *   put:
 *     summary: 更新訂單狀態
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: publicId
 *         required: true
 *         schema:
 *           type: string
 *         description: 訂單公開 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, paid, shipped, delivered, canceled]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: 更新成功
 *       404:
 *         description: 訂單不存在
 */
router.put('/:publicId/status', authenticateToken, checkPermission('update_order'), asyncHandler(async (req, res) => {
  const { publicId } = req.params;
  const { status, notes } = req.body;
  
  const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    throw new ValidationError('無效的訂單狀態');
  }
  
  // 獲取訂單信息
  const orderResult = await postgresPool.query(`
    SELECT order_id, status FROM orders WHERE public_id = $1
  `, [publicId]);
  
  if (orderResult.rows.length === 0) {
    throw new NotFoundError('訂單不存在');
  }
  
  const { order_id, status: currentStatus } = orderResult.rows[0];
  
  // 更新訂單狀態
  await postgresPool.query(`
    UPDATE orders
    SET status = $1, updated_at = NOW()
    WHERE order_id = $2
  `, [status, order_id]);
  
  // 如果狀態變更為已支付，更新支付狀態
  if (status === 'paid') {
    await postgresPool.query(`
      UPDATE payments
      SET payment_status = 'success', paid_at = NOW()
      WHERE order_id = $1
    `, [order_id]);
  }
  
  // 記錄狀態變更事件
  try {
    await mongoClient.db('ecommerce').collection('user_events').insertOne({
      user_id: req.user.user_id,
      event_type: 'order_status_changed',
      event_data: {
        order_id,
        from_status: currentStatus,
        to_status: status,
        notes,
        ip: req.ip,
        user_agent: req.get('User-Agent'),
        timestamp: new Date()
      },
      created_at: new Date()
    });
  } catch (error) {
    console.error('記錄訂單狀態變更事件失敗:', error);
  }
  
  res.json({
    success: true,
    message: '訂單狀態更新成功'
  });
}));

/**
 * @swagger
 * /api/v1/orders/{publicId}/cancel:
 *   post:
 *     summary: 取消訂單
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: publicId
 *         required: true
 *         schema:
 *           type: string
 *         description: 訂單公開 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: 取消成功
 *       404:
 *         description: 訂單不存在
 */
router.post('/:publicId/cancel', authenticateToken, checkPermission('cancel_order'), asyncHandler(async (req, res) => {
  const { publicId } = req.params;
  const { reason } = req.body;
  
  // 獲取訂單信息
  const orderResult = await postgresPool.query(`
    SELECT order_id, status FROM orders WHERE public_id = $1
  `, [publicId]);
  
  if (orderResult.rows.length === 0) {
    throw new NotFoundError('訂單不存在');
  }
  
  const { order_id, status } = orderResult.rows[0];
  
  if (status === 'delivered') {
    throw new ValidationError('已完成的訂單無法取消');
  }
  
  if (status === 'canceled') {
    throw new ValidationError('訂單已經取消');
  }
  
  // 開始事務
  const client = await postgresPool.connect();
  try {
    await client.query('BEGIN');
    
    // 更新訂單狀態
    await client.query(`
      UPDATE orders
      SET status = 'canceled', updated_at = NOW()
      WHERE order_id = $1
    `, [order_id]);
    
    // 恢復庫存
    const itemsResult = await client.query(`
      SELECT product_id, quantity FROM order_items WHERE order_id = $1
    `, [order_id]);
    
    for (const item of itemsResult.rows) {
      await client.query(`
        UPDATE products
        SET stock_quantity = stock_quantity + $1, updated_at = NOW()
        WHERE product_id = $2
      `, [item.quantity, item.product_id]);
    }
    
    await client.query('COMMIT');
    
    // 記錄取消事件
    try {
      await mongoClient.db('ecommerce').collection('user_events').insertOne({
        user_id: req.user.user_id,
        event_type: 'order_canceled',
        event_data: {
          order_id,
          reason,
          ip: req.ip,
          user_agent: req.get('User-Agent'),
          timestamp: new Date()
        },
        created_at: new Date()
      });
    } catch (error) {
      console.error('記錄訂單取消事件失敗:', error);
    }
    
    res.json({
      success: true,
      message: '訂單取消成功'
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
 * /api/v1/orders/statistics:
 *   get:
 *     summary: 獲取訂單統計
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 獲取成功
 */
router.get('/statistics', authenticateToken, checkPermission('view_reports'), asyncHandler(async (req, res) => {
  // 獲取訂單統計
  const statsResult = await postgresPool.query(`
    SELECT 
      COUNT(*) as total_orders,
      COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
      COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_orders,
      COUNT(CASE WHEN status = 'shipped' THEN 1 END) as shipped_orders,
      COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_orders,
      COUNT(CASE WHEN status = 'canceled' THEN 1 END) as canceled_orders,
      SUM(CASE WHEN status = 'delivered' THEN total_amount ELSE 0 END) as total_revenue,
      AVG(CASE WHEN status = 'delivered' THEN total_amount ELSE NULL END) as avg_order_value
    FROM orders
  `);
  
  // 獲取最近 30 天的訂單趨勢
  const trendResult = await postgresPool.query(`
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as order_count,
      SUM(total_amount) as daily_revenue
    FROM orders
    WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `);
  
  res.json({
    success: true,
    data: {
      statistics: statsResult.rows[0],
      trends: trendResult.rows
    }
  });
}));

module.exports = router;
