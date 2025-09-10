const express = require('express');
const router = express.Router();
const {
  createShipment,
  getShipment,
  getShipments,
  trackShipment,
  cancelShipment,
  calculateShippingCost,
  getShipmentStats,
} = require('../controllers/logisticsController');

/**
 * @swagger
 * components:
 *   schemas:
 *     Shipment:
 *       type: object
 *       properties:
 *         shipmentId:
 *           type: string
 *           description: 配送 ID
 *         orderId:
 *           type: string
 *           description: 訂單 ID
 *         userId:
 *           type: string
 *           description: 用戶 ID
 *         status:
 *           type: string
 *           enum: [pending, picked_up, in_transit, out_for_delivery, delivered, failed, returned, cancelled]
 *           description: 配送狀態
 *         shippingAddress:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *             phone:
 *               type: string
 *             city:
 *               type: string
 *             district:
 *               type: string
 *             address:
 *               type: string
 *             zipCode:
 *               type: string
 *         returnAddress:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *             phone:
 *               type: string
 *             city:
 *               type: string
 *             district:
 *               type: string
 *             address:
 *               type: string
 *             zipCode:
 *               type: string
 *         packageInfo:
 *           type: object
 *           properties:
 *             weight:
 *               type: number
 *             dimensions:
 *               type: object
 *               properties:
 *                 length:
 *                   type: number
 *                 width:
 *                   type: number
 *                 height:
 *                   type: number
 *             value:
 *               type: number
 *             description:
 *               type: string
 *         shippingInfo:
 *           type: object
 *           properties:
 *             method:
 *               type: string
 *               enum: [home_delivery, convenience_store, post_office, express, standard]
 *             provider:
 *               type: string
 *               enum: [black_cat, post_office, convenience_store, express]
 *             trackingNumber:
 *               type: string
 *             estimatedDelivery:
 *               type: string
 *               format: date-time
 *         costInfo:
 *           type: object
 *           properties:
 *             baseFee:
 *               type: number
 *             weightFee:
 *               type: number
 *             distanceFee:
 *               type: number
 *             specialFee:
 *               type: number
 *             totalFee:
 *               type: number
 *             currency:
 *               type: string
 *         trackingEvents:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *               description:
 *                 type: string
 *               location:
 *                 type: string
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/v1/logistics/shipments:
 *   post:
 *     summary: 建立配送
 *     tags: [Logistics]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *               - userId
 *               - shippingAddress
 *               - returnAddress
 *               - packageInfo
 *               - shippingMethod
 *             properties:
 *               orderId:
 *                 type: string
 *                 description: 訂單 ID
 *               userId:
 *                 type: string
 *                 description: 用戶 ID
 *               shippingAddress:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   phone:
 *                     type: string
 *                   city:
 *                     type: string
 *                   district:
 *                     type: string
 *                   address:
 *                     type: string
 *                   zipCode:
 *                     type: string
 *               returnAddress:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   phone:
 *                     type: string
 *                   city:
 *                     type: string
 *                   district:
 *                     type: string
 *                   address:
 *                     type: string
 *                   zipCode:
 *                     type: string
 *               packageInfo:
 *                 type: object
 *                 properties:
 *                   weight:
 *                     type: number
 *                   dimensions:
 *                     type: object
 *                     properties:
 *                       length:
 *                         type: number
 *                       width:
 *                         type: number
 *                       height:
 *                         type: number
 *                   value:
 *                     type: number
 *                   description:
 *                     type: string
 *               shippingMethod:
 *                 type: string
 *                 enum: [home_delivery, convenience_store, post_office, express, standard]
 *                 description: 配送方式
 *               specialInstructions:
 *                 type: string
 *                 description: 特殊指示
 *               insurance:
 *                 type: object
 *                 properties:
 *                   enabled:
 *                     type: boolean
 *                   amount:
 *                     type: number
 *               signatureRequired:
 *                 type: boolean
 *                 default: true
 *               fragile:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: 配送建立成功
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
 *                     shipmentId:
 *                       type: string
 *                     trackingNumber:
 *                       type: string
 *                     estimatedDelivery:
 *                       type: string
 *                       format: date-time
 *                     cost:
 *                       type: number
 *                     provider:
 *                       type: string
 *                     providerData:
 *                       type: object
 *       400:
 *         description: 請求參數錯誤
 *       500:
 *         description: 伺服器錯誤
 */
router.post('/shipments', createShipment);

/**
 * @swagger
 * /api/v1/logistics/shipments:
 *   get:
 *     summary: 取得配送列表
 *     tags: [Logistics]
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
 *           enum: [pending, picked_up, in_transit, out_for_delivery, delivered, failed, returned, cancelled]
 *         description: 配送狀態
 *       - in: query
 *         name: method
 *         schema:
 *           type: string
 *           enum: [home_delivery, convenience_store, post_office, express, standard]
 *         description: 配送方式
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
 *         description: 配送列表
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
 *                     shipments:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Shipment'
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
router.get('/shipments', getShipments);

/**
 * @swagger
 * /api/v1/logistics/shipments/{shipmentId}:
 *   get:
 *     summary: 取得配送詳情
 *     tags: [Logistics]
 *     parameters:
 *       - in: path
 *         name: shipmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: 配送 ID
 *     responses:
 *       200:
 *         description: 配送詳情
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Shipment'
 *       404:
 *         description: 配送記錄不存在
 *       500:
 *         description: 伺服器錯誤
 */
router.get('/shipments/:shipmentId', getShipment);

/**
 * @swagger
 * /api/v1/logistics/shipments/{shipmentId}/track:
 *   get:
 *     summary: 追蹤配送
 *     tags: [Logistics]
 *     parameters:
 *       - in: path
 *         name: shipmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: 配送 ID
 *     responses:
 *       200:
 *         description: 追蹤資訊
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
 *                     shipmentId:
 *                       type: string
 *                     status:
 *                       type: string
 *                     trackingNumber:
 *                       type: string
 *                     estimatedDelivery:
 *                       type: string
 *                       format: date-time
 *                     currentLocation:
 *                       type: string
 *                     events:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           status:
 *                             type: string
 *                           description:
 *                             type: string
 *                           location:
 *                             type: string
 *                           timestamp:
 *                             type: string
 *                             format: date-time
 *                     latestEvent:
 *                       type: object
 *       400:
 *         description: 追蹤查詢失敗
 *       404:
 *         description: 配送記錄不存在
 *       500:
 *         description: 伺服器錯誤
 */
router.get('/shipments/:shipmentId/track', trackShipment);

/**
 * @swagger
 * /api/v1/logistics/shipments/{shipmentId}/cancel:
 *   post:
 *     summary: 取消配送
 *     tags: [Logistics]
 *     parameters:
 *       - in: path
 *         name: shipmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: 配送 ID
 *     requestBody:
 *       required: true
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
 *         description: 配送取消成功
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
 *                     shipmentId:
 *                       type: string
 *                     status:
 *                       type: string
 *                     cancelledAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: 無法取消配送
 *       404:
 *         description: 配送記錄不存在
 *       500:
 *         description: 伺服器錯誤
 */
router.post('/shipments/:shipmentId/cancel', cancelShipment);

/**
 * @swagger
 * /api/v1/logistics/calculate-cost:
 *   post:
 *     summary: 計算配送費用
 *     tags: [Logistics]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - packageInfo
 *               - shippingMethod
 *             properties:
 *               packageInfo:
 *                 type: object
 *                 properties:
 *                   weight:
 *                     type: number
 *                   dimensions:
 *                     type: object
 *                     properties:
 *                       length:
 *                         type: number
 *                       width:
 *                         type: number
 *                       height:
 *                         type: number
 *                   value:
 *                     type: number
 *                   description:
 *                     type: string
 *               shippingMethod:
 *                 type: string
 *                 enum: [home_delivery, convenience_store, post_office, express, standard]
 *               shippingAddress:
 *                 type: object
 *                 properties:
 *                   city:
 *                     type: string
 *                   district:
 *                     type: string
 *               returnAddress:
 *                 type: object
 *                 properties:
 *                   city:
 *                     type: string
 *                   district:
 *                     type: string
 *     responses:
 *       200:
 *         description: 費用計算成功
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
 *                     cost:
 *                       type: object
 *                       properties:
 *                         baseFee:
 *                           type: number
 *                         weightFee:
 *                           type: number
 *                         distanceFee:
 *                           type: number
 *                         specialFee:
 *                           type: number
 *                         totalFee:
 *                           type: number
 *                         currency:
 *                           type: string
 *                     estimatedDelivery:
 *                       type: string
 *                       format: date-time
 *                     shippingMethod:
 *                       type: string
 *       400:
 *         description: 請求參數錯誤
 *       500:
 *         description: 伺服器錯誤
 */
router.post('/calculate-cost', calculateShippingCost);

/**
 * @swagger
 * /api/v1/logistics/stats:
 *   get:
 *     summary: 取得配送統計
 *     tags: [Logistics]
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [day, week, month, year]
 *           default: month
 *         description: 統計週期
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 開始日期
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 結束日期
 *     responses:
 *       200:
 *         description: 配送統計
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
 *                     overview:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         pending:
 *                           type: integer
 *                         inTransit:
 *                           type: integer
 *                         delivered:
 *                           type: integer
 *                         failed:
 *                           type: integer
 *                         totalCost:
 *                           type: number
 *                         averageCost:
 *                           type: number
 *                         averageDeliveryDays:
 *                           type: number
 *                     methodStats:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           count:
 *                             type: integer
 *                           totalCost:
 *                             type: number
 *                     providerStats:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           count:
 *                             type: integer
 *                           totalCost:
 *                             type: number
 *                     period:
 *                       type: string
 *                     dateRange:
 *                       type: object
 *                       properties:
 *                         startDate:
 *                           type: string
 *                           format: date-time
 *                         endDate:
 *                           type: string
 *                           format: date-time
 *       500:
 *         description: 伺服器錯誤
 */
router.get('/stats', getShipmentStats);

module.exports = router;
