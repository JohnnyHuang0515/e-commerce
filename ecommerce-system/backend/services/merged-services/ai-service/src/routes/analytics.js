const express = require('express');
const analyticsController = require('../controllers/analyticsController');
const { authenticateToken, authorize } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     AnalyticsReport:
 *       type: object
 *       properties:
 *         report_type:
 *           type: string
 *         period:
 *           type: object
 *           properties:
 *             start_date:
 *               type: string
 *               format: date-time
 *             end_date:
 *               type: string
 *               format: date-time
 *         metrics:
 *           type: object
 *         insights:
 *           type: array
 *           items:
 *             type: string
 *         recommendations:
 *           type: array
 *           items:
 *             type: string
 *         status:
 *           type: string
 *         generated_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/v1/analytics/overview:
 *   get:
 *     summary: 獲取分析概覽
 *     tags: [AI分析]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [day, week, month, quarter, year]
 *           default: week
 *         description: 分析週期
 *     responses:
 *       200:
 *         description: 獲取成功
 *       401:
 *         description: 未授權
 *       500:
 *         description: 服務器錯誤
 */
router.get('/overview', authenticateToken, analyticsController.getOverview);

/**
 * @swagger
 * /api/v1/analytics/user-behavior:
 *   get:
 *     summary: 獲取用戶行為分析
 *     tags: [AI分析]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: 開始日期
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: 結束日期
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: string
 *         description: 特定用戶ID
 *     responses:
 *       200:
 *         description: 獲取成功
 *       401:
 *         description: 未授權
 *       500:
 *         description: 服務器錯誤
 */
router.get('/user-behavior', authenticateToken, analyticsController.getUserBehavior);

/**
 * @swagger
 * /api/v1/analytics/trends:
 *   get:
 *     summary: 獲取趨勢分析
 *     tags: [AI分析]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [search, recommendation, user_behavior, content]
 *           default: search
 *         description: 趨勢類型
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [day, week, month]
 *           default: week
 *         description: 分析週期
 *     responses:
 *       200:
 *         description: 獲取成功
 *       401:
 *         description: 未授權
 *       500:
 *         description: 服務器錯誤
 */
router.get('/trends', authenticateToken, analyticsController.getTrends);

/**
 * @swagger
 * /api/v1/analytics/insights:
 *   get:
 *     summary: 獲取AI洞察
 *     tags: [AI分析]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [search, recommendation, user_behavior, content]
 *         description: 洞察類型
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [day, week, month]
 *           default: week
 *         description: 分析週期
 *     responses:
 *       200:
 *         description: 獲取成功
 *       401:
 *         description: 未授權
 *       500:
 *         description: 服務器錯誤
 */
router.get('/insights', authenticateToken, analyticsController.getInsights);

/**
 * @swagger
 * /api/v1/analytics/reports:
 *   get:
 *     summary: 獲取分析報告列表
 *     tags: [AI分析]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: report_type
 *         schema:
 *           type: string
 *           enum: [search_analytics, recommendation_analytics, user_behavior, trend_analysis]
 *         description: 報告類型
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processing, completed, failed]
 *         description: 報告狀態
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 頁碼
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 每頁數量
 *     responses:
 *       200:
 *         description: 獲取成功
 *       401:
 *         description: 未授權
 *       500:
 *         description: 服務器錯誤
 */
router.get('/reports', authenticateToken, authorize(['admin', 'manager']), analyticsController.getReports);

/**
 * @swagger
 * /api/v1/analytics/reports:
 *   post:
 *     summary: 生成分析報告
 *     tags: [AI分析]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - report_type
 *               - period
 *             properties:
 *               report_type:
 *                 type: string
 *                 enum: [search_analytics, recommendation_analytics, user_behavior, trend_analysis]
 *               period:
 *                 type: object
 *                 properties:
 *                   start_date:
 *                     type: string
 *                     format: date
 *                   end_date:
 *                     type: string
 *                     format: date
 *     responses:
 *       201:
 *         description: 報告生成成功
 *       400:
 *         description: 請求參數錯誤
 *       401:
 *         description: 未授權
 *       500:
 *         description: 服務器錯誤
 */
router.post('/reports', authenticateToken, authorize(['admin', 'manager']), analyticsController.generateReport);

/**
 * @swagger
 * /api/v1/analytics/reports/{reportId}:
 *   get:
 *     summary: 獲取分析報告詳情
 *     tags: [AI分析]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema:
 *           type: string
 *         description: 報告ID
 *     responses:
 *       200:
 *         description: 獲取成功
 *       401:
 *         description: 未授權
 *       404:
 *         description: 報告不存在
 *       500:
 *         description: 服務器錯誤
 */
router.get('/reports/:reportId', authenticateToken, authorize(['admin', 'manager']), analyticsController.getReportById);

module.exports = router;
