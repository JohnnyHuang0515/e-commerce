const express = require('express');
const logController = require('../controllers/logController');
const { authenticateToken, authorize } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     SystemLog:
 *       type: object
 *       properties:
 *         level:
 *           type: string
 *         message:
 *           type: string
 *         service:
 *           type: string
 *         module:
 *           type: string
 *         user_id:
 *           type: string
 *         request_id:
 *           type: string
 *         metadata:
 *           type: object
 *         stack_trace:
 *           type: string
 *         ip_address:
 *           type: string
 *         user_agent:
 *           type: string
 */

/**
 * @swagger
 * /api/v1/logs:
 *   get:
 *     summary: 獲取系統日誌
 *     tags: [日誌管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           enum: [error, warn, info, debug]
 *         description: 日誌級別
 *       - in: query
 *         name: service
 *         schema:
 *           type: string
 *         description: 服務名稱
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: string
 *         description: 用戶ID
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: 開始時間
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: 結束時間
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
 *           default: 50
 *         description: 每頁數量
 *     responses:
 *       200:
 *         description: 獲取成功
 *       401:
 *         description: 未授權
 *       500:
 *         description: 服務器錯誤
 */
router.get('/', authenticateToken, authorize(['ADMIN', 'MANAGER']), logController.getLogs);

/**
 * @swagger
 * /api/v1/logs:
 *   post:
 *     summary: 記錄系統日誌
 *     tags: [日誌管理]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - level
 *               - message
 *               - service
 *             properties:
 *               level:
 *                 type: string
 *                 enum: [error, warn, info, debug]
 *               message:
 *                 type: string
 *               service:
 *                 type: string
 *               module:
 *                 type: string
 *               user_id:
 *                 type: string
 *               request_id:
 *                 type: string
 *               metadata:
 *                 type: object
 *               stack_trace:
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
router.post('/', authenticateToken, logController.createLog);
router.post('/batch', authenticateToken, logController.createBatchLogs);

/**
 * @swagger
 * /api/v1/logs/export:
 *   post:
 *     summary: 導出日誌
 *     tags: [日誌管理]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               level:
 *                 type: string
 *                 enum: [error, warn, info, debug]
 *               service:
 *                 type: string
 *               start_date:
 *                 type: string
 *                 format: date-time
 *               end_date:
 *                 type: string
 *                 format: date-time
 *               format:
 *                 type: string
 *                 enum: [json, csv, txt]
 *                 default: json
 *     responses:
 *       200:
 *         description: 導出成功
 *       400:
 *         description: 請求參數錯誤
 *       401:
 *         description: 未授權
 *       500:
 *         description: 服務器錯誤
 */
router.post('/export', authenticateToken, authorize(['ADMIN', 'MANAGER']), logController.exportLogs);

/**
 * @swagger
 * /api/v1/logs/stats:
 *   get:
 *     summary: 獲取日誌統計
 *     tags: [日誌管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: 開始時間
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: 結束時間
 *       - in: query
 *         name: group_by
 *         schema:
 *           type: string
 *           enum: [level, service, hour, day]
 *           default: level
 *         description: 分組方式
 *     responses:
 *       200:
 *         description: 獲取成功
 *       401:
 *         description: 未授權
 *       500:
 *         description: 服務器錯誤
 */
router.get('/stats', authenticateToken, authorize(['ADMIN', 'MANAGER']), logController.getLogStats);

/**
 * @swagger
 * /api/v1/logs/cleanup:
 *   post:
 *     summary: 清理日誌
 *     tags: [日誌管理]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               older_than_days:
 *                 type: integer
 *                 default: 30
 *                 description: 清理多少天前的日誌
 *               level:
 *                 type: string
 *                 enum: [error, warn, info, debug]
 *                 description: 只清理指定級別的日誌
 *               service:
 *                 type: string
 *                 description: 只清理指定服務的日誌
 *     responses:
 *       200:
 *         description: 清理成功
 *       400:
 *         description: 請求參數錯誤
 *       401:
 *         description: 未授權
 *       500:
 *         description: 服務器錯誤
 */
router.post('/cleanup', authenticateToken, authorize(['admin']), logController.cleanupLogs);

/**
 * @swagger
 * /api/v1/logs/real-time:
 *   get:
 *     summary: 實時日誌流
 *     tags: [日誌管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: service
 *         schema:
 *           type: string
 *         description: 服務名稱
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           enum: [error, warn, info, debug]
 *         description: 日誌級別
 *     responses:
 *       200:
 *         description: 連接成功
 *       401:
 *         description: 未授權
 *       500:
 *         description: 服務器錯誤
 */
router.get('/real-time', authenticateToken, authorize(['ADMIN', 'MANAGER']), logController.getRealTimeLogs);

module.exports = router;
