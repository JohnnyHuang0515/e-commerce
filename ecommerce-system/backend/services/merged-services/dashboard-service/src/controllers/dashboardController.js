const { Overview, Realtime, Analytics, Widget, Report } = require('../models/Dashboard');
const { 
  checkServiceHealth, 
  aggregateOverviewData, 
  getRealtimeData, 
  getAnalyticsData,
  getWidgetData: getWidgetDataFromService,
  SERVICES 
} = require('../services/dashboardService');
const { logger } = require('../utils/logger');

// 獲取概覽資料
const getOverview = async (req, res) => {
  try {
    const { period = 'month', timezone = 'Asia/Taipei' } = req.query;
    logger.info(`獲取概覽資料: period=${period}, timezone=${timezone}`);
    const overviewData = await aggregateOverviewData(period);
    const serviceChecks = await Promise.all([
      checkServiceHealth('auth-service', SERVICES.auth),
      checkServiceHealth('user-service', SERVICES.user),
      checkServiceHealth('product-service', SERVICES.product),
      checkServiceHealth('order-service', SERVICES.order),
      checkServiceHealth('analytics-service', SERVICES.analytics),
      checkServiceHealth('settings-service', SERVICES.settings)
    ]);
    const alerts = [];
    serviceChecks.forEach(service => {
      if (service.status === 'error') {
        alerts.push({ type: 'error', message: `${service.name} 服務異常`, timestamp: new Date() });
      } else if (service.responseTime > 2000) {
        alerts.push({ type: 'warning', message: `${service.name} 回應時間過長 (${service.responseTime}ms)`, timestamp: new Date() });
      }
    });
    const response = {
      success: true,
      data: {
        summary: overviewData.summary,
        periodData: overviewData.periodData,
        growth: overviewData.growth,
        alerts,
        systemStatus: { services: serviceChecks }
      },
      message: '概覽資料獲取成功'
    };
    res.json(response);
  } catch (error) {
    logger.error('獲取概覽資料失敗:', error);
    res.status(500).json({ success: false, message: '獲取概覽資料失敗', error: error.message });
  }
};

// 新增：獲取詳細統計
const getStats = (req, res) => {
    logger.info('獲取詳細統計');
    res.status(200).json({ success: true, message: 'Stats endpoint hit' });
};

// 新增：獲取摘要資料
const getSummary = (req, res) => {
    logger.info('獲取摘要資料');
    res.status(200).json({ success: true, message: 'Summary endpoint hit' });
};

// 獲取即時資料
const getRealtime = async (req, res) => {
  try {
    const { interval = '5s' } = req.query;
    logger.info(`獲取即時資料: interval=${interval}`);
    const realtimeData = await getRealtimeData();
    const response = { success: true, data: realtimeData, message: '即時資料獲取成功' };
    res.json(response);
  } catch (error) {
    logger.error('獲取即時資料失敗:', error);
    res.status(500).json({ success: false, message: '獲取即時資料失敗', error: error.message });
  }
};

// 新增：獲取關鍵指標
const getMetrics = (req, res) => {
    logger.info('獲取關鍵指標');
    res.status(200).json({ success: true, message: 'Metrics endpoint hit' });
};

// 新增：獲取趨勢資料
const getTrends = (req, res) => {
    logger.info('獲取趨勢資料');
    res.status(200).json({ success: true, message: 'Trends endpoint hit' });
};

// 新增：警告系統
const getAlerts = (req, res) => {
    logger.info('獲取警告列表');
    res.status(200).json({ success: true, message: 'Get alerts endpoint hit' });
};
const createAlert = (req, res) => {
    logger.info('建立新警告');
    res.status(201).json({ success: true, message: 'Create alert endpoint hit' });
};
const updateAlert = (req, res) => {
    logger.info(`更新警告: id=${req.params.id}`);
    res.status(200).json({ success: true, message: `Update alert ${req.params.id} endpoint hit` });
};
const deleteAlert = (req, res) => {
    logger.info(`刪除警告: id=${req.params.id}`);
    res.status(200).json({ success: true, message: `Delete alert ${req.params.id} endpoint hit` });
};
const acknowledgeAlert = (req, res) => {
    logger.info(`確認警告: id=${req.params.id}`);
    res.status(200).json({ success: true, message: `Acknowledge alert ${req.params.id} endpoint hit` });
};


// 獲取分析資料
const getAnalytics = async (req, res) => {
  try {
    const { type, period = 'day' } = req.query;
    if (!type) {
      return res.status(400).json({ success: false, message: '分析類型是必需的' });
    }
    logger.info(`獲取分析資料: type=${type}, period=${period}`);
    const analyticsData = await getAnalyticsData(type, period);
    const response = { success: true, data: analyticsData, message: '分析資料獲取成功' };
    res.json(response);
  } catch (error) {
    logger.error('獲取分析資料失敗:', error);
    res.status(500).json({ success: false, message: '獲取分析資料失敗', error: error.message });
  }
};

// 獲取設定資料 (此路由已從 dashboard.js 移除，但保留函式以備不時之需)
const getSettings = async (req, res) => {
  try {
    logger.info('獲取設定資料');
    const response = {
      success: true,
      data: { general: {}, payment: {}, shipping: {}, notification: {}, security: {} },
      message: '設定資料獲取成功'
    };
    res.json(response);
  } catch (error) {
    logger.error('獲取設定資料失敗:', error);
    res.status(500).json({ success: false, message: '獲取設定資料失敗', error: error.message });
  }
};

// 小工具管理
const getWidgets = async (req, res) => {
  try {
    const { userId } = req.query;
    logger.info(`獲取小工具資料: userId=${userId}`);
    const widgets = [
      { _id: '1', name: '銷售概覽', type: 'sales-overview', position: 1, config: { dataSource: 'sales', options: { period: 'today' } } },
      { _id: '2', name: '訂單統計', type: 'order-stats', position: 2, config: { dataSource: 'orders', options: { period: 'week' } } }
    ];
    const widgetsWithData = await Promise.all(
      widgets.map(async (widget) => {
        const mockData = {
          sales: { totalSales: 125000, growth: 12.5, period: widget.config.options?.period || 'today' },
          orders: { totalOrders: 45, averageOrderValue: 2777.78, period: widget.config.options?.period || 'week' }
        };
        return { ...widget, data: mockData[widget.config.dataSource] || mockData.sales };
      })
    );
    res.json({ success: true, data: widgetsWithData, message: '小工具資料獲取成功' });
  } catch (error) {
    logger.error('獲取小工具資料失敗:', error);
    res.status(500).json({ success: false, message: '獲取小工具資料失敗', error: error.message });
  }
};

const createWidget = (req, res) => {
    logger.info('建立新小工具');
    res.status(201).json({ success: true, message: 'Create widget endpoint hit' });
};
const updateWidget = (req, res) => {
    logger.info(`更新小工具: id=${req.params.id}`);
    res.status(200).json({ success: true, message: `Update widget ${req.params.id} endpoint hit` });
};
const deleteWidget = (req, res) => {
    logger.info(`刪除小工具: id=${req.params.id}`);
    res.status(200).json({ success: true, message: `Delete widget ${req.params.id} endpoint hit` });
};
const getWidgetData = (req, res) => {
    logger.info(`獲取小工具資料: id=${req.params.id}`);
    res.status(200).json({ success: true, message: `Get widget data for ${req.params.id} endpoint hit` });
};


// 報告管理
const getReports = (req, res) => {
    logger.info('獲取報告列表');
    res.status(200).json({ success: true, message: 'Get reports endpoint hit' });
};

const createReport = async (req, res) => {
  try {
    const { name, type } = req.body;
    logger.info(`建立報告: name=${name}, type=${type}`);
    const report = { name, type, status: 'pending' }; // Simplified
    res.status(201).json({ success: true, data: report, message: '報告建立成功' });
  } catch (error) {
    logger.error('建立報告失敗:', error);
    res.status(500).json({ success: false, message: '建立報告失敗', error: error.message });
  }
};

const getReport = async (req, res) => {
  try {
    const { id } = req.params;
    logger.info(`獲取報告: reportId=${id}`);
    const report = { _id: id, name: '銷售報告', type: 'sales', createdAt: new Date() };
    res.json({ success: true, data: report, message: '報告獲取成功' });
  } catch (error) {
    logger.error('獲取報告失敗:', error);
    res.status(500).json({ success: false, message: '獲取報告失敗', error: error.message });
  }
};

module.exports = {
  getOverview,
  getStats,
  getSummary,
  getRealtime,
  getMetrics,
  getTrends,
  getAlerts,
  createAlert,
  updateAlert,
  deleteAlert,
  acknowledgeAlert,
  getWidgets,
  createWidget,
  updateWidget,
  deleteWidget,
  getWidgetData,
  getAnalytics,
  getReports,
  createReport,
  getReport,
  getSettings
};
