const { SystemConfig, Notification, Log } = require('../models');

// 獲取儀表板概覽
const getOverview = async (req, res) => {
  try {
    // 模擬數據 - 在實際應用中，這些數據應該從各個服務聚合而來
    const overview = {
      summary: {
        totalSales: 1250000,
        totalOrders: 3420,
        totalUsers: 15680,
        totalProducts: 890,
        averageOrderValue: 365.50,
        conversionRate: 3.2
      },
      periodData: [
        { date: '2024-01-01', sales: 45000, orders: 120, users: 450 },
        { date: '2024-01-02', sales: 52000, orders: 135, users: 480 },
        { date: '2024-01-03', sales: 48000, orders: 125, users: 460 },
        { date: '2024-01-04', sales: 61000, orders: 155, users: 520 },
        { date: '2024-01-05', sales: 55000, orders: 140, users: 490 },
        { date: '2024-01-06', sales: 58000, orders: 148, users: 510 },
        { date: '2024-01-07', sales: 62000, orders: 158, users: 530 }
      ],
      growth: {
        sales: 12.5,
        orders: 8.3,
        users: 15.2,
        products: 5.7
      },
      alerts: [
        {
          id: 1,
          type: 'warning',
          message: '庫存不足：iPhone 15 Pro 僅剩 5 台',
          timestamp: new Date()
        },
        {
          id: 2,
          type: 'info',
          message: '新用戶註冊：今日新增 45 位用戶',
          timestamp: new Date()
        }
      ],
      systemStatus: {
        database: 'healthy',
        redis: 'healthy',
        minio: 'healthy',
        services: {
          auth: 'healthy',
          product: 'healthy',
          order: 'healthy',
          ai: 'healthy',
          system: 'healthy'
        }
      }
    };

    res.json({
      success: true,
      data: overview,
      message: '儀表板概覽獲取成功'
    });
  } catch (error) {
    console.error('獲取儀表板概覽錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取儀表板概覽時發生錯誤'
    });
  }
};

// 獲取實時數據
const getRealtime = async (req, res) => {
  try {
    const realtime = {
      currentStats: {
        onlineUsers: 1250,
        activeOrders: 45,
        pendingPayments: 12,
        systemLoad: 65.5
      },
      recentActivities: [
        {
          id: 1,
          type: 'order',
          message: '新訂單 #12345 已創建',
          timestamp: new Date(),
          user: '張三'
        },
        {
          id: 2,
          type: 'payment',
          message: '支付 #12345 已確認',
          timestamp: new Date(),
          user: '李四'
        },
        {
          id: 3,
          type: 'user',
          message: '新用戶註冊',
          timestamp: new Date(),
          user: '王五'
        }
      ],
      systemMetrics: {
        cpu: 45.2,
        memory: 68.5,
        disk: 32.1,
        network: 125.8
      }
    };

    res.json({
      success: true,
      data: realtime,
      message: '實時數據獲取成功'
    });
  } catch (error) {
    console.error('獲取實時數據錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取實時數據時發生錯誤'
    });
  }
};

// 獲取分析數據
const getAnalytics = async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    // 根據週期生成不同的數據
    let analyticsData = {};
    
    switch (period) {
      case 'day':
        analyticsData = {
          sales: [
            { hour: '00:00', value: 1200 },
            { hour: '02:00', value: 800 },
            { hour: '04:00', value: 600 },
            { hour: '06:00', value: 900 },
            { hour: '08:00', value: 1500 },
            { hour: '10:00', value: 2200 },
            { hour: '12:00', value: 2800 },
            { hour: '14:00', value: 3200 },
            { hour: '16:00', value: 2900 },
            { hour: '18:00', value: 2500 },
            { hour: '20:00', value: 1800 },
            { hour: '22:00', value: 1400 }
          ],
          topProducts: [
            { name: 'iPhone 15 Pro', sales: 45, revenue: 450000 },
            { name: 'MacBook Air', sales: 23, revenue: 230000 },
            { name: 'AirPods Pro', sales: 67, revenue: 134000 }
          ],
          userSegments: [
            { segment: '新用戶', count: 120, percentage: 35 },
            { segment: '回購用戶', count: 85, percentage: 25 },
            { segment: 'VIP用戶', count: 45, percentage: 13 },
            { segment: '流失用戶', count: 90, percentage: 27 }
          ]
        };
        break;
      case 'week':
        analyticsData = {
          sales: [
            { day: '週一', value: 45000 },
            { day: '週二', value: 52000 },
            { day: '週三', value: 48000 },
            { day: '週四', value: 61000 },
            { day: '週五', value: 55000 },
            { day: '週六', value: 58000 },
            { day: '週日', value: 62000 }
          ],
          topProducts: [
            { name: 'iPhone 15 Pro', sales: 280, revenue: 2800000 },
            { name: 'MacBook Air', sales: 150, revenue: 1500000 },
            { name: 'AirPods Pro', sales: 400, revenue: 800000 }
          ],
          userSegments: [
            { segment: '新用戶', count: 850, percentage: 40 },
            { segment: '回購用戶', count: 600, percentage: 28 },
            { segment: 'VIP用戶', count: 320, percentage: 15 },
            { segment: '流失用戶', count: 400, percentage: 17 }
          ]
        };
        break;
      case 'month':
        analyticsData = {
          sales: [
            { week: '第1週', value: 280000 },
            { week: '第2週', value: 320000 },
            { week: '第3週', value: 290000 },
            { week: '第4週', value: 360000 }
          ],
          topProducts: [
            { name: 'iPhone 15 Pro', sales: 1200, revenue: 12000000 },
            { name: 'MacBook Air', sales: 650, revenue: 6500000 },
            { name: 'AirPods Pro', sales: 1800, revenue: 3600000 }
          ],
          userSegments: [
            { segment: '新用戶', count: 3500, percentage: 45 },
            { segment: '回購用戶', count: 2500, percentage: 32 },
            { segment: 'VIP用戶', count: 1200, percentage: 15 },
            { segment: '流失用戶', count: 600, percentage: 8 }
          ]
        };
        break;
      case 'year':
        analyticsData = {
          sales: [
            { month: '1月', value: 1200000 },
            { month: '2月', value: 1350000 },
            { month: '3月', value: 1280000 },
            { month: '4月', value: 1420000 },
            { month: '5月', value: 1380000 },
            { month: '6月', value: 1550000 },
            { month: '7月', value: 1480000 },
            { month: '8月', value: 1620000 },
            { month: '9月', value: 1580000 },
            { month: '10月', value: 1750000 },
            { month: '11月', value: 1680000 },
            { month: '12月', value: 1850000 }
          ],
          topProducts: [
            { name: 'iPhone 15 Pro', sales: 15000, revenue: 150000000 },
            { name: 'MacBook Air', sales: 8000, revenue: 80000000 },
            { name: 'AirPods Pro', sales: 22000, revenue: 44000000 }
          ],
          userSegments: [
            { segment: '新用戶', count: 45000, percentage: 50 },
            { segment: '回購用戶', count: 30000, percentage: 33 },
            { segment: 'VIP用戶', count: 12000, percentage: 13 },
            { segment: '流失用戶', count: 3000, percentage: 4 }
          ]
        };
        break;
    }

    res.json({
      success: true,
      data: analyticsData,
      message: '分析數據獲取成功'
    });
  } catch (error) {
    console.error('獲取分析數據錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取分析數據時發生錯誤'
    });
  }
};

module.exports = {
  getOverview,
  getRealtime,
  getAnalytics
};
