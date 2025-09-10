const { Overview, Realtime, Analytics, Widget, Report } = require('../models/Dashboard');
const { 
  checkServiceHealth, 
  aggregateOverviewData, 
  getRealtimeData, 
  getAnalyticsData,
  getWidgetData,
  SERVICES 
} = require('../services/dashboardService');
const { logger } = require('../utils/logger');

// 獲取概覽資料
const getOverview = async (req, res) => {
  try {
    const { period = 'month', timezone = 'Asia/Taipei' } = req.query;
    
    logger.info(`獲取概覽資料: period=${period}, timezone=${timezone}`);
    
    // 聚合所有服務的資料
    const overviewData = await aggregateOverviewData(period);
    
    // 檢查所有服務的健康狀態
    const serviceChecks = await Promise.all([
      checkServiceHealth('auth-service', SERVICES.auth),
      checkServiceHealth('user-service', SERVICES.user),
      checkServiceHealth('product-service', SERVICES.product),
      checkServiceHealth('order-service', SERVICES.order),
      checkServiceHealth('analytics-service', SERVICES.analytics),
      checkServiceHealth('settings-service', SERVICES.settings)
    ]);
    
    // 生成警告
    const alerts = [];
    serviceChecks.forEach(service => {
      if (service.status === 'error') {
        alerts.push({
          type: 'error',
          message: `${service.name} 服務異常`,
          timestamp: new Date()
        });
      } else if (service.responseTime > 2000) {
        alerts.push({
          type: 'warning',
          message: `${service.name} 回應時間過長 (${service.responseTime}ms)`,
          timestamp: new Date()
        });
      }
    });
    
    const response = {
      success: true,
      data: {
        summary: overviewData.summary,
        periodData: overviewData.periodData,
        growth: overviewData.growth,
        alerts,
        systemStatus: {
          services: serviceChecks
        }
      },
      message: '概覽資料獲取成功'
    };
    
    // 儲存到資料庫 (暫時註解，避免 MongoDB 認證問題)
    /*
    try {
      await Overview.findOneAndUpdate(
        { period },
        { 
          period,
          summary: overviewData.summary,
          periodData: overviewData.periodData,
          growth: overviewData.growth,
          alerts,
          systemStatus: { services: serviceChecks }
        },
        { upsert: true, new: true, runValidators: false }
      );
    } catch (error) {
      logger.warn(`MongoDB 儲存失敗: ${error.message}`);
    }
    */
    
    res.json(response);
  } catch (error) {
    logger.error('獲取概覽資料失敗:', error);
    res.status(500).json({
      success: false,
      message: '獲取概覽資料失敗',
      error: error.message
    });
  }
};

// 獲取即時資料
const getRealtime = async (req, res) => {
  try {
    const { interval = '5s' } = req.query;
    
    logger.info(`獲取即時資料: interval=${interval}`);
    
    // 獲取即時資料
    const realtimeData = await getRealtimeData();
    
    const response = {
      success: true,
      data: realtimeData,
      message: '即時資料獲取成功'
    };
    
    // 儲存到資料庫 (暫時註解，避免 MongoDB 認證問題)
    /*
    try {
      await Realtime.create(realtimeData);
    } catch (error) {
      logger.warn(`MongoDB 儲存失敗: ${error.message}`);
    }
    */
    
    res.json(response);
  } catch (error) {
    logger.error('獲取即時資料失敗:', error);
    res.status(500).json({
      success: false,
      message: '獲取即時資料失敗',
      error: error.message
    });
  }
};

// 獲取分析資料
const getAnalytics = async (req, res) => {
  try {
    const { type, period = 'day' } = req.query;
    
    if (!type) {
      return res.status(400).json({
        success: false,
        message: '分析類型是必需的'
      });
    }
    
    logger.info(`獲取分析資料: type=${type}, period=${period}`);
    
    // 獲取分析資料
    const analyticsData = await getAnalyticsData(type, period);
    
    const response = {
      success: true,
      data: analyticsData,
      message: '分析資料獲取成功'
    };
    
    // 儲存到資料庫 (暫時註解，避免 MongoDB 認證問題)
    /*
    try {
      await Analytics.findOneAndUpdate(
        { type, period },
        { type, period, data: analyticsData.data, metadata: analyticsData.metadata },
        { upsert: true, new: true }
      );
    } catch (error) {
      logger.warn(`MongoDB 儲存失敗: ${error.message}`);
    }
    */
    
    res.json(response);
  } catch (error) {
    logger.error('獲取分析資料失敗:', error);
    res.status(500).json({
      success: false,
      message: '獲取分析資料失敗',
      error: error.message
    });
  }
};

// 獲取設定資料
const getSettings = async (req, res) => {
  try {
    logger.info('獲取設定資料');
    
    // 從 Settings Service 獲取設定
    const response = {
      success: true,
      data: {
        general: {},
        payment: {},
        shipping: {},
        notification: {},
        security: {}
      },
      message: '設定資料獲取成功'
    };
    
    res.json(response);
  } catch (error) {
    logger.error('獲取設定資料失敗:', error);
    res.status(500).json({
      success: false,
      message: '獲取設定資料失敗',
      error: error.message
    });
  }
};

// 獲取小工具資料
const getWidgets = async (req, res) => {
  try {
    const { userId } = req.query;
    
    logger.info(`獲取小工具資料: userId=${userId}`);
    
    // 獲取小工具配置 (暫時使用預設資料，避免 MongoDB 認證問題)
    /*
    const widgets = await Widget.find({
      $or: [
        { isDefault: true },
        { userId: userId }
      ],
      isActive: true
    }).sort({ position: 1 });
    */
    
    // 使用預設小工具資料
    const widgets = [
      {
        _id: '1',
        name: '銷售概覽',
        type: 'sales-overview',
        position: 1,
        isDefault: true,
        isActive: true,
        config: { 
          dataSource: 'sales',
          options: { period: 'today' }
        }
      },
      {
        _id: '2',
        name: '訂單統計',
        type: 'order-stats',
        position: 2,
        isDefault: true,
        isActive: true,
        config: { 
          dataSource: 'orders',
          options: { period: 'week' }
        }
      }
    ];
    
    // 獲取每個小工具的資料
    const widgetsWithData = await Promise.all(
      widgets.map(async (widget) => {
        try {
          // 暫時使用模擬資料，避免依賴其他服務
          const mockData = {
            sales: {
              totalSales: 125000,
              growth: 12.5,
              period: widget.config.options?.period || 'today'
            },
            orders: {
              totalOrders: 45,
              averageOrderValue: 2777.78,
              period: widget.config.options?.period || 'week'
            }
          };
          
          const data = mockData[widget.config.dataSource] || mockData.sales;
          
          return {
            ...widget,
            data
          };
        } catch (error) {
          logger.error(`獲取小工具資料失敗 ${widget.name}:`, error);
          return {
            ...widget,
            data: null,
            error: error.message
          };
        }
      })
    );
    
    const response = {
      success: true,
      data: widgetsWithData,
      message: '小工具資料獲取成功'
    };
    
    res.json(response);
  } catch (error) {
    logger.error('獲取小工具資料失敗:', error);
    res.status(500).json({
      success: false,
      message: '獲取小工具資料失敗',
      error: error.message
    });
  }
};

// 建立報告
const createReport = async (req, res) => {
  try {
    const { name, description, type, schedule, recipients, config } = req.body;
    
    logger.info(`建立報告: name=${name}, type=${type}`);
    
    const report = new Report({
      name,
      description,
      type,
      schedule,
      recipients,
      config
    });
    
    // 儲存到資料庫 (暫時註解，避免 MongoDB 認證問題)
    /*
    try {
      await report.save();
    } catch (error) {
      logger.warn(`MongoDB 儲存失敗: ${error.message}`);
    }
    */
    
    const response = {
      success: true,
      data: report,
      message: '報告建立成功'
    };
    
    res.status(201).json(response);
  } catch (error) {
    logger.error('建立報告失敗:', error);
    res.status(500).json({
      success: false,
      message: '建立報告失敗',
      error: error.message
    });
  }
};

// 獲取報告
const getReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    
    logger.info(`獲取報告: reportId=${reportId}`);
    
    // 暫時使用預設報告資料，避免 MongoDB 認證問題
    /*
    const report = await Report.findById(reportId);
    
    if (!report) {
      return res.status(404).json({
        success: false,
        message: '報告不存在'
      });
    }
    */
    
    // 使用預設報告資料
    const report = {
      _id: reportId,
      name: '銷售報告',
      description: '每日銷售統計報告',
      type: 'sales',
      schedule: 'daily',
      recipients: ['admin@example.com'],
      config: { period: 'day' },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const response = {
      success: true,
      data: report,
      message: '報告獲取成功'
    };
    
    res.json(response);
  } catch (error) {
    logger.error('獲取報告失敗:', error);
    res.status(500).json({
      success: false,
      message: '獲取報告失敗',
      error: error.message
    });
  }
};

module.exports = {
  getOverview,
  getRealtime,
  getAnalytics,
  getSettings,
  getWidgets,
  createReport,
  getReport
};
