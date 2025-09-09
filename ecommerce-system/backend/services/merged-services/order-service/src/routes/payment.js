const express = require('express');
const paymentController = require('../controllers/paymentController');
const { validatePayment } = require('../middleware/validation');
const { authenticateToken, authorize } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Payment:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         order_id:
 *           type: string
 *         payment_method:
 *           type: string
 *         payment_provider:
 *           type: string
 *         external_payment_id:
 *           type: string
 *         amount:
 *           type: number
 *         currency:
 *           type: string
 *         status:
 *           type: string
 *           enum: [pending, processing, completed, failed, cancelled, refunded]
 *         transaction_id:
 *           type: string
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/v1/payments:
 *   get:
 *     summary: 獲取支付記錄列表
 *     tags: [支付管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: 狀態篩選
 *       - in: query
 *         name: order_id
 *         schema:
 *           type: string
 *         description: 訂單ID篩選
 *     responses:
 *       200:
 *         description: 獲取成功
 *       401:
 *         description: 未授權
 *       500:
 *         description: 服務器錯誤
 */
router.get('/', authenticateToken, paymentController.getPayments);

/**
 * @swagger
 * /api/v1/payments/{paymentId}:
 *   get:
 *     summary: 獲取支付記錄詳情
 *     tags: [支付管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *         description: 支付記錄ID
 *     responses:
 *       200:
 *         description: 獲取成功
 *       401:
 *         description: 未授權
 *       404:
 *         description: 支付記錄不存在
 *       500:
 *         description: 服務器錯誤
 */
router.get('/:paymentId', authenticateToken, paymentController.getPaymentById);

/**
 * @swagger
 * /api/v1/payments:
 *   post:
 *     summary: 創建支付記錄
 *     tags: [支付管理]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - order_id
 *               - payment_method
 *               - payment_provider
 *               - amount
 *             properties:
 *               order_id:
 *                 type: string
 *               payment_method:
 *                 type: string
 *               payment_provider:
 *                 type: string
 *               amount:
 *                 type: number
 *               currency:
 *                 type: string
 *                 default: TWD
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
router.post('/', authenticateToken, validatePayment.create, paymentController.createPayment);

/**
 * @swagger
 * /api/v1/payments/{paymentId}/process:
 *   post:
 *     summary: 處理支付
 *     tags: [支付管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *         description: 支付記錄ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               payment_data:
 *                 type: object
 *     responses:
 *       200:
 *         description: 處理成功
 *       400:
 *         description: 請求參數錯誤
 *       401:
 *         description: 未授權
 *       404:
 *         description: 支付記錄不存在
 *       500:
 *         description: 服務器錯誤
 */
router.post('/:paymentId/process', authenticateToken, paymentController.processPayment);

/**
 * @swagger
 * /api/v1/payments/{paymentId}/refund:
 *   post:
 *     summary: 處理退款
 *     tags: [支付管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *         description: 支付記錄ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refund_amount
 *               - reason
 *             properties:
 *               refund_amount:
 *                 type: number
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: 退款成功
 *       400:
 *         description: 請求參數錯誤
 *       401:
 *         description: 未授權
 *       404:
 *         description: 支付記錄不存在
 *       500:
 *         description: 服務器錯誤
 */
router.post('/:paymentId/refund', authenticateToken, authorize(['ADMIN', 'MANAGER']), paymentController.processRefund);

/**
 * @swagger
 * /api/v1/payments/statistics:
 *   get:
 *     summary: 獲取支付統計
 *     tags: [支付管理]
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
router.get('/statistics', authenticateToken, authorize(['ADMIN', 'MANAGER']), paymentController.getPaymentStatistics);

module.exports = router;
