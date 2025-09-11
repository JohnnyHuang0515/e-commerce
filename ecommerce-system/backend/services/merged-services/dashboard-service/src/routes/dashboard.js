const express = require('express');
const router = express.Router();

const {
  getOverview,
  getStats,
  getSummary,
  getDailySalesTrend,
  getOrderStatusDistribution,
  getPopularProducts,
  getUserBehavior,
  getSystemHealth,
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
  getReport
} = require('../controllers/dashboardController');


// Health check should be in app.js or a dedicated health check route

// Overview and Stats
router.get('/overview', getOverview);
router.get('/stats', getStats);
router.get('/summary', getSummary);

// Chart Data
router.get('/daily-sales', getDailySalesTrend);
router.get('/order-status', getOrderStatusDistribution);
router.get('/popular-products', getPopularProducts);

// Realtime Data
router.get('/realtime', getRealtime);
router.get('/metrics', getMetrics);
router.get('/trends', getTrends);

// Alerts
router.get('/alerts', getAlerts);
router.post('/alerts', createAlert);
router.put('/alerts/:id', updateAlert);
router.delete('/alerts/:id', deleteAlert);
router.put('/alerts/:id/acknowledge', acknowledgeAlert);

// Widgets
router.get('/widgets', getWidgets);
router.post('/widgets', createWidget);
router.put('/widgets/:id', updateWidget);
router.delete('/widgets/:id', deleteWidget);
router.get('/widgets/:id/data', getWidgetData);

// Analytics and Reports
router.get('/analytics', getAnalytics);
router.get('/reports', getReports);
router.post('/reports/generate', createReport); // Matching the API doc
router.get('/reports/:id', getReport);

// User Behavior and System Health (暫時註解掉，因為函數未定義)
// router.get('/user-behavior', getUserBehavior);
// router.get('/system-health', getSystemHealth);

module.exports = router;
