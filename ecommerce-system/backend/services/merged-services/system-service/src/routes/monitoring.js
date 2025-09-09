const express = require('express');
const monitoringController = require('../controllers/monitoringController');
const { authenticateToken, authorize } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     SystemMetric:
 *       type: object
 *       properties:
 *         metric_name:
 *           type: string
 *         metric_type:
 *           type: string
 *         value:
 *           type: number
 *         labels:
 *           type: object
 *         service:
 *           type: string
 *         timestamp:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/v1/monitoring/metrics:
 *   get:
 *     summary: 獲取系統指標
 *     tags: [系統監控]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: service
 *         schema:
 *           type: string
 *         description: 服務名稱
 *       - in: query
 *         name: metric_name
 *         schema:
 *           type: string
 *         description: 指標名稱
 *       - in: query
 *         name: start_time
 *         schema:
 *           type: string
 *           format: date-time
 *         description: 開始時間
 *       - in: query
 *         name: end_time
 *         schema:
 *           type: string
 *           format: date-time
 *         description: 結束時間
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: 結果數量限制
 *     responses:
 *       200:
 *         description: 獲取成功
 *       401:
 *         description: 未授權
 *       500:
 *         description: 服務器錯誤
 */
router.get('/metrics', authenticateToken, monitoringController.getMetrics);

/**
 * @swagger
 * /api/v1/monitoring/metrics:
 *   post:
 *     summary: 記錄系統指標
 *     tags: [系統監控]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - metric_name
 *               - metric_type
 *               - value
 *               - service
 *             properties:
 *               metric_name:
 *                 type: string
 *               metric_type:
 *                 type: string
 *                 enum: [counter, gauge, histogram, summary]
 *               value:
 *                 type: number
 *               labels:
 *                 type: object
 *               service:
 *                 type: string
 *     responses:
 *       201:
 *         description: 記錄成功
 *       400:
 *         description: 請求參數錯誤
 *       401:
 *         description: 未授權
 *       500:
 *         description: 服務器錯誤
 */
router.post('/metrics', authenticateToken, monitoringController.recordMetric);

/**
 * @swagger
 * /api/v1/monitoring/dashboard:
 *   get:
 *     summary: 獲取監控儀表板數據
 *     tags: [系統監控]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [hour, day, week, month]
 *           default: day
 *         description: 時間週期
 *     responses:
 *       200:
 *         description: 獲取成功
 *       401:
 *         description: 未授權
 *       500:
 *         description: 服務器錯誤
 */
router.get('/dashboard', authenticateToken, monitoringController.getDashboard);

/**
 * @swagger
 * /api/v1/monitoring/alerts:
 *   get:
 *     summary: 獲取系統警報
 *     tags: [系統監控]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, resolved, acknowledged]
 *         description: 警報狀態
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *           enum: [low, medium, high, critical]
 *         description: 警報嚴重程度
 *     responses:
 *       200:
 *         description: 獲取成功
 *       401:
 *         description: 未授權
 *       500:
 *         description: 服務器錯誤
 */
router.get('/alerts', authenticateToken, monitoringController.getAlerts);

/**
 * @swagger
 * /api/v1/monitoring/health:
 *   get:
 *     summary: 獲取服務健康狀態
 *     tags: [系統監控]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 獲取成功
 *       401:
 *         description: 未授權
 *       500:
 *         description: 服務器錯誤
 */
router.get('/health', authenticateToken, monitoringController.getServiceHealth);

/**
 * @swagger
 * /api/v1/monitoring/performance:
 *   get:
 *     summary: 獲取性能指標
 *     tags: [系統監控]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [hour, day, week, month]
 *           default: day
 *         description: 時間週期
 *     responses:
 *       200:
 *         description: 獲取成功
 *       401:
 *         description: 未授權
 *       500:
 *         description: 服務器錯誤
 */
router.get('/performance', authenticateToken, monitoringController.getPerformance);

module.exports = router;
