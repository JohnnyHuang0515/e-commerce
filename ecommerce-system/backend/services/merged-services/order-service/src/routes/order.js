const express = require('express');
const orderController = require('../controllers/orderController');
const { validateOrder } = require('../middleware/validation');
const { authenticateToken, authorize } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Order:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         order_number:
 *           type: string
 *         user_id:
 *           type: string
 *         status:
 *           type: string
 *           enum: [pending, paid, processing, shipped, delivered, cancelled, refunded]
 *         total_amount:
 *           type: number
 *         subtotal:
 *           type: number
 *         tax_amount:
 *           type: number
 *         shipping_amount:
 *           type: number
 *         discount_amount:
 *           type: number
 *         currency:
 *           type: string
 *         shipping_address:
 *           type: object
 *         billing_address:
 *           type: object
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/v1/orders:
 *   get:
 *     summary: 獲取訂單列表
 *     tags: [訂單管理]
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
 *         name: user_id
 *         schema:
 *           type: string
 *         description: 用戶ID篩選
 *     responses:
 *       200:
 *         description: 獲取成功
 *       401:
 *         description: 未授權
 *       500:
 *         description: 服務器錯誤
 */
router.get('/', authenticateToken, orderController.getOrders);

/**
 * @swagger
 * /api/v1/orders/{orderId}:
 *   get:
 *     summary: 獲取訂單詳情
 *     tags: [訂單管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: 訂單ID
 *     responses:
 *       200:
 *         description: 獲取成功
 *       401:
 *         description: 未授權
 *       404:
 *         description: 訂單不存在
 *       500:
 *         description: 服務器錯誤
 */
router.get('/:orderId', authenticateToken, orderController.getOrderById);

/**
 * @swagger
 * /api/v1/orders:
 *   post:
 *     summary: 創建新訂單
 *     tags: [訂單管理]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *               - shipping_address
 *               - billing_address
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     product_id:
 *                       type: string
 *                     quantity:
 *                       type: integer
 *               shipping_address:
 *                 type: object
 *               billing_address:
 *                 type: object
 *               notes:
 *                 type: string
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
router.post('/', authenticateToken, validateOrder.create, orderController.createOrder);

/**
 * @swagger
 * /api/v1/orders/{orderId}/status:
 *   put:
 *     summary: 更新訂單狀態
 *     tags: [訂單管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: 訂單ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, paid, processing, shipped, delivered, cancelled, refunded]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: 更新成功
 *       400:
 *         description: 請求參數錯誤
 *       401:
 *         description: 未授權
 *       404:
 *         description: 訂單不存在
 *       500:
 *         description: 服務器錯誤
 */
router.put('/:orderId/status', authenticateToken, authorize(['ADMIN', 'MANAGER']), orderController.updateOrderStatus);

/**
 * @swagger
 * /api/v1/orders/{orderId}/cancel:
 *   post:
 *     summary: 取消訂單
 *     tags: [訂單管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: 訂單ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: 取消成功
 *       400:
 *         description: 請求參數錯誤
 *       401:
 *         description: 未授權
 *       404:
 *         description: 訂單不存在
 *       500:
 *         description: 服務器錯誤
 */
router.post('/:orderId/cancel', authenticateToken, orderController.cancelOrder);

/**
 * @swagger
 * /api/v1/orders/{orderId}/refund:
 *   post:
 *     summary: 退款處理
 *     tags: [訂單管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: 訂單ID
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
 *         description: 訂單不存在
 *       500:
 *         description: 服務器錯誤
 */
router.post('/:orderId/refund', authenticateToken, authorize(['ADMIN', 'MANAGER']), orderController.processRefund);

/**
 * @swagger
 * /api/v1/orders/statistics:
 *   get:
 *     summary: 獲取訂單統計
 *     tags: [訂單管理]
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
router.get('/statistics', authenticateToken, authorize(['ADMIN', 'MANAGER']), orderController.getOrderStatistics);

/**
 * @swagger
 * /api/v1/orders/overview:
 *   get:
 *     summary: 獲取訂單概覽
 *     tags: [訂單管理]
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
router.get('/overview', authenticateToken, authorize(['ADMIN', 'MANAGER']), orderController.getOrderOverview);

module.exports = router;
