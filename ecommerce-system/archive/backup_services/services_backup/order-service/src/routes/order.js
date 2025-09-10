const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { verifyToken, requirePermission } = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     OrderItem:
 *       type: object
 *       required:
 *         - productId
 *         - name
 *         - price
 *         - quantity
 *       properties:
 *         productId:
 *           type: string
 *           description: 商品 ID
 *         name:
 *           type: string
 *           description: 商品名稱
 *         price:
 *           type: number
 *           description: 單價
 *         quantity:
 *           type: integer
 *           description: 數量
 *         attributes:
 *           type: object
 *           description: 商品屬性
 *     
 *     Address:
 *       type: object
 *       required:
 *         - name
 *         - phone
 *         - city
 *         - district
 *         - address
 *         - zipCode
 *       properties:
 *         name:
 *           type: string
 *           description: 收件人姓名
 *         phone:
 *           type: string
 *           description: 聯絡電話
 *         country:
 *           type: string
 *           default: Taiwan
 *           description: 國家
 *         city:
 *           type: string
 *           description: 城市
 *         district:
 *           type: string
 *           description: 區域
 *         address:
 *           type: string
 *           description: 詳細地址
 *         zipCode:
 *           type: string
 *           description: 郵遞區號
 *     
 *     Payment:
 *       type: object
 *       required:
 *         - method
 *       properties:
 *         method:
 *           type: string
 *           enum: [credit_card, bank_transfer, cash_on_delivery]
 *           description: 付款方式
 *         transactionId:
 *           type: string
 *           description: 交易 ID
 *     
 *     Shipping:
 *       type: object
 *       required:
 *         - method
 *       properties:
 *         method:
 *           type: string
 *           enum: [home_delivery, convenience_store]
 *           description: 物流方式
 *         shippingFee:
 *           type: number
 *           description: 運費
 *         trackingNumber:
 *           type: string
 *           description: 追蹤號碼
 *     
 *     Order:
 *       type: object
 *       required:
 *         - userId
 *         - items
 *         - shippingAddress
 *         - billingAddress
 *         - payment
 *         - shipping
 *       properties:
 *         userId:
 *           type: string
 *           description: 用戶 ID
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderItem'
 *           description: 商品項目
 *         shippingAddress:
 *           $ref: '#/components/schemas/Address'
 *         billingAddress:
 *           $ref: '#/components/schemas/Address'
 *         payment:
 *           $ref: '#/components/schemas/Payment'
 *         shipping:
 *           $ref: '#/components/schemas/Shipping'
 *         notes:
 *           type: string
 *           description: 訂單備註
 *     
 *     OrderResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           $ref: '#/components/schemas/Order'
 *     
 *     OrderListResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         data:
 *           type: object
 *           properties:
 *             orders:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 *             pagination:
 *               type: object
 *               properties:
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 total:
 *                   type: integer
 *                 pages:
 *                   type: integer
 */

/**
 * @swagger
 * /api/v1/orders:
 *   get:
 *     summary: 取得訂單列表
 *     description: 取得所有訂單，支援分頁、篩選和排序
 *     tags: [Orders]
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
 *           default: 20
 *         description: 每頁數量
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, paid, shipped, delivered, cancelled, refunded]
 *         description: 訂單狀態篩選
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: 用戶 ID 篩選
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: 開始日期
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *         description: 結束日期
 *       - in: query
 *         name: orderNumber
 *         schema:
 *           type: string
 *         description: 訂單編號搜尋
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *         description: 排序欄位
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: 排序方向
 *     responses:
 *       200:
 *         description: 成功取得訂單列表
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrderListResponse'
 *       401:
 *         description: 未授權
 *       500:
 *         description: 伺服器錯誤
 */
router.get('/', verifyToken, requirePermission(['orders:read']), orderController.getOrders);

/**
 * @swagger
 * /api/v1/orders/{orderId}:
 *   get:
 *     summary: 取得單一訂單
 *     description: 根據訂單 ID 取得訂單詳情
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: 訂單 ID
 *     responses:
 *       200:
 *         description: 成功取得訂單
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrderResponse'
 *       404:
 *         description: 訂單不存在
 *       401:
 *         description: 未授權
 *       500:
 *         description: 伺服器錯誤
 */
// 特殊路由必須在 :orderId 路由之前
router.get('/statistics', verifyToken, requirePermission(['orders:read']), orderController.getOrderStatistics);
router.get('/stats', verifyToken, requirePermission(['orders:read']), orderController.getOrderStatistics);

/**
 * @swagger
 * /api/v1/orders/overview:
 *   get:
 *     summary: 取得訂單概覽
 *     description: 取得訂單概覽統計資料
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功取得概覽資料
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
 *                     today:
 *                       type: object
 *                       properties:
 *                         orders:
 *                           type: integer
 *                         revenue:
 *                           type: number
 *                     month:
 *                       type: object
 *                       properties:
 *                         orders:
 *                           type: integer
 *                         revenue:
 *                           type: number
 *                     year:
 *                       type: object
 *                       properties:
 *                         orders:
 *                           type: integer
 *                         revenue:
 *                           type: number
 *                     pendingOrders:
 *                       type: integer
 *                     recentOrders:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           orderNumber:
 *                             type: string
 *                           status:
 *                             type: string
 *                           total:
 *                             type: number
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *       401:
 *         description: 未授權
 *       500:
 *         description: 伺服器錯誤
 */
router.get('/overview', verifyToken, requirePermission(['orders:read']), orderController.getOrdersOverview);

router.get('/:orderId', verifyToken, requirePermission(['orders:read']), orderController.getOrder);

/**
 * @swagger
 * /api/v1/orders:
 *   post:
 *     summary: 建立新訂單
 *     description: 建立新的訂單
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Order'
 *     responses:
 *       201:
 *         description: 訂單建立成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrderResponse'
 *       400:
 *         description: 請求資料錯誤
 *       401:
 *         description: 未授權
 *       500:
 *         description: 伺服器錯誤
 */
router.post('/', verifyToken, requirePermission(['orders:write']), orderController.createOrder);

/**
 * @swagger
 * /api/v1/orders/{orderId}/status:
 *   put:
 *     summary: 更新訂單狀態
 *     description: 更新訂單狀態
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: 訂單 ID
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
 *                 enum: [pending, paid, shipped, delivered, cancelled, refunded]
 *                 description: 新狀態
 *               notes:
 *                 type: string
 *                 description: 備註
 *     responses:
 *       200:
 *         description: 狀態更新成功
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
 *                     orderId:
 *                       type: string
 *                     oldStatus:
 *                       type: string
 *                     newStatus:
 *                       type: string
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: 訂單不存在
 *       400:
 *         description: 無效的狀態
 *       401:
 *         description: 未授權
 *       500:
 *         description: 伺服器錯誤
 */
router.put('/:orderId/status', verifyToken, requirePermission(['orders:write']), orderController.updateOrderStatus);

/**
 * @swagger
 * /api/v1/orders/{orderId}/cancel:
 *   post:
 *     summary: 取消訂單
 *     description: 取消訂單
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: 訂單 ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: 取消原因
 *     responses:
 *       200:
 *         description: 訂單取消成功
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
 *                     orderId:
 *                       type: string
 *                     status:
 *                       type: string
 *                     cancelledAt:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: 訂單不存在
 *       400:
 *         description: 訂單狀態不允許取消
 *       401:
 *         description: 未授權
 *       500:
 *         description: 伺服器錯誤
 */
router.post('/:orderId/cancel', verifyToken, requirePermission(['orders:write']), orderController.cancelOrder);

/**
 * @swagger
 * /api/v1/orders/{orderId}/refund:
 *   post:
 *     summary: 退款處理
 *     description: 處理訂單退款
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: 訂單 ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
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
 *                     orderId:
 *                       type: string
 *                     refundAmount:
 *                       type: number
 *                     status:
 *                       type: string
 *                     refundedAt:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: 訂單不存在
 *       400:
 *         description: 訂單狀態不允許退款或退款金額錯誤
 *       401:
 *         description: 未授權
 *       500:
 *         description: 伺服器錯誤
 */
router.post('/:orderId/refund', verifyToken, requirePermission(['orders:write']), orderController.refundOrder);

/**
 * @swagger
 * /api/v1/orders/statistics:
 *   get:
 *     summary: 取得訂單統計
 *     description: 取得訂單統計資料
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month, year]
 *           default: month
 *         description: 統計期間
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: 開始日期
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *         description: 結束日期
 *     responses:
 *       200:
 *         description: 成功取得統計資料
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
 *                     totalOrders:
 *                       type: integer
 *                     totalRevenue:
 *                       type: number
 *                     statusCounts:
 *                       type: object
 *                     dailyStats:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           sales:
 *                             type: number
 *                           orders:
 *                             type: integer
 *       401:
 *         description: 未授權
 *       500:
 *         description: 伺服器錯誤
 */
module.exports = router;
