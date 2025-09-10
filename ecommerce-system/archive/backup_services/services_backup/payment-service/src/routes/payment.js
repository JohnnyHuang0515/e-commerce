const express = require('express');
const router = express.Router();
const {
  createPayment,
  confirmPayment,
  cancelPayment,
  processRefund,
  getPayment,
  getPayments,
  handleWebhook,
} = require('../controllers/paymentController');

/**
 * @swagger
 * components:
 *   schemas:
 *     Payment:
 *       type: object
 *       properties:
 *         paymentId:
 *           type: string
 *           description: 支付 ID
 *         orderId:
 *           type: string
 *           description: 訂單 ID
 *         userId:
 *           type: string
 *           description: 用戶 ID
 *         paymentInfo:
 *           type: object
 *           properties:
 *             method:
 *               type: string
 *               enum: [credit_card, bank_transfer, cash_on_delivery, stripe, paypal, line_pay]
 *             provider:
 *               type: string
 *               enum: [stripe, paypal, line_pay, bank, cash]
 *             amount:
 *               type: number
 *             currency:
 *               type: string
 *               default: TWD
 *             status:
 *               type: string
 *               enum: [pending, processing, success, failed, cancelled, refunded, partially_refunded]
 *             transactionId:
 *               type: string
 *             externalTransactionId:
 *               type: string
 *         expiresAt:
 *           type: string
 *           format: date-time
 *         paidAt:
 *           type: string
 *           format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/v1/payments:
 *   post:
 *     summary: 建立支付
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *               - userId
 *               - amount
 *               - method
 *             properties:
 *               orderId:
 *                 type: string
 *                 description: 訂單 ID
 *               userId:
 *                 type: string
 *                 description: 用戶 ID
 *               amount:
 *                 type: number
 *                 description: 支付金額
 *               currency:
 *                 type: string
 *                 default: TWD
 *               method:
 *                 type: string
 *                 enum: [stripe, paypal, line_pay, bank_transfer, cash_on_delivery]
 *                 description: 支付方式
 *               metadata:
 *                 type: object
 *                 description: 額外資料
 *     responses:
 *       201:
 *         description: 支付建立成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     paymentId:
 *                       type: string
 *                     paymentInfo:
 *                       $ref: '#/components/schemas/Payment/properties/paymentInfo'
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *                     gatewayData:
 *                       type: object
 *       400:
 *         description: 請求參數錯誤
 *       500:
 *         description: 伺服器錯誤
 */
router.post('/', createPayment);

/**
 * @swagger
 * /api/v1/payments:
 *   get:
 *     summary: 取得支付列表
 *     tags: [Payments]
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
 *           enum: [pending, processing, success, failed, cancelled, refunded, partially_refunded]
 *         description: 支付狀態
 *       - in: query
 *         name: method
 *         schema:
 *           type: string
 *           enum: [stripe, paypal, line_pay, bank_transfer, cash_on_delivery]
 *         description: 支付方式
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: 用戶 ID
 *       - in: query
 *         name: orderId
 *         schema:
 *           type: string
 *         description: 訂單 ID
 *     responses:
 *       200:
 *         description: 支付列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     payments:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Payment'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         pages:
 *                           type: integer
 *       500:
 *         description: 伺服器錯誤
 */
router.get('/', getPayments);

/**
 * @swagger
 * /api/v1/payments/{paymentId}:
 *   get:
 *     summary: 取得支付詳情
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *         description: 支付 ID
 *     responses:
 *       200:
 *         description: 支付詳情
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Payment'
 *       404:
 *         description: 支付記錄不存在
 *       500:
 *         description: 伺服器錯誤
 */
router.get('/:paymentId', getPayment);

/**
 * @swagger
 * /api/v1/payments/{paymentId}/confirm:
 *   post:
 *     summary: 確認支付
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *         description: 支付 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               transactionId:
 *                 type: string
 *                 description: 外部交易 ID
 *               amount:
 *                 type: number
 *                 description: 支付金額
 *               currency:
 *                 type: string
 *                 description: 貨幣
 *     responses:
 *       200:
 *         description: 支付確認成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     paymentId:
 *                       type: string
 *                     status:
 *                       type: string
 *                     paidAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: 支付確認失敗
 *       404:
 *         description: 支付記錄不存在
 *       500:
 *         description: 伺服器錯誤
 */
router.post('/:paymentId/confirm', confirmPayment);

/**
 * @swagger
 * /api/v1/payments/{paymentId}/cancel:
 *   post:
 *     summary: 取消支付
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *         description: 支付 ID
 *     responses:
 *       200:
 *         description: 支付取消成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     paymentId:
 *                       type: string
 *                     status:
 *                       type: string
 *                     cancelledAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: 無法取消支付
 *       404:
 *         description: 支付記錄不存在
 *       500:
 *         description: 伺服器錯誤
 */
router.post('/:paymentId/cancel', cancelPayment);

/**
 * @swagger
 * /api/v1/payments/{paymentId}/refund:
 *   post:
 *     summary: 處理退款
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *         description: 支付 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - reason
 *             properties:
 *               amount:
 *                 type: number
 *                 description: 退款金額
 *               reason:
 *                 type: string
 *                 description: 退款原因
 *     responses:
 *       200:
 *         description: 退款處理成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     refundId:
 *                       type: string
 *                     amount:
 *                       type: number
 *                     status:
 *                       type: string
 *                     processedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: 退款處理失敗
 *       404:
 *         description: 支付記錄不存在
 *       500:
 *         description: 伺服器錯誤
 */
router.post('/:paymentId/refund', processRefund);

/**
 * @swagger
 * /api/v1/payments/webhook/{provider}:
 *   post:
 *     summary: 處理支付 Webhook
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: provider
 *         required: true
 *         schema:
 *           type: string
 *           enum: [stripe, paypal, line_pay]
 *         description: 支付提供者
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Webhook 事件資料
 *     responses:
 *       200:
 *         description: Webhook 處理成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Webhook 驗證失敗
 *       500:
 *         description: 伺服器錯誤
 */
router.post('/webhook/:provider', handleWebhook);

module.exports = router;
