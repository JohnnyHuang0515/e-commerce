const express = require('express');
const router = express.Router();

const {
  getOverview,
  getRealtime,
  getAnalytics,
  getSettings,
  getWidgets,
  createReport,
  getReport
} = require('../controllers/dashboardController');

/**
 * @swagger
 * components:
 *   schemas:
 *     DashboardOverview:
 *       type: object
 *       properties:
 *         summary:
 *           type: object
 *           properties:
 *             totalSales:
 *               type: number
 *             totalOrders:
 *               type: number
 *             totalUsers:
 *               type: number
 *             totalProducts:
 *               type: number
 *             averageOrderValue:
 *               type: number
 *             conversionRate:
 *               type: number
 *         periodData:
 *           type: array
 *           items:
 *             type: object
 *         growth:
 *           type: object
 *         alerts:
 *           type: array
 *         systemStatus:
 *           type: object
 *     DashboardRealtime:
 *       type: object
 *       properties:
 *         currentStats:
 *           type: object
 *         trends:
 *           type: array
 *         liveEvents:
 *           type: array
 */

/**
 * @swagger
 * /api/v1/dashboard/overview:
 *   get:
 *     summary: 獲取儀表板概覽資料
 *     description: 聚合所有服務的資料，提供系統概覽
 *     tags: [Dashboard]
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [today, week, month, quarter, year]
 *         description: 時間週期
 *         example: month
 *       - in: query
 *         name: timezone
 *         schema:
 *           type: string
 *         description: 時區設定
 *         example: Asia/Taipei
 *     responses:
 *       200:
 *         description: 成功獲取概覽資料
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/DashboardOverview'
 *                 message:
 *                   type: string
 *       500:
 *         description: 服務器錯誤
 */
router.get('/overview', getOverview);

/**
 * @swagger
 * /api/v1/dashboard/realtime:
 *   get:
 *     summary: 獲取即時資料
 *     description: 獲取系統即時統計和趨勢資料
 *     tags: [Dashboard]
 *     parameters:
 *       - in: query
 *         name: interval
 *         schema:
 *           type: string
 *         description: 更新間隔
 *         example: 5s
 *     responses:
 *       200:
 *         description: 成功獲取即時資料
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/DashboardRealtime'
 *                 message:
 *                   type: string
 *       500:
 *         description: 服務器錯誤
 */
router.get('/realtime', getRealtime);

/**
 * @swagger
 * /api/v1/dashboard/analytics:
 *   get:
 *     summary: 獲取分析資料
 *     description: 根據類型獲取特定的分析資料
 *     tags: [Dashboard]
 *     parameters:
 *       - in: query
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [sales, users, products, orders]
 *         description: 分析類型
 *         example: sales
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [hour, day, week, month]
 *         description: 時間週期
 *         example: day
 *     responses:
 *       200:
 *         description: 成功獲取分析資料
 *       400:
 *         description: 參數錯誤
 *       500:
 *         description: 服務器錯誤
 */
router.get('/analytics', getAnalytics);

/**
 * @swagger
 * /api/v1/dashboard/settings:
 *   get:
 *     summary: 獲取設定資料
 *     description: 獲取系統設定相關資料
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: 成功獲取設定資料
 *       500:
 *         description: 服務器錯誤
 */
router.get('/settings', getSettings);

/**
 * @swagger
 * /api/v1/dashboard/widgets:
 *   get:
 *     summary: 獲取小工具資料
 *     description: 獲取儀表板小工具配置和資料
 *     tags: [Dashboard]
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: 用戶 ID (個人化小工具)
 *     responses:
 *       200:
 *         description: 成功獲取小工具資料
 *       500:
 *         description: 服務器錯誤
 */
router.get('/widgets', getWidgets);

/**
 * @swagger
 * /api/v1/dashboard/reports:
 *   post:
 *     summary: 建立報告
 *     description: 建立新的報告配置
 *     tags: [Dashboard]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [sales, users, products, orders, custom]
 *               schedule:
 *                 type: object
 *               recipients:
 *                 type: array
 *                 items:
 *                   type: string
 *               config:
 *                 type: object
 *     responses:
 *       201:
 *         description: 報告建立成功
 *       400:
 *         description: 參數錯誤
 *       500:
 *         description: 服務器錯誤
 */
router.post('/reports', createReport);

/**
 * @swagger
 * /api/v1/dashboard/reports/{reportId}:
 *   get:
 *     summary: 獲取報告
 *     description: 根據 ID 獲取報告詳情
 *     tags: [Dashboard]
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema:
 *           type: string
 *         description: 報告 ID
 *     responses:
 *       200:
 *         description: 成功獲取報告
 *       404:
 *         description: 報告不存在
 *       500:
 *         description: 服務器錯誤
 */
router.get('/reports/:reportId', getReport);

module.exports = router;
