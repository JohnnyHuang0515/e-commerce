const express = require('express');
const notificationController = require('../controllers/notificationController');
const { validateNotification } = require('../middleware/validation');
const { authenticateToken, authorize } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       properties:
 *         user_id:
 *           type: string
 *         type:
 *           type: string
 *         title:
 *           type: string
 *         message:
 *           type: string
 *         data:
 *           type: object
 *         status:
 *           type: string
 *         priority:
 *           type: string
 *         scheduled_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/v1/notifications:
 *   get:
 *     summary: 獲取通知列表
 *     tags: [通知管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, sent, delivered, failed, read]
 *         description: 通知狀態
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [email, sms, push, in_app, webhook]
 *         description: 通知類型
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, normal, high, urgent]
 *         description: 通知優先級
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
router.get('/', authenticateToken, notificationController.getNotifications);

/**
 * @swagger
 * /api/v1/notifications:
 *   post:
 *     summary: 創建通知
 *     tags: [通知管理]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - type
 *               - title
 *               - message
 *             properties:
 *               user_id:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [email, sms, push, in_app, webhook]
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               data:
 *                 type: object
 *               priority:
 *                 type: string
 *                 enum: [low, normal, high, urgent]
 *                 default: normal
 *               scheduled_at:
 *                 type: string
 *                 format: date-time
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
router.post('/', authenticateToken, validateNotification.create, notificationController.createNotification);

/**
 * @swagger
 * /api/v1/notifications/bulk:
 *   post:
 *     summary: 批量創建通知
 *     tags: [通知管理]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_ids
 *               - type
 *               - title
 *               - message
 *             properties:
 *               user_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *               type:
 *                 type: string
 *                 enum: [email, sms, push, in_app, webhook]
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               data:
 *                 type: object
 *               priority:
 *                 type: string
 *                 enum: [low, normal, high, urgent]
 *                 default: normal
 *               scheduled_at:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: 批量創建成功
 *       400:
 *         description: 請求參數錯誤
 *       401:
 *         description: 未授權
 *       500:
 *         description: 服務器錯誤
 */
router.post('/bulk', authenticateToken, validateNotification.bulkCreate, notificationController.createBulkNotifications);

/**
 * @swagger
 * /api/v1/notifications/{notificationId}:
 *   get:
 *     summary: 獲取通知詳情
 *     tags: [通知管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *         description: 通知ID
 *     responses:
 *       200:
 *         description: 獲取成功
 *       401:
 *         description: 未授權
 *       404:
 *         description: 通知不存在
 *       500:
 *         description: 服務器錯誤
 */
router.get('/:notificationId', authenticateToken, notificationController.getNotification);

/**
 * @swagger
 * /api/v1/notifications/{notificationId}:
 *   put:
 *     summary: 更新通知
 *     tags: [通知管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *         description: 通知ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               data:
 *                 type: object
 *               priority:
 *                 type: string
 *                 enum: [low, normal, high, urgent]
 *               scheduled_at:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: 更新成功
 *       400:
 *         description: 請求參數錯誤
 *       401:
 *         description: 未授權
 *       404:
 *         description: 通知不存在
 *       500:
 *         description: 服務器錯誤
 */
router.put('/:notificationId', authenticateToken, validateNotification.update, notificationController.updateNotification);

/**
 * @swagger
 * /api/v1/notifications/{notificationId}:
 *   delete:
 *     summary: 刪除通知
 *     tags: [通知管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *         description: 通知ID
 *     responses:
 *       200:
 *         description: 刪除成功
 *       401:
 *         description: 未授權
 *       404:
 *         description: 通知不存在
 *       500:
 *         description: 服務器錯誤
 */
router.delete('/:notificationId', authenticateToken, authorize(['ADMIN', 'MANAGER']), notificationController.deleteNotification);

/**
 * @swagger
 * /api/v1/notifications/{notificationId}/send:
 *   post:
 *     summary: 發送通知
 *     tags: [通知管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *         description: 通知ID
 *     responses:
 *       200:
 *         description: 發送成功
 *       401:
 *         description: 未授權
 *       404:
 *         description: 通知不存在
 *       500:
 *         description: 服務器錯誤
 */
router.post('/:notificationId/send', authenticateToken, authorize(['ADMIN', 'MANAGER']), notificationController.sendNotification);

/**
 * @swagger
 * /api/v1/notifications/{notificationId}/mark-read:
 *   post:
 *     summary: 標記通知為已讀
 *     tags: [通知管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *         description: 通知ID
 *     responses:
 *       200:
 *         description: 標記成功
 *       401:
 *         description: 未授權
 *       404:
 *         description: 通知不存在
 *       500:
 *         description: 服務器錯誤
 */
router.post('/:notificationId/mark-read', authenticateToken, notificationController.markAsRead);

/**
 * @swagger
 * /api/v1/notifications/templates:
 *   get:
 *     summary: 獲取通知模板
 *     tags: [通知管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [email, sms, push, in_app]
 *         description: 模板類型
 *     responses:
 *       200:
 *         description: 獲取成功
 *       401:
 *         description: 未授權
 *       500:
 *         description: 服務器錯誤
 */
router.get('/templates', authenticateToken, notificationController.getTemplates);

/**
 * @swagger
 * /api/v1/notifications/analytics:
 *   get:
 *     summary: 獲取通知分析
 *     tags: [通知管理]
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
 *     responses:
 *       200:
 *         description: 獲取成功
 *       401:
 *         description: 未授權
 *       500:
 *         description: 服務器錯誤
 */
router.get('/analytics', authenticateToken, notificationController.getAnalytics);

module.exports = router;
