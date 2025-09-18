const express = require('express');

const { postgresPool, mongoClient } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');
const { asyncHandler, NotFoundError } = require('../middleware/errorHandler');

const router = express.Router();

const STATUS_ACTIVE = ['active'];
const STATUS_INACTIVE = ['inactive', 'sold_out'];

const mapStatusFromDb = (status) => {
  if (!status) {
    return 'inactive';
  }

  const value = status.toString().toLowerCase();
  if (STATUS_ACTIVE.includes(value)) {
    return 'active';
  }

  return 'inactive';
};

const normalizeProductRow = (row) => ({
  id: row.id,
  name: row.name,
  sku: row.sku,
  category: row.category_name || undefined,
  price: Number(row.price) || 0,
  stock: Number(row.stock) || 0,
  status: mapStatusFromDb(row.status),
  createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
  updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
});

router.get(
  '/',
  authenticateToken,
  checkPermission('products:read'),
  asyncHandler(async (req, res) => {
    const {
      page = 1,
      limit = 10,
      search,
      category,
      status,
    } = req.query;

    const numericPage = Number(page) || 1;
    const numericLimit = Number(limit) || 10;
    const offset = (numericPage - 1) * numericLimit;

    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (search) {
      conditions.push(`(p.name ILIKE $${paramIndex} OR p.sku ILIKE $${paramIndex})`);
      params.push(`%${search.trim()}%`);
      paramIndex += 1;
    }

    if (category) {
      conditions.push(`(c.name ILIKE $${paramIndex})`);
      params.push(`%${category.trim()}%`);
      paramIndex += 1;
    }

    if (status) {
      if (status === 'active') {
        conditions.push(`p.status = ANY($${paramIndex})`);
        params.push(STATUS_ACTIVE);
      } else if (status === 'inactive') {
        conditions.push(`p.status = ANY($${paramIndex})`);
        params.push(STATUS_INACTIVE);
      }
      paramIndex += 1;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const listQuery = `
      WITH inventory_totals AS (
        SELECT product_id, SUM(quantity) AS stock
        FROM inventory
        GROUP BY product_id
      )
      SELECT 
        p.id,
        p.name,
        p.sku,
        p.price,
        p.status,
        p.created_at,
        p.updated_at,
        c.name AS category_name,
        COALESCE(it.stock, 0) AS stock
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN inventory_totals it ON it.product_id = p.id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;

    const listParams = [...params, numericLimit, offset];

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereClause}`;

    const [listResult, countResult] = await Promise.all([
      postgresPool.query(listQuery, listParams),
      postgresPool.query(countQuery, params),
    ]);

    const total = Number(countResult.rows[0]?.total || 0);

    res.json({
      success: true,
      data: {
        items: listResult.rows.map(normalizeProductRow),
        total,
        page: numericPage,
        limit: numericLimit,
        totalPages: Math.max(1, Math.ceil(total / numericLimit)),
      },
    });
  })
);

router.get(
  '/stats',
  authenticateToken,
  checkPermission('products:read'),
  asyncHandler(async (_req, res) => {
    const [productStatsResult, inventoryStatsResult] = await Promise.all([
      postgresPool.query(
        `SELECT 
           COUNT(*) AS total,
           COUNT(*) FILTER (WHERE status = ANY($1)) AS active,
           COUNT(*) FILTER (WHERE status = ANY($2)) AS inactive
         FROM products`,
        [STATUS_ACTIVE, STATUS_INACTIVE]
      ),
      postgresPool.query(
        `SELECT COUNT(*) AS low_stock
         FROM inventory
         WHERE quantity > 0 AND quantity < 10`
      ),
    ]);

    const totals = productStatsResult.rows[0] || {};
    const lowStock = Number(inventoryStatsResult.rows[0]?.low_stock || 0);

    res.json({
      success: true,
      data: {
        total: Number(totals.total || 0),
        active: Number(totals.active || 0),
        inactive: Number(totals.inactive || 0),
        lowStock,
      },
    });
  })
);

router.get(
  '/:productId',
  authenticateToken,
  checkPermission('products:read'),
  asyncHandler(async (req, res) => {
    const { productId } = req.params;

    const productResult = await postgresPool.query(
      `WITH inventory_totals AS (
         SELECT product_id, SUM(quantity) AS stock
         FROM inventory
         GROUP BY product_id
       )
       SELECT 
         p.id,
         p.name,
         p.description,
         p.sku,
         p.price,
         p.status,
         p.created_at,
         p.updated_at,
         c.name AS category_name,
         COALESCE(it.stock, 0) AS stock
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN inventory_totals it ON it.product_id = p.id
       WHERE p.id::text = $1 OR p.sku = $1
       LIMIT 1`,
      [productId]
    );

    if (productResult.rowCount === 0) {
      throw new NotFoundError('找不到指定的商品');
    }

    const product = productResult.rows[0];
    let details = null;

    try {
      details = await mongoClient
        .db('ecommerce')
        .collection('product_details')
        .findOne({ product_id: product.id });
    } catch (error) {
      console.warn('讀取商品詳細資訊失敗:', error.message);
    }

    res.json({
      success: true,
      data: {
        ...normalizeProductRow(product),
        description: product.description,
        details: details || undefined,
      },
    });
  })
);

router.post(
  '/',
  authenticateToken,
  checkPermission('products:create'),
  asyncHandler(async (_req, res) => {
    res.status(501).json({ success: false, error: '商品建立尚未在後端解鎖' });
  })
);

router.put(
  '/:productId',
  authenticateToken,
  checkPermission('products:update'),
  asyncHandler(async (_req, res) => {
    res.status(501).json({ success: false, error: '商品更新尚未在後端解鎖' });
  })
);

router.delete(
  '/:productId',
  authenticateToken,
  checkPermission('products:delete'),
  asyncHandler(async (_req, res) => {
    res.status(501).json({ success: false, error: '商品刪除尚未在後端解鎖' });
  })
);

module.exports = router;
