const axios = require('axios');
const { logger } = require('../utils/logger');

// 服務配置
const SERVICES = {
  auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3002',
  user: process.env.USER_SERVICE_URL || 'http://localhost:3002',
  product: process.env.PRODUCT_SERVICE_URL || 'http://localhost:3001',
  order: process.env.ORDER_SERVICE_URL || 'http://localhost:3003',
  analytics: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3006',
  settings: process.env.SETTINGS_SERVICE_URL || 'http://localhost:3005'
};

// HTTP 客戶端配置
const httpClient = axios.create({
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 服務健康檢查
const checkServiceHealth = async (serviceName, serviceUrl) => {
  try {
    const startTime = Date.now();
    const response = await httpClient.get(`${serviceUrl}/health`);
    const responseTime = Date.now() - startTime;
    
    return {
      name: serviceName,
      status: 'healthy',
      responseTime,
      lastCheck: new Date(),
      data: response.data
    };
  } catch (error) {
    logger.error(`服務健康檢查失敗 ${serviceName}:`, error.message);
    return {
      name: serviceName,
      status: 'error',
      responseTime: 0,
      lastCheck: new Date(),
      error: error.message
    };
  }
};

// 聚合概覽資料
const aggregateOverviewData = async (period = 'month', authToken = '') => {
  try {
    logger.info('開始聚合概覽資料...');
    
    // 直接從資料庫獲取真實數據
    const realData = await getRealDatabaseData(period);
    
    if (realData) {
      logger.info('使用真實資料庫數據填充 Dashboard');
      return realData;
    }

    // 如果無法獲取真實數據，返回空數據而不是模擬數據
    logger.warn('無法獲取真實數據，返回空數據');
    return {
      summary: {
        totalSales: 0,
        totalOrders: 0,
        totalUsers: 0,
        totalProducts: 0,
        averageOrderValue: 0,
        conversionRate: 0
      },
      periodData: [],
      growth: {
        salesGrowth: 0,
        ordersGrowth: 0,
        usersGrowth: 0
      }
    };
  } catch (error) {
    logger.error('聚合概覽資料失敗:', error);
    // 返回空數據而不是模擬數據
    return {
      summary: {
        totalSales: 0,
        totalOrders: 0,
        totalUsers: 0,
        totalProducts: 0,
        averageOrderValue: 0,
        conversionRate: 0
      },
      periodData: [],
      growth: {
        salesGrowth: 0,
        ordersGrowth: 0,
        usersGrowth: 0
      }
    };
  }
};

// 從真實資料庫獲取數據
const getRealDatabaseData = async (period = 'month') => {
  try {
    logger.info('開始從真實資料庫獲取數據...');
    const mongoose = require('mongoose');
    const { Client } = require('pg');
    
    // 連接 MongoDB (商品數據)
    const mongoURI = process.env.MONGODB_URI || 'mongodb://admin:password123@mongodb:27017/ecommerce?authSource=admin';
    logger.info('連接 MongoDB:', mongoURI);
    
    // 如果已經連接，先斷開
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      socketTimeoutMS: 5000
    });
    logger.info('MongoDB 連接成功');
    
    // 連接 PostgreSQL (用戶和訂單數據)
    const pgClient = new Client({
      user: process.env.POSTGRES_USER || 'admin',
      host: process.env.POSTGRES_HOST || 'postgresql',
      database: process.env.POSTGRES_DB || 'ecommerce_transactions',
      password: process.env.POSTGRES_PASSWORD || 'password123',
      port: process.env.POSTGRES_PORT || 5432,
    });
    await pgClient.connect();

    // 獲取商品數據
    let Product;
    try {
      Product = mongoose.model('Product');
    } catch (error) {
      Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
    }
    const totalProducts = await Product.countDocuments();
    logger.info('商品總數:', totalProducts);
    const products = await Product.find({}, 'price').lean();
    const totalProductValue = products.reduce((sum, product) => sum + (product.price || 0), 0);
    logger.info('商品總價值:', totalProductValue);

    // 嘗試從 MongoDB 分析資料獲取概覽數據
    let DashboardOverview;
    try {
      DashboardOverview = mongoose.model('DashboardOverview');
    } catch (error) {
      DashboardOverview = mongoose.model('DashboardOverview', new mongoose.Schema({}, { strict: false }));
    }
    
    const overviewData = await DashboardOverview.findOne({ period: period }).sort({ date: -1 });
    if (overviewData) {
      logger.info('使用 MongoDB 分析資料:', overviewData);
      return {
        summary: {
          totalSales: overviewData.total_sales || 0,
          totalOrders: overviewData.total_orders || 0,
          totalUsers: overviewData.total_users || 0,
          totalProducts: overviewData.total_products || 0,
          averageOrderValue: overviewData.total_orders > 0 ? Math.round(overviewData.total_sales / overviewData.total_orders) : 0,
          conversionRate: overviewData.total_users > 0 ? Math.round((overviewData.total_orders / overviewData.total_users) * 100) : 0
        },
        periodData: [], // 移除模擬數據
        growth: await calculateGrowthRate(totalSales, totalOrders, totalUsers)
      };
    }

    // 獲取用戶數據
    const userResult = await pgClient.query('SELECT COUNT(*) as count FROM users');
    const totalUsers = parseInt(userResult.rows[0].count);
    logger.info('用戶總數:', totalUsers);

    // 獲取訂單數據
    const orderResult = await pgClient.query(`
      SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(total_amount), 0) as total_sales,
        COALESCE(AVG(total_amount), 0) as avg_order_value
      FROM orders 
      WHERE status = 'COMPLETED'
    `);
    const orderData = orderResult.rows[0];
    const totalOrders = parseInt(orderData.total_orders);
    const totalSales = parseFloat(orderData.total_sales);
    const averageOrderValue = parseFloat(orderData.avg_order_value);
    logger.info('訂單數據:', { totalOrders, totalSales, averageOrderValue });

    // 計算轉換率 (假設有 1000 個訪客，實際訂單數/1000)
    const conversionRate = totalUsers > 0 ? (totalOrders / totalUsers * 100) : 0;

    // 生成期間數據 (基於真實數據的估算)
    const periodData = []; // 移除模擬數據

    // 關閉連接
    await pgClient.end();
    await mongoose.disconnect();

    return {
      summary: {
        totalSales: Math.round(totalSales),
        totalOrders: totalOrders,
        totalUsers: totalUsers,
        totalProducts: totalProducts,
        averageOrderValue: Math.round(averageOrderValue),
        conversionRate: Math.round(conversionRate * 100) / 100
      },
      periodData: periodData,
      growth: await calculateGrowthRate(totalSales, totalOrders, totalUsers)
    };
  } catch (error) {
    logger.error('從資料庫獲取真實數據失敗:', error);
    return null;
  }
};

// 計算增長率 - 確保每次都會關閉資料庫連線
const calculateGrowthRate = async (currentSales, currentOrders, currentUsers) => {
  let pgClient = null;
  try {
    const { Client } = require('pg');
    pgClient = new Client({
      user: process.env.POSTGRES_USER || 'admin',
      host: process.env.POSTGRES_HOST || 'postgresql',
      database: process.env.POSTGRES_DB || 'ecommerce_transactions',
      password: process.env.POSTGRES_PASSWORD || 'password123',
      port: process.env.POSTGRES_PORT || 5432,
    });
    
    await pgClient.connect();
    console.log('增長率計算：資料庫連線成功');

    const now = new Date();
    // 上月1日到上月最後一天
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    console.log('增長率計算：查詢上月數據', {
      start: lastMonthStart.toISOString(),
      end: lastMonthEnd.toISOString()
    });

    // 查詢上月數據
    const [salesResult, ordersResult, usersResult] = await Promise.all([
      pgClient.query(`
        SELECT COALESCE(SUM(total_amount), 0) as total_sales
        FROM orders 
        WHERE created_at >= $1 AND created_at <= $2 AND status = 'COMPLETED'
      `, [lastMonthStart, lastMonthEnd]),
      pgClient.query(`
        SELECT COUNT(*) as total_orders
        FROM orders 
        WHERE created_at >= $1 AND created_at <= $2 AND status = 'COMPLETED'
      `, [lastMonthStart, lastMonthEnd]),
      pgClient.query(`
        SELECT COUNT(*) as total_users
        FROM users 
        WHERE created_at >= $1 AND created_at <= $2
      `, [lastMonthStart, lastMonthEnd])
    ]);

    const lastMonthSales = parseFloat(salesResult.rows[0].total_sales);
    const lastMonthOrders = parseInt(ordersResult.rows[0].total_orders);
    const lastMonthUsers = parseInt(usersResult.rows[0].total_users);

    console.log('增長率計算：上月數據', {
      lastMonthSales,
      lastMonthOrders,
      lastMonthUsers,
      currentSales,
      currentOrders,
      currentUsers
    });

    // 計算增長率
    const salesGrowth = lastMonthSales === 0 ? (currentSales > 0 ? 100 : 0) : 
      Math.round(((currentSales - lastMonthSales) / lastMonthSales) * 100);
    
    const ordersGrowth = lastMonthOrders === 0 ? (currentOrders > 0 ? 100 : 0) : 
      Math.round(((currentOrders - lastMonthOrders) / lastMonthOrders) * 100);
    
    const usersGrowth = lastMonthUsers === 0 ? (currentUsers > 0 ? 100 : 0) : 
      Math.round(((currentUsers - lastMonthUsers) / lastMonthUsers) * 100);

    const result = {
      salesGrowth: Math.max(0, salesGrowth), // 確保不為負數
      ordersGrowth: Math.max(0, ordersGrowth),
      usersGrowth: Math.max(0, usersGrowth)
    };

    console.log('增長率計算：結果', result);
    return result;

  } catch (error) {
    console.error('計算增長率失敗:', error);
    return {
      salesGrowth: 0,
      ordersGrowth: 0,
      usersGrowth: 0
    };
  } finally {
    // 確保資料庫連線一定會關閉
    if (pgClient) {
      try {
        await pgClient.end();
        console.log('增長率計算：資料庫連線已關閉');
      } catch (closeError) {
        console.error('關閉資料庫連線失敗:', closeError);
      }
    }
  }
};

// 獲取每日銷售趨勢數據
const getDailySalesData = async (period = 'month') => {
  try {
    logger.info('開始獲取每日銷售趨勢數據...');
    const mongoose = require('mongoose');
    
    // 連接 MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://admin:password123@mongodb:27017/ecommerce?authSource=admin';
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // 嘗試從 MongoDB 分析資料獲取
    let Analytics;
    try {
      Analytics = mongoose.model('Analytics');
    } catch (error) {
      Analytics = mongoose.model('Analytics', new mongoose.Schema({}, { strict: false }));
    }

    // 查詢分析資料
    const analyticsData = await Analytics.find({ 
      type: 'daily_sales',
      period: 'daily'
    }).sort({ date: -1 }).limit(period === 'month' ? 30 : 7);

    if (analyticsData && analyticsData.length > 0) {
      logger.info(`找到 ${analyticsData.length} 天的分析資料`);
      const dailySalesData = analyticsData.map(item => ({
        date: item.data.date,
        sales: item.data.sales || 0,
        orders: item.data.orders || 0,
        users: item.data.users || 0
      })).reverse(); // 按時間正序排列

      await mongoose.disconnect();
      return dailySalesData;
    }

    // 如果沒有分析資料，回退到 PostgreSQL 查詢
    const { Client } = require('pg');
    const pgClient = new Client({
      user: process.env.POSTGRES_USER || 'admin',
      host: process.env.POSTGRES_HOST || 'postgresql',
      database: process.env.POSTGRES_DB || 'ecommerce_transactions',
      password: process.env.POSTGRES_PASSWORD || 'password123',
      port: process.env.POSTGRES_PORT || 5432,
    });
    await pgClient.connect();

    // 計算日期範圍
    const now = new Date();
    let startDate, days;
    
    if (period === 'month') {
      // 當月：從本月1日開始到今天
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      days = now.getDate(); // 當月已過的天數
    } else if (period === 'week') {
      // 過去7天
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
      days = 7;
    } else {
      // 默認過去7天
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
      days = 7;
    }
    
    const endDate = now;
    
    logger.info(`查詢日期範圍: ${startDate.toISOString().split('T')[0]} 到 ${endDate.toISOString().split('T')[0]} (${days}天)`);
    logger.info(`當前時間: ${now.toISOString()}, 當前月份: ${now.getMonth() + 1}, 當前年份: ${now.getFullYear()}`);

    // 獲取每日訂單數據
    const dailyOrdersQuery = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as orders,
        COALESCE(SUM(total_amount), 0) as sales
      FROM orders 
      WHERE created_at >= $1 AND created_at <= $2 AND status = 'COMPLETED'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;
    
    const result = await pgClient.query(dailyOrdersQuery, [startDate, endDate]);
    const dailyData = result.rows;
    logger.info(`查詢結果: 找到 ${dailyData.length} 天的數據`);
    if (dailyData.length > 0) {
      logger.info(`第一天數據: ${JSON.stringify(dailyData[0])}`);
    }

    // 生成完整的日期範圍數據
    const dailySalesData = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayData = dailyData.find(d => d.date.toISOString().split('T')[0] === dateStr);
      dailySalesData.push({
        date: dateStr,
        sales: dayData ? parseFloat(dayData.sales) : 0,
        orders: dayData ? parseInt(dayData.orders) : 0,
        users: 0 // 暫時設為 0，可以從用戶註冊數據計算
      });
    }

    await pgClient.end();
    await mongoose.disconnect();

    logger.info('每日銷售趨勢數據獲取成功');
    return dailySalesData;
  } catch (error) {
    logger.error('獲取每日銷售趨勢數據失敗:', error);
    return [];
  }
};

// 獲取訂單狀態分布數據
const getOrderStatusData = async () => {
  try {
    logger.info('開始獲取訂單狀態分布數據...');
    const { Client } = require('pg');
    
    const pgClient = new Client({
      user: process.env.POSTGRES_USER || 'admin',
      host: process.env.POSTGRES_HOST || 'postgresql',
      database: process.env.POSTGRES_DB || 'ecommerce_transactions',
      password: process.env.POSTGRES_PASSWORD || 'password123',
      port: process.env.POSTGRES_PORT || 5432,
    });
    await pgClient.connect();

    // 獲取當月訂單狀態統計
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);
    
    const statusQuery = `
      SELECT 
        status,
        COUNT(*) as count,
        COALESCE(SUM(total_amount), 0) as total_amount
      FROM orders 
      WHERE created_at >= $1 AND created_at <= $2
      GROUP BY status
      ORDER BY count DESC
    `;
    
    const result = await pgClient.query(statusQuery, [startOfMonth, endOfMonth]);
    const statusData = result.rows;

    // 狀態顏色映射
    const statusColors = {
      'PENDING': '#faad14',
      'PROCESSING': '#1890ff',
      'COMPLETED': '#52c41a',
      'CANCELLED': '#ff4d4f',
      'REFUNDED': '#722ed1'
    };

    const orderStatusData = statusData.map(item => ({
      status: item.status,
      count: parseInt(item.count),
      amount: parseFloat(item.total_amount),
      color: statusColors[item.status] || '#666666'
    }));

    await pgClient.end();
    logger.info('訂單狀態分布數據獲取成功');
    return orderStatusData;
  } catch (error) {
    logger.error('獲取訂單狀態分布數據失敗:', error);
    return [];
  }
};

// 獲取熱門商品排行榜數據
const getPopularProductsData = async (limit = 10) => {
  try {
    logger.info('開始獲取熱門商品排行榜數據...');
    const mongoose = require('mongoose');
    const { Client } = require('pg');
    
    // 確保 MongoDB 連接
    const mongoURI = process.env.MONGODB_URI || 'mongodb://admin:password123@mongodb:27017/ecommerce?authSource=admin';
    console.log('當前 MongoDB 連接狀態:', mongoose.connection.readyState);
    if (mongoose.connection.readyState !== 1) {
      console.log('重新連接 MongoDB...');
      try {
        await mongoose.connect(mongoURI, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
          serverSelectionTimeoutMS: 10000,
          connectTimeoutMS: 10000,
          socketTimeoutMS: 10000
        });
        console.log('MongoDB 重新連接成功');
      } catch (error) {
        console.error('MongoDB 連接失敗:', error.message);
        throw error;
      }
    } else {
      console.log('MongoDB 已連接');
    }

    // 連接 PostgreSQL
    const pgClient = new Client({
      user: process.env.POSTGRES_USER || 'admin',
      host: process.env.POSTGRES_HOST || 'postgresql',
      database: process.env.POSTGRES_DB || 'ecommerce_transactions',
      password: process.env.POSTGRES_PASSWORD || 'password123',
      port: process.env.POSTGRES_PORT || 5432,
    });
    await pgClient.connect();

    // 獲取商品銷售統計 - 修正排序邏輯
    const salesQuery = `
      SELECT 
        oi.product_id,
        oi.product_name,
        COUNT(*) as sales_count,
        SUM(oi.quantity) as total_quantity,
        SUM(oi.unit_price * oi.quantity) as total_sales
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status = 'COMPLETED'
      GROUP BY oi.product_id, oi.product_name
      ORDER BY total_sales DESC, sales_count DESC
      LIMIT $1
    `;
    
    const result = await pgClient.query(salesQuery, [limit]);
    const salesData = result.rows;

    // 獲取商品詳細信息
    let Product;
    try {
      Product = mongoose.model('Product');
    } catch (error) {
      Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
    }

    console.log('開始處理銷售數據，共', salesData.length, '筆');
    const popularProducts = [];
    for (const item of salesData) {
      try {
        console.log(`查詢商品 ID: ${item.product_id}`);
        // 由於 product_id 是 MongoDB ObjectId 字符串，直接使用它查找
        const product = await Product.findById(item.product_id).lean();
        console.log(`找到商品:`, product ? product.name : '未找到');
        if (product) {
          console.log('使用 MongoDB 商品數據');
          popularProducts.push({
            id: product._id,
            name: product.name || '未知商品',
            image: product.image || '/images/placeholder.jpg',
            price: product.price || 0,
            salesCount: parseInt(item.sales_count),
            totalQuantity: parseInt(item.total_quantity),
            totalSales: parseFloat(item.total_sales),
            growth: 0 // 移除模擬增長率
          });
        } else {
          // 如果找不到商品，創建一個基本的商品信息
          console.log(`商品未找到，使用 product_name: ${item.product_name}`);
          popularProducts.push({
            id: item.product_id,
            name: item.product_name || '未知商品',
            image: '/images/placeholder.jpg',
            price: 0,
            salesCount: parseInt(item.sales_count),
            totalQuantity: parseInt(item.total_quantity),
            totalSales: parseFloat(item.total_sales),
            growth: 0 // 移除模擬增長率
          });
        }
      } catch (error) {
        logger.warn(`獲取商品 ${item.product_id} 信息失敗:`, error.message);
      }
    }

    await pgClient.end();
    await mongoose.disconnect();

    logger.info('熱門商品排行榜數據獲取成功');
    return popularProducts;
  } catch (error) {
    logger.error('獲取熱門商品排行榜數據失敗:', error);
    return [];
  }
};

// 獲取即時資料
const getRealtimeData = async () => {
  try {
    const [userRealtime, orderRealtime, systemStats] = await Promise.allSettled([
      httpClient.get(`${SERVICES.user}/api/v1/users/analytics`),
      httpClient.get(`${SERVICES.order}/api/v1/orders/statistics`),
      getSystemStats()
    ]);

    const userData = userRealtime.status === 'fulfilled' ? userRealtime.value.data : {};
    const orderData = orderRealtime.status === 'fulfilled' ? orderRealtime.value.data : {};

    return {
      currentStats: {
        activeUsers: userData.activeUsers || 0,
        currentOrders: orderData.currentOrders || 0,
        systemLoad: systemStats.value.load || 0,
        memoryUsage: systemStats.value.memory || 0
      },
      trends: [
        {
          metric: 'activeUsers',
          value: userData.activeUsers || 0,
          trend: userData.trend || 'stable',
          timestamp: new Date()
        },
        {
          metric: 'currentOrders',
          value: orderData.currentOrders || 0,
          trend: orderData.trend || 'stable',
          timestamp: new Date()
        }
      ],
      liveEvents: []
    };
  } catch (error) {
    logger.error('獲取即時資料失敗:', error);
    throw error;
  }
};

// 獲取系統統計
const getSystemStats = async () => {
  try {
    // 模擬系統統計資料
    return {
      load: Math.random() * 100,
      memory: Math.random() * 100,
      cpu: Math.random() * 100
    };
  } catch (error) {
    logger.error('獲取系統統計失敗:', error);
    return { load: 0, memory: 0, cpu: 0 };
  }
};

// 獲取分析資料
const getAnalyticsData = async (type, period) => {
  try {
    let endpoint = '';
    
    switch (type) {
      case 'sales':
        endpoint = `${SERVICES.analytics}/api/v1/analytics/internal/sales?period=${period}`;
        break;
      case 'users':
        endpoint = `${SERVICES.analytics}/api/v1/analytics/internal/users?period=${period}`;
        break;
      case 'products':
        endpoint = `${SERVICES.analytics}/api/v1/analytics/internal/products?period=${period}`;
        break;
      case 'orders':
        endpoint = `${SERVICES.order}/api/v1/orders/statistics?period=${period}`;
        break;
      default:
        throw new Error('不支援的分析類型');
    }

    const response = await httpClient.get(endpoint);
    return response.data;
  } catch (error) {
    logger.error(`獲取分析資料失敗 ${type}:`, error);
    throw error;
  }
};

// 獲取小工具資料
const getWidgetData = async (widgetConfig) => {
  try {
    const { dataSource, options } = widgetConfig;
    
    // 根據資料來源獲取資料
    switch (dataSource) {
      case 'sales':
        return await getAnalyticsData('sales', options?.period || 'day');
      case 'users':
        return await getAnalyticsData('users', options?.period || 'day');
      case 'products':
        return await getAnalyticsData('products', options?.period || 'day');
      case 'orders':
        return await getAnalyticsData('orders', options?.period || 'day');
      case 'system':
        return await getSystemStats();
      default:
        throw new Error('不支援的資料來源');
    }
  } catch (error) {
    logger.error('獲取小工具資料失敗:', error);
    throw error;
  }
};

// 獲取用戶行為分析數據
const getUserBehaviorData = async (limit = 100) => {
  try {
    logger.info('開始獲取用戶行為分析數據...');
    const mongoose = require('mongoose');
    
    // 連接 MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://admin:password123@mongodb:27017/ecommerce?authSource=admin';
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    let UserBehavior;
    try {
      UserBehavior = mongoose.model('UserBehavior');
    } catch (error) {
      UserBehavior = mongoose.model('UserBehavior', new mongoose.Schema({}, { strict: false }));
    }

    // 獲取用戶行為統計
    const behaviorStats = await UserBehavior.aggregate([
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 },
          avgDuration: { $avg: '$duration' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // 獲取頁面訪問統計
    const pageStats = await UserBehavior.aggregate([
      {
        $group: {
          _id: '$page',
          count: { $sum: 1 },
          uniqueUsers: { $addToSet: '$user_id' }
        }
      },
      {
        $project: {
          page: '$_id',
          count: 1,
          uniqueUsers: { $size: '$uniqueUsers' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    await mongoose.disconnect();

    return {
      behaviorStats: behaviorStats.map(item => ({
        action: item._id,
        count: item.count,
        avgDuration: Math.round(item.avgDuration || 0)
      })),
      pageStats: pageStats.map(item => ({
        page: item.page,
        count: item.count,
        uniqueUsers: item.uniqueUsers
      }))
    };

  } catch (error) {
    logger.error('獲取用戶行為數據失敗:', error);
    return { behaviorStats: [], pageStats: [] };
  }
};

// 獲取系統健康監控數據
const getSystemHealthData = async () => {
  try {
    logger.info('開始獲取系統健康監控數據...');
    const mongoose = require('mongoose');
    
    // 連接 MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://admin:password123@mongodb:27017/ecommerce?authSource=admin';
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    let SystemHealth;
    try {
      SystemHealth = mongoose.model('SystemHealth');
    } catch (error) {
      SystemHealth = mongoose.model('SystemHealth', new mongoose.Schema({}, { strict: false }));
    }

    const healthData = await SystemHealth.find({}).sort({ createdAt: -1 }).lean();
    await mongoose.disconnect();

    return healthData.map(service => ({
      service: service.service,
      status: service.status,
      responseTime: service.response_time,
      memoryUsage: service.memory_usage,
      cpuUsage: service.cpu_usage,
      errorCount: service.error_count,
      lastCheck: service.createdAt
    }));

  } catch (error) {
    logger.error('獲取系統健康數據失敗:', error);
    return [];
  }
};

module.exports = {
  checkServiceHealth,
  aggregateOverviewData,
  getDailySalesData,
  getOrderStatusData,
  getPopularProductsData,
  getUserBehaviorData,
  getSystemHealthData,
  getRealtimeData,
  getAnalyticsData,
  getWidgetData,
  getSystemStats,
  SERVICES
};
