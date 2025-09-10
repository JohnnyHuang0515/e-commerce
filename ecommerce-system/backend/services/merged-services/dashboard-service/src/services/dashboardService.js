const axios = require('axios');
const { logger } = require('../utils/logger');

// 服務配置
const SERVICES = {
  auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  user: process.env.USER_SERVICE_URL || 'http://localhost:3001',
  product: process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002',
  order: process.env.ORDER_SERVICE_URL || 'http://localhost:3003',
  analytics: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3006',
  settings: process.env.SETTINGS_SERVICE_URL || 'http://localhost:3005'
};

// HTTP 客戶端配置
const httpClient = axios.create({
  timeout: 5000,
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
const aggregateOverviewData = async (period = 'month') => {
  try {
    const [userStats, orderStats, productStats, analyticsStats] = await Promise.allSettled([
      httpClient.get(`${SERVICES.user}/api/v1/users/overview`),
      httpClient.get(`${SERVICES.order}/api/v1/orders/overview`),
      httpClient.get(`${SERVICES.product}/api/v1/products/statistics`),
      httpClient.get(`${SERVICES.analytics}/api/v1/analytics/sales?period=${period}`)
    ]);

    // 處理成功回應
    const userData = userStats.status === 'fulfilled' ? userStats.value.data : {};
    const orderData = orderStats.status === 'fulfilled' ? orderStats.value.data : {};
    const productData = productStats.status === 'fulfilled' ? productStats.value.data : {};
    const analyticsData = analyticsStats.status === 'fulfilled' ? analyticsStats.value.data : {};

    return {
      summary: {
        totalSales: analyticsData.totalSales || 0,
        totalOrders: orderData.totalOrders || 0,
        totalUsers: userData.totalUsers || 0,
        totalProducts: productData.totalProducts || 0,
        averageOrderValue: orderData.averageOrderValue || 0,
        conversionRate: analyticsData.conversionRate || 0
      },
      periodData: analyticsData.periodData || [],
      growth: {
        salesGrowth: analyticsData.growth?.salesGrowth || 0,
        ordersGrowth: orderData.growth?.ordersGrowth || 0,
        usersGrowth: userData.growth?.usersGrowth || 0
      }
    };
  } catch (error) {
    logger.error('聚合概覽資料失敗:', error);
    throw error;
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

module.exports = {
  checkServiceHealth,
  aggregateOverviewData,
  getRealtimeData,
  getAnalyticsData,
  getWidgetData,
  getSystemStats,
  SERVICES
};
