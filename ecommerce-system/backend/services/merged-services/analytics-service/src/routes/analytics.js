const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { verifyToken, requirePermission } = require('../middleware/auth');

// Base route
router.get('/', (req, res) => {
    res.json({
      success: true,
      message: 'Analytics Service API',
      version: '1.0.0'
    });
});

// Sales Analytics
router.get('/sales', verifyToken, analyticsController.getSalesAnalytics);
router.get('/sales/trend', verifyToken, analyticsController.getSalesTrend);
router.get('/sales/comparison', verifyToken, analyticsController.getSalesComparison);

// User Analytics
router.get('/users', verifyToken, analyticsController.getUserAnalytics);
router.get('/users/behavior', verifyToken, analyticsController.getUserBehavior);
router.get('/users/segmentation', verifyToken, analyticsController.getUserSegmentation);

// Product Analytics
router.get('/products', verifyToken, analyticsController.getProductAnalytics);
router.get('/products/performance', verifyToken, analyticsController.getProductPerformance);
router.get('/categories', verifyToken, analyticsController.getCategoryAnalytics);

// Revenue Analytics
router.get('/revenue', verifyToken, analyticsController.getRevenueAnalytics);
router.get('/revenue/forecast', verifyToken, analyticsController.getRevenueForecast);
router.get('/profit', verifyToken, analyticsController.getProfitAnalytics);

// Comprehensive Analytics
router.get('/dashboard', verifyToken, analyticsController.getDashboardData);
router.get('/kpi', verifyToken, analyticsController.getKpi);
router.get('/reports', verifyToken, analyticsController.getReports);

// 內部服務調用端點 (無需授權)
router.get('/internal/sales', analyticsController.getSalesAnalytics);
router.get('/internal/users', analyticsController.getUserAnalytics);
router.get('/internal/products', analyticsController.getProductAnalytics);

module.exports = router;
