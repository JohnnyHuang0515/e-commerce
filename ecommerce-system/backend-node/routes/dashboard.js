const express = require('express');

const { postgresPool, mongoClient, redisClient } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');

const router = express.Router();

const ACTIVE_PRODUCT_STATUSES = ['active'];
const FINAL_ORDER_STATUSES = ['COMPLETED', 'DELIVERED'];
const IN_TRANSIT_STATUSES = ['IN_TRANSIT', 'OUT_FOR_DELIVERY', 'PICKED_UP'];
const FAILED_LOGISTICS_STATUSES = ['FAILED', 'RETURNED', 'CANCELLED'];

const coerceNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getLowInventoryAlerts = async () => {
  try {
    const result = await postgresPool.query(
      `SELECT 
         p.name,
         inv.quantity,
         inv.reorder_point
       FROM inventory inv
       JOIN products p ON inv.product_id = p.id
       WHERE inv.status = 'active'
       ORDER BY inv.quantity ASC
       LIMIT 5`
    );

    return result.rows.map((row, index) => ({
      _id: `inventory-${index + 1}`,
      title: '庫存警告',
      message: `${row.name} 庫存僅剩 ${row.quantity} 件` +
        (row.quantity <= row.reorder_point ? '（低於補貨門檻）' : ''),
      type: 'warning',
      severity: row.quantity <= row.reorder_point ? 'high' : 'medium',
      source: 'inventory',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
  } catch (error) {
    console.error('取得庫存警示失敗:', error);
    return [];
  }
};

router.get(
  '/overview',
  authenticateToken,
  checkPermission('products:read'),
  async (req, res) => {
    try {
      const startOfMonth = `date_trunc('month', CURRENT_DATE)`;
      const startOfLastMonth = `date_trunc('month', CURRENT_DATE - INTERVAL '1 month')`;

      const [salesRow, ordersRow, usersRow, productsRow] = await Promise.all([
        postgresPool.query(
          `SELECT COALESCE(SUM(total_amount), 0) AS value
           FROM orders
           WHERE status = ANY($1)
             AND created_at >= ${startOfMonth}`,
          [FINAL_ORDER_STATUSES]
        ),
        postgresPool.query(
          `SELECT COUNT(*) AS value
           FROM orders
           WHERE created_at >= ${startOfMonth}`
        ),
        postgresPool.query(
          `SELECT COUNT(*) AS value
           FROM users
           WHERE status = 'active'
             AND created_at >= ${startOfMonth}`
        ),
        postgresPool.query(
          `SELECT COUNT(*) AS value
           FROM products
           WHERE status = ANY($1)`,
          [ACTIVE_PRODUCT_STATUSES]
        ),
      ]);

      const totalSales = coerceNumber(salesRow.rows[0]?.value);
      const totalOrders = coerceNumber(ordersRow.rows[0]?.value);
      const totalUsers = coerceNumber(usersRow.rows[0]?.value);
      const totalProducts = coerceNumber(productsRow.rows[0]?.value);
      const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

      const [lastMonthSalesRow, lastMonthOrdersRow, lastMonthUsersRow] = await Promise.all([
        postgresPool.query(
          `SELECT COALESCE(SUM(total_amount), 0) AS value
           FROM orders
           WHERE status = ANY($1)
             AND created_at >= ${startOfLastMonth}
             AND created_at < ${startOfMonth}`,
          [FINAL_ORDER_STATUSES]
        ),
        postgresPool.query(
          `SELECT COUNT(*) AS value
           FROM orders
           WHERE created_at >= ${startOfLastMonth}
             AND created_at < ${startOfMonth}`
        ),
        postgresPool.query(
          `SELECT COUNT(*) AS value
           FROM users
           WHERE status = 'active'
             AND created_at >= ${startOfLastMonth}
             AND created_at < ${startOfMonth}`
        ),
      ]);

      const lastMonthSales = coerceNumber(lastMonthSalesRow.rows[0]?.value);
      const lastMonthOrders = coerceNumber(lastMonthOrdersRow.rows[0]?.value);
      const lastMonthUsers = coerceNumber(lastMonthUsersRow.rows[0]?.value);

      const calculateGrowth = (current, previous) => {
        if (previous > 0) {
          return ((current - previous) / previous) * 100;
        }
        return current > 0 ? 100 : 0;
      };

      const [dailySalesResult, alerts] = await Promise.all([
        postgresPool.query(
          `SELECT 
             date_trunc('day', created_at) AS day,
             COALESCE(SUM(total_amount), 0) AS revenue,
             COUNT(*) AS order_count,
             COUNT(DISTINCT user_id) AS user_count
           FROM orders
           WHERE created_at >= ${startOfMonth}
           GROUP BY date_trunc('day', created_at)
           ORDER BY day`
        ),
        getLowInventoryAlerts(),
      ]);

      const periodData = dailySalesResult.rows.map((row) => ({
        date: row.day.toISOString().slice(0, 10),
        sales: coerceNumber(row.revenue),
        orders: coerceNumber(row.order_count),
        users: coerceNumber(row.user_count),
      }));

      res.json({
        success: true,
        data: {
          summary: {
            totalSales,
            totalOrders,
            totalUsers,
            totalProducts,
            averageOrderValue: Math.round(averageOrderValue * 100) / 100,
            conversionRate:
              totalUsers > 0
                ? Math.round((totalOrders / totalUsers) * 10000) / 100
                : 0,
          },
          periodData,
          growth: {
            salesGrowth: calculateGrowth(totalSales, lastMonthSales),
            ordersGrowth: calculateGrowth(totalOrders, lastMonthOrders),
            usersGrowth: calculateGrowth(totalUsers, lastMonthUsers),
          },
          alerts,
          systemStatus: {
            services: [
              {
                name: 'PostgreSQL',
                status: 'healthy',
                responseTime: 0,
                lastCheck: new Date().toISOString(),
              },
              {
                name: 'MongoDB',
                status: 'healthy',
                responseTime: 0,
                lastCheck: new Date().toISOString(),
              },
              {
                name: 'Redis',
                status: 'healthy',
                responseTime: 0,
                lastCheck: new Date().toISOString(),
              },
            ],
          },
        },
      });
    } catch (error) {
      console.error('獲取概覽數據失敗:', error);
      res.status(500).json({
        success: false,
        error: '獲取概覽數據失敗',
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      });
    }
  }
);

router.get(
  '/daily-sales',
  authenticateToken,
  checkPermission('products:read'),
  async (req, res) => {
    try {
      const { period = 'month' } = req.query;
      let dateFromClause = 'created_at >= date_trunc(\'month\', CURRENT_DATE)';

      if (period === 'week') {
        dateFromClause = "created_at >= CURRENT_DATE - INTERVAL '7 days'";
      } else if (period === 'year') {
        dateFromClause = "created_at >= date_trunc('year', CURRENT_DATE)";
      }

      const result = await postgresPool.query(
        `SELECT 
           date_trunc('day', created_at) AS day,
           COALESCE(SUM(total_amount), 0) AS revenue
         FROM orders
         WHERE ${dateFromClause}
         GROUP BY date_trunc('day', created_at)
         ORDER BY day`
      );

      const data = result.rows.map((row) => ({
        date: row.day.toISOString().slice(0, 10),
        sales: coerceNumber(row.revenue),
      }));

      res.json({ success: true, data });
    } catch (error) {
      console.error('獲取每日銷售數據失敗:', error);
      res.status(500).json({
        success: false,
        error: '獲取每日銷售數據失敗',
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      });
    }
  }
);

router.get(
  '/order-status',
  authenticateToken,
  checkPermission('orders:read'),
  async (req, res) => {
    try {
      const result = await postgresPool.query(
        `SELECT status, COUNT(*) AS count
         FROM orders
         GROUP BY status`
      );

      const data = result.rows.map((row) => ({
        status: row.status,
        count: coerceNumber(row.count),
      }));

      res.json({ success: true, data });
    } catch (error) {
      console.error('獲取訂單狀態數據失敗:', error);
      res.status(500).json({
        success: false,
        error: '獲取訂單狀態數據失敗',
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      });
    }
  }
);

router.get(
  '/popular-products',
  authenticateToken,
  checkPermission('products:read'),
  async (req, res) => {
    try {
      const limit = coerceNumber(req.query.limit) || 10;

      const result = await postgresPool.query(
        `WITH product_sales AS (
           SELECT 
             oi.product_id,
             SUM(oi.quantity) AS total_quantity,
             SUM(oi.total_price) AS total_revenue
           FROM order_items oi
           JOIN orders o ON oi.order_id = o.id
           WHERE o.status = ANY($1)
           GROUP BY oi.product_id
         )
         SELECT 
           p.id,
           p.name,
           p.price,
           COALESCE(inv.quantity, 0) AS stock,
           COALESCE(ps.total_quantity, 0) AS sales_count,
           COALESCE(ps.total_revenue, 0) AS total_sales
         FROM products p
         LEFT JOIN product_sales ps ON ps.product_id = p.id
         LEFT JOIN inventory inv ON inv.product_id = p.id
         WHERE p.status = ANY($2)
         ORDER BY ps.total_revenue DESC NULLS LAST
         LIMIT $3`,
        [FINAL_ORDER_STATUSES, ACTIVE_PRODUCT_STATUSES, limit]
      );

      const data = result.rows.map((row) => ({
        id: row.id,
        name: row.name,
        price: coerceNumber(row.price),
        stock: coerceNumber(row.stock),
        salesCount: coerceNumber(row.sales_count),
        totalSales: coerceNumber(row.total_sales),
      }));

      res.json({ success: true, data });
    } catch (error) {
      console.error('獲取熱門商品數據失敗:', error);
      res.status(500).json({
        success: false,
        error: '獲取熱門商品數據失敗',
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      });
    }
  }
);

router.get('/health', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {},
    };

    try {
      const start = Date.now();
      await postgresPool.query('SELECT NOW()');
      health.services.postgresql = {
        status: 'healthy',
        responseTime: Date.now() - start,
      };
    } catch (error) {
      health.services.postgresql = {
        status: 'unhealthy',
        error: error.message,
      };
      health.status = 'degraded';
    }

    try {
      const start = Date.now();
      await mongoClient.db('admin').admin().ping();
      health.services.mongodb = {
        status: 'healthy',
        responseTime: Date.now() - start,
      };
    } catch (error) {
      health.services.mongodb = {
        status: 'unhealthy',
        error: error.message,
      };
      health.status = 'degraded';
    }

    try {
      const start = Date.now();
      await redisClient.ping();
      health.services.redis = {
        status: 'healthy',
        responseTime: Date.now() - start,
      };
    } catch (error) {
      health.services.redis = {
        status: 'unhealthy',
        error: error.message,
      };
      health.status = 'degraded';
    }

    res.json({ success: true, data: health });
  } catch (error) {
    console.error('獲取系統健康狀態失敗:', error);
    res.status(500).json({
      success: false,
      error: '獲取系統健康狀態失敗',
      code: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString(),
    });
  }
});

module.exports = router;
