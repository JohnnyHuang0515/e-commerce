const express = require('express');
const systemController = require('../controllers/systemController');
const dashboardController = require('../controllers/dashboardController');
const { validateSystem } = require('../middleware/validation');
const { authenticateToken, authorize } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     SystemConfig:
 *       type: object
 *       properties:
 *         key:
 *           type: string
 *         value:
 *           type: string
 *         type:
 *           type: string
 *         description:
 *           type: string
 *         category:
 *           type: string
 *         is_public:
 *           type: boolean
 */

/**
 * @swagger
 * /api/v1/system/configs:
 *   get:
 *     summary: 獲取系統配置列表
 *     tags: [系統管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: 配置分類
 *       - in: query
 *         name: is_public
 *         schema:
 *           type: boolean
 *         description: 是否公開
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
router.get('/configs', authenticateToken, authorize(['admin', 'manager']), systemController.getConfigs);

/**
 * @swagger
 * /api/v1/system/configs:
 *   post:
 *     summary: 創建系統配置
 *     tags: [系統管理]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - key
 *               - value
 *             properties:
 *               key:
 *                 type: string
 *               value:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [string, number, boolean, object, array]
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [general, email, notification, security, performance, feature]
 *               is_public:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: 創建成功
 *       400:
 *         description: 請求參數錯誤
 *       401:
 *         description: 未授權
 *       500:
 *         description: 服務器錯誤
 */
router.post('/configs', authenticateToken, authorize(['admin']), validateSystem.config, systemController.createConfig);

/**
 * @swagger
 * /api/v1/system/configs/{key}:
 *   get:
 *     summary: 獲取系統配置詳情
 *     tags: [系統管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: 配置鍵
 *     responses:
 *       200:
 *         description: 獲取成功
 *       401:
 *         description: 未授權
 *       404:
 *         description: 配置不存在
 *       500:
 *         description: 服務器錯誤
 */
router.get('/configs/:key', authenticateToken, authorize(['admin', 'manager']), systemController.getConfig);

/**
 * @swagger
 * /api/v1/system/configs/{key}:
 *   put:
 *     summary: 更新系統配置
 *     tags: [系統管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: 配置鍵
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               value:
 *                 type: string
 *               description:
 *                 type: string
 *               is_public:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: 更新成功
 *       400:
 *         description: 請求參數錯誤
 *       401:
 *         description: 未授權
 *       404:
 *         description: 配置不存在
 *       500:
 *         description: 服務器錯誤
 */
router.put('/configs/:key', authenticateToken, authorize(['admin']), validateSystem.updateConfig, systemController.updateConfig);

/**
 * @swagger
 * /api/v1/system/configs/{key}:
 *   delete:
 *     summary: 刪除系統配置
 *     tags: [系統管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: 配置鍵
 *     responses:
 *       200:
 *         description: 刪除成功
 *       401:
 *         description: 未授權
 *       404:
 *         description: 配置不存在
 *       500:
 *         description: 服務器錯誤
 */
router.delete('/configs/:key', authenticateToken, authorize(['admin']), systemController.deleteConfig);

/**
 * @swagger
 * /api/v1/system/status:
 *   get:
 *     summary: 獲取系統狀態
 *     tags: [系統管理]
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
router.get('/status', authenticateToken, systemController.getSystemStatus);

/**
 * @swagger
 * /api/v1/system/info:
 *   get:
 *     summary: 獲取系統信息
 *     tags: [系統管理]
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
router.get('/info', authenticateToken, systemController.getSystemInfo);

// Dashboard 路由
/**
 * @swagger
 * /api/v1/system/dashboard/overview:
 *   get:
 *     summary: 獲取儀表板概覽
 *     tags: [儀表板]
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
router.get('/dashboard/overview', authenticateToken, authorize(['admin', 'manager']), dashboardController.getOverview);

/**
 * @swagger
 * /api/v1/system/dashboard/realtime:
 *   get:
 *     summary: 獲取實時數據
 *     tags: [儀表板]
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
router.get('/dashboard/realtime', authenticateToken, authorize(['admin', 'manager']), dashboardController.getRealtime);

/**
 * @swagger
 * /api/v1/system/dashboard/analytics:
 *   get:
 *     summary: 獲取分析數據
 *     tags: [儀表板]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [day, week, month, year]
 *         description: 時間週期
 *     responses:
 *       200:
 *         description: 獲取成功
 *       401:
 *         description: 未授權
 *       500:
 *         description: 服務器錯誤
 */
router.get('/dashboard/analytics', authenticateToken, authorize(['admin', 'manager']), dashboardController.getAnalytics);

module.exports = router;
