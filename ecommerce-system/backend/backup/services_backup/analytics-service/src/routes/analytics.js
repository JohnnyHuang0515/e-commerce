const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { verifyToken, requirePermission } = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     SalesAnalytics:
 *       type: object
 *       properties:
 *         period:
 *           type: object
 *           properties:
 *             startDate:
 *               type: string
 *               format: date-time
 *             endDate:
 *               type: string
 *               format: date-time
 *         totals:
 *           type: object
 *           properties:
 *             totalOrders:
 *               type: integer
 *             totalRevenue:
 *               type: number
 *             totalItems:
 *               type: integer
 *             averageOrderValue:
 *               type: number
 *             totalRevenueFormatted:
 *               type: string
 *             averageOrderValueFormatted:
 *               type: string
 *         statusCounts:
 *           type: object
 *           properties:
 *             pending:
 *               type: integer
 *             paid:
 *               type: integer
 *             shipped:
 *               type: integer
 *             delivered:
 *               type: integer
 *             cancelled:
 *               type: integer
 *             refunded:
 *               type: integer
 *         topProducts:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *               name:
 *                 type: string
 *               quantity:
 *                 type: integer
 *               revenue:
 *                 type: number
 *               revenueFormatted:
 *                 type: string
 *               heatScore:
 *                 type: integer
 *         trend:
 *           type: object
 *           properties:
 *             trend:
 *               type: number
 *             percentage:
 *               type: number
 *         forecast:
 *           type: object
 *           properties:
 *             slope:
 *               type: number
 *             intercept:
 *               type: number
 *             forecast:
 *               type: array
 *               items:
 *                 type: number
 *             trend:
 *               type: string
 *         dailyData:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *                 format: date-time
 *               totalOrders:
 *                 type: integer
 *               totalRevenue:
 *                 type: number
 *               totalItems:
 *                 type: integer
 *               averageOrderValue:
 *                 type: number
 *     
 *     UserAnalytics:
 *       type: object
 *       properties:
 *         period:
 *           type: object
 *           properties:
 *             startDate:
 *               type: string
 *               format: date-time
 *             endDate:
 *               type: string
 *               format: date-time
 *         totals:
 *           type: object
 *           properties:
 *             newUsers:
 *               type: integer
 *             activeUsers:
 *               type: integer
 *             totalUsers:
 *               type: integer
 *             retentionRate:
 *               type: string
 *         segments:
 *           type: object
 *           properties:
 *             new:
 *               type: integer
 *             active:
 *               type: integer
 *             inactive:
 *               type: integer
 *             churned:
 *               type: integer
 *         topUsers:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               email:
 *                 type: string
 *               totalOrders:
 *                 type: integer
 *               totalSpent:
 *                 type: number
 *               totalSpentFormatted:
 *                 type: string
 *               valueScore:
 *                 type: object
 *                 properties:
 *                   score:
 *                     type: number
 *                   segment:
 *                     type: string
 *         trend:
 *           type: object
 *           properties:
 *             trend:
 *               type: number
 *             percentage:
 *               type: number
 *         dailyData:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *                 format: date-time
 *               newUsers:
 *                 type: integer
 *               activeUsers:
 *                 type: integer
 *               totalUsers:
 *                 type: integer
 *               retentionRate:
 *                 type: number
 *     
 *     ProductAnalytics:
 *       type: object
 *       properties:
 *         period:
 *           type: object
 *           properties:
 *             startDate:
 *               type: string
 *               format: date-time
 *             endDate:
 *               type: string
 *               format: date-time
 *         totals:
 *           type: object
 *           properties:
 *             totalProducts:
 *               type: integer
 *             activeProducts:
 *               type: integer
 *             lowStockProducts:
 *               type: integer
 *             outOfStockProducts:
 *               type: integer
 *         topSellingProducts:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *               name:
 *                 type: string
 *               category:
 *                 type: string
 *               quantity:
 *                 type: integer
 *               revenue:
 *                 type: number
 *               profit:
 *                 type: number
 *               revenueFormatted:
 *                 type: string
 *               profitFormatted:
 *                 type: string
 *               heatScore:
 *                 type: integer
 *         categoryPerformance:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               categoryId:
 *                 type: string
 *               name:
 *                 type: string
 *               productCount:
 *                 type: integer
 *               totalRevenue:
 *                 type: number
 *               averagePrice:
 *                 type: number
 *               totalRevenueFormatted:
 *                 type: string
 *               averagePriceFormatted:
 *                 type: string
 *         dailyData:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *                 format: date-time
 *               totalProducts:
 *                 type: integer
 *               activeProducts:
 *                 type: integer
 *               lowStockProducts:
 *                 type: integer
 *               outOfStockProducts:
 *                 type: integer
 *     
 *     RevenueAnalytics:
 *       type: object
 *       properties:
 *         period:
 *           type: object
 *           properties:
 *             startDate:
 *               type: string
 *               format: date-time
 *             endDate:
 *               type: string
 *               format: date-time
 *         totals:
 *           type: object
 *           properties:
 *             grossRevenue:
 *               type: number
 *             netRevenue:
 *               type: number
 *             totalCosts:
 *               type: number
 *             grossProfit:
 *               type: number
 *             netProfit:
 *               type: number
 *             profitMargin:
 *               type: number
 *             grossRevenueFormatted:
 *               type: string
 *             netRevenueFormatted:
 *               type: string
 *             totalCostsFormatted:
 *               type: string
 *             grossProfitFormatted:
 *               type: string
 *             netProfitFormatted:
 *               type: string
 *             profitMarginFormatted:
 *               type: string
 *         paymentMethods:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               method:
 *                 type: string
 *               amount:
 *                 type: number
 *               count:
 *                 type: integer
 *               amountFormatted:
 *                 type: string
 *         refunds:
 *           type: object
 *           properties:
 *             totalAmount:
 *               type: number
 *             count:
 *               type: integer
 *             rate:
 *               type: number
 *             totalAmountFormatted:
 *               type: string
 *             rateFormatted:
 *               type: string
 *         dailyData:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *                 format: date-time
 *               grossRevenue:
 *                 type: number
 *               netRevenue:
 *                 type: number
 *               grossProfit:
 *                 type: number
 *               netProfit:
 *                 type: number
 *               profitMargin:
 *                 type: number
 *     
 *     InventoryAnalytics:
 *       type: object
 *       properties:
 *         period:
 *           type: object
 *           properties:
 *             startDate:
 *               type: string
 *               format: date-time
 *             endDate:
 *               type: string
 *               format: date-time
 *         totals:
 *           type: object
 *           properties:
 *             totalInventoryValue:
 *               type: number
 *             totalStockQuantity:
 *               type: integer
 *             lowStockItems:
 *               type: integer
 *             outOfStockItems:
 *               type: integer
 *             totalInventoryValueFormatted:
 *               type: string
 *             inventoryTurnover:
 *               type: string
 *             stockoutRate:
 *               type: string
 *         stockAlerts:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *               name:
 *                 type: string
 *               currentStock:
 *                 type: integer
 *               minStock:
 *                 type: integer
 *               alertType:
 *                 type: string
 *         dailyData:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *                 format: date-time
 *               totalInventoryValue:
 *                 type: number
 *               totalStockQuantity:
 *                 type: integer
 *               lowStockItems:
 *                 type: integer
 *               outOfStockItems:
 *                 type: integer
 *               inventoryTurnover:
 *                 type: number
 *               stockoutRate:
 *                 type: number
 */

/**
 * @swagger
 * /api/v1/analytics/sales:
 *   get:
 *     summary: 取得銷售分析
 *     description: 取得銷售趨勢、訂單統計、熱銷商品等分析資料
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [1d, 7d, 30d, 90d, 1y]
 *           default: 7d
 *         description: 分析期間
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 開始日期 (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 結束日期 (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: 成功取得銷售分析資料
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/SalesAnalytics'
 *       401:
 *         description: 未授權
 *       500:
 *         description: 伺服器錯誤
 */
router.get('/sales', verifyToken, requirePermission(['analytics:read']), analyticsController.getSalesAnalytics);

/**
 * @swagger
 * /api/v1/analytics/users:
 *   get:
 *     summary: 取得用戶分析
 *     description: 取得用戶增長、留存率、用戶分群等分析資料
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [1d, 7d, 30d, 90d, 1y]
 *           default: 30d
 *         description: 分析期間
 *     responses:
 *       200:
 *         description: 成功取得用戶分析資料
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/UserAnalytics'
 *       401:
 *         description: 未授權
 *       500:
 *         description: 伺服器錯誤
 */
router.get('/users', verifyToken, requirePermission(['analytics:read']), analyticsController.getUserAnalytics);

/**
 * @swagger
 * /api/v1/analytics/products:
 *   get:
 *     summary: 取得商品分析
 *     description: 取得商品表現、熱銷商品、分類分析等資料
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [1d, 7d, 30d, 90d, 1y]
 *           default: 30d
 *         description: 分析期間
 *     responses:
 *       200:
 *         description: 成功取得商品分析資料
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ProductAnalytics'
 *       401:
 *         description: 未授權
 *       500:
 *         description: 伺服器錯誤
 */
router.get('/products', verifyToken, requirePermission(['analytics:read']), analyticsController.getProductAnalytics);

/**
 * @swagger
 * /api/v1/analytics/revenue:
 *   get:
 *     summary: 取得營收分析
 *     description: 取得營收趨勢、利潤分析、付款方式統計等資料
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [1d, 7d, 30d, 90d, 1y]
 *           default: 30d
 *         description: 分析期間
 *     responses:
 *       200:
 *         description: 成功取得營收分析資料
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/RevenueAnalytics'
 *       401:
 *         description: 未授權
 *       500:
 *         description: 伺服器錯誤
 */
router.get('/revenue', verifyToken, requirePermission(['analytics:read']), analyticsController.getRevenueAnalytics);

/**
 * @swagger
 * /api/v1/analytics/inventory:
 *   get:
 *     summary: 取得庫存分析
 *     description: 取得庫存水平、週轉率、缺貨警告等分析資料
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [1d, 7d, 30d, 90d, 1y]
 *           default: 30d
 *         description: 分析期間
 *     responses:
 *       200:
 *         description: 成功取得庫存分析資料
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/InventoryAnalytics'
 *       401:
 *         description: 未授權
 *       500:
 *         description: 伺服器錯誤
 */
router.get('/inventory', verifyToken, requirePermission(['analytics:read']), analyticsController.getInventoryAnalytics);

// 內部服務調用端點 (無需授權)
router.get('/internal/sales', analyticsController.getSalesAnalytics);
router.get('/internal/users', analyticsController.getUserAnalytics);
router.get('/internal/products', analyticsController.getProductAnalytics);

module.exports = router;
