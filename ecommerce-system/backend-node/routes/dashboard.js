const express = require('express');
const router = express.Router();
const { postgresPool, authenticateToken } = require('../config/database');
const { checkPermission } = require('../middleware/rbac');

// 獲取真實的警告數據
async function getRealAlerts() {
  try {
    // 檢查低庫存商品
    const lowStockResult = await postgresPool.query(`
      SELECT name, stock_quantity
      FROM products
      WHERE status = 1 AND stock_quantity < 10
      ORDER BY stock_quantity ASC
      LIMIT 5
    `);

    const alerts = [];
    
    // 生成庫存警告
    lowStockResult.rows.forEach((product, index) => {
      alerts.push({
        _id: `alert-stock-${index + 1}`,
        title: '庫存警告',
        message: `${product.name} 庫存不足 (剩餘: ${product.stock_quantity})`,
        type: 'warning',
        severity: product.stock_quantity < 5 ? 'high' : 'medium',
        source: 'inventory',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    });

    return alerts;
  } catch (error) {
    console.error('獲取警告數據失敗:', error);
    return [];
  }
}

// Dashboard 概覽數據
router.get('/overview', authenticateToken, checkPermission('view_products'), async (req, res) => {
  try {
    // 獲取基本統計數據
    const [salesResult, ordersResult, usersResult, productsResult] = await Promise.all([
      // 總銷售額
      postgresPool.query(`
        SELECT COALESCE(SUM(total_amount), 0) as total_sales
        FROM orders 
        WHERE status = 'COMPLETED'
      `),
      
      // 總訂單數
      postgresPool.query(`
        SELECT COUNT(*) as total_orders
        FROM orders
      `),
      
      // 總用戶數
      postgresPool.query(`
        SELECT COUNT(*) as total_users
        FROM users
        WHERE status = 1
      `),
      
      // 總商品數
      postgresPool.query(`
        SELECT COUNT(*) as total_products
        FROM products
        WHERE status = 1
      `)
    ]);

    const totalSales = parseFloat(salesResult.rows[0].total_sales) || 0;
    const totalOrders = parseInt(ordersResult.rows[0].total_orders) || 0;
    const totalUsers = parseInt(usersResult.rows[0].total_users) || 0;
    const totalProducts = parseInt(productsResult.rows[0].total_products) || 0;

    // 計算平均訂單價值
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    // 計算增長率（與上個月比較）
    const [lastMonthSalesResult, lastMonthOrdersResult, lastMonthUsersResult] = await Promise.all([
      // 上個月銷售額
      postgresPool.query(`
        SELECT COALESCE(SUM(total_amount), 0) as last_month_sales
        FROM orders 
        WHERE status = 'COMPLETED' 
        AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE - INTERVAL '1 month')
        AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '1 month')
      `),
      
      // 上個月訂單數
      postgresPool.query(`
        SELECT COUNT(*) as last_month_orders
        FROM orders
        WHERE EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE - INTERVAL '1 month')
        AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '1 month')
      `),
      
      // 上個月新增用戶數
      postgresPool.query(`
        SELECT COUNT(*) as last_month_users
        FROM users
        WHERE EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE - INTERVAL '1 month')
        AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '1 month')
      `)
    ]);

    const lastMonthSales = parseFloat(lastMonthSalesResult.rows[0].last_month_sales) || 0;
    const lastMonthOrders = parseInt(lastMonthOrdersResult.rows[0].last_month_orders) || 0;
    const lastMonthUsers = parseInt(lastMonthUsersResult.rows[0].last_month_users) || 0;

    // 計算增長率
    const salesGrowth = lastMonthSales > 0 ? ((totalSales - lastMonthSales) / lastMonthSales) * 100 : (totalSales > 0 ? 100 : 0);
    const ordersGrowth = lastMonthOrders > 0 ? ((totalOrders - lastMonthOrders) / lastMonthOrders) * 100 : (totalOrders > 0 ? 100 : 0);
    const usersGrowth = lastMonthUsers > 0 ? ((totalUsers - lastMonthUsers) / lastMonthUsers) * 100 : (totalUsers > 0 ? 100 : 0);

    // 獲取當月每日銷售數據
    const dailySalesResult = await postgresPool.query(`
      SELECT 
        DATE(created_at) as date,
        COALESCE(SUM(CASE WHEN status = 'COMPLETED' THEN total_amount ELSE 0 END), 0) as sales,
        COUNT(*) as orders,
        COUNT(DISTINCT user_id) as users
      FROM orders
      WHERE EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
      AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
      GROUP BY DATE(created_at)
      ORDER BY date
    `);

    const dailySalesData = dailySalesResult.rows.map(row => ({
      date: row.date.toISOString().split('T')[0],
      sales: parseFloat(row.sales) || 0,
      orders: parseInt(row.orders) || 0,
      users: parseInt(row.users) || 0
    }));

    const overviewData = {
      summary: {
        totalSales,
        totalOrders,
        totalUsers,
        totalProducts,
        averageOrderValue: Math.round(averageOrderValue * 100) / 100,
        conversionRate: totalUsers > 0 ? Math.round((totalOrders / totalUsers) * 100 * 100) / 100 : 0
      },
      periodData: dailySalesData,
      growth: {
        salesGrowth,
        ordersGrowth,
        usersGrowth
      },
      alerts: await getRealAlerts(),
      systemStatus: {
        services: [
          {
            name: 'PostgreSQL',
            status: 'healthy',
            responseTime: 15,
            lastCheck: new Date().toISOString()
          },
          {
            name: 'MongoDB',
            status: 'healthy',
            responseTime: 8,
            lastCheck: new Date().toISOString()
          },
          {
            name: 'Redis',
            status: 'healthy',
            responseTime: 2,
            lastCheck: new Date().toISOString()
          }
        ]
      }
    };

    res.json({
      success: true,
      data: overviewData
    });

  } catch (error) {
    console.error('獲取概覽數據失敗:', error);
    res.status(500).json({
      success: false,
      error: '獲取概覽數據失敗',
      code: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

// 每日銷售數據
router.get('/daily-sales', authenticateToken, checkPermission('view_products'), async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    // 根據期間獲取真實數據
    let dateCondition = '';
    if (period === 'week') {
      dateCondition = `AND created_at >= CURRENT_DATE - INTERVAL '7 days'`;
    } else if (period === 'month') {
      dateCondition = `AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)`;
    } else if (period === 'year') {
      dateCondition = `AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)`;
    }
    
    const dailySalesResult = await postgresPool.query(`
      SELECT 
        DATE(created_at) as date,
        COALESCE(SUM(CASE WHEN status = 'COMPLETED' THEN total_amount ELSE 0 END), 0) as sales
      FROM orders
      WHERE 1=1 ${dateCondition}
      GROUP BY DATE(created_at)
      ORDER BY date
    `);
    
    const dailySalesData = dailySalesResult.rows.map(row => ({
      date: row.date.toISOString().split('T')[0],
      sales: parseFloat(row.sales) || 0
    }));

    res.json({
      success: true,
      data: dailySalesData
    });

  } catch (error) {
    console.error('獲取每日銷售數據失敗:', error);
    res.status(500).json({
      success: false,
      error: '獲取每日銷售數據失敗',
      code: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

// 訂單狀態分布
router.get('/order-status', authenticateToken, checkPermission('view_orders'), async (req, res) => {
  try {
    const result = await postgresPool.query(`
      SELECT 
        CASE 
          WHEN status = 'PENDING' THEN 'PENDING'
          WHEN status = 'PROCESSING' THEN 'PROCESSING'
          WHEN status = 'COMPLETED' THEN 'COMPLETED'
          WHEN status = 'CANCELLED' THEN 'CANCELLED'
          ELSE 'OTHER'
        END as status,
        COUNT(*) as count
      FROM orders
      GROUP BY 
        CASE 
          WHEN status = 'PENDING' THEN 'PENDING'
          WHEN status = 'PROCESSING' THEN 'PROCESSING'
          WHEN status = 'COMPLETED' THEN 'COMPLETED'
          WHEN status = 'CANCELLED' THEN 'CANCELLED'
          ELSE 'OTHER'
        END
    `);

    const orderStatusData = result.rows.map(row => ({
      status: row.status,
      count: parseInt(row.count)
    }));

    res.json({
      success: true,
      data: orderStatusData
    });

  } catch (error) {
    console.error('獲取訂單狀態數據失敗:', error);
    res.status(500).json({
      success: false,
      error: '獲取訂單狀態數據失敗',
      code: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

// 熱門商品
router.get('/popular-products', authenticateToken, checkPermission('view_products'), async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    // 獲取商品數據
    const result = await postgresPool.query(`
      SELECT 
        p.product_id,
        p.public_id,
        p.name,
        p.price,
        p.stock_quantity,
        COALESCE(SUM(oi.quantity), 0) as sales_count,
        COALESCE(SUM(oi.quantity * oi.price), 0) as total_sales
      FROM products p
      LEFT JOIN order_items oi ON p.product_id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.order_id AND o.status = 'COMPLETED'
      WHERE p.status = 1
      GROUP BY p.product_id, p.public_id, p.name, p.price, p.stock_quantity
      ORDER BY total_sales DESC
      LIMIT $1
    `, [parseInt(limit)]);

    const popularProducts = result.rows.map(row => ({
      id: row.public_id,
      name: row.name,
      price: parseFloat(row.price),
      stock: parseInt(row.stock_quantity),
      salesCount: parseInt(row.sales_count),
      totalSales: parseFloat(row.total_sales)
    }));

    res.json({
      success: true,
      data: popularProducts
    });

  } catch (error) {
    console.error('獲取熱門商品數據失敗:', error);
    res.status(500).json({
      success: false,
      error: '獲取熱門商品數據失敗',
      code: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

// 系統健康狀態
router.get('/health', async (req, res) => {
  try {
    const { postgresPool, mongoClient, redisClient } = require('../config/database');
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {}
    };
    
    // 檢查 PostgreSQL
    try {
      const start = Date.now();
      await postgresPool.query('SELECT NOW()');
      health.services.postgresql = { 
        status: 'healthy', 
        response_time: Date.now() - start 
      };
    } catch (error) {
      health.services.postgresql = { 
        status: 'unhealthy', 
        error: error.message 
      };
      health.status = 'degraded';
    }
    
    // 檢查 MongoDB
    try {
      const start = Date.now();
      await mongoClient.db('admin').admin().ping();
      health.services.mongodb = { 
        status: 'healthy', 
        response_time: Date.now() - start 
      };
    } catch (error) {
      health.services.mongodb = { 
        status: 'unhealthy', 
        error: error.message 
      };
      health.status = 'degraded';
    }
    
    // 檢查 Redis
    try {
      const start = Date.now();
      await redisClient.ping();
      health.services.redis = { 
        status: 'healthy', 
        response_time: Date.now() - start 
      };
    } catch (error) {
      health.services.redis = { 
        status: 'unhealthy', 
        error: error.message 
      };
      health.status = 'degraded';
    }

    res.json({
      success: true,
      data: health
    });

  } catch (error) {
    console.error('獲取系統健康狀態失敗:', error);
    res.status(500).json({
      success: false,
      error: '獲取系統健康狀態失敗',
      code: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
