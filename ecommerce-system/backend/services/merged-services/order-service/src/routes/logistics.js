const express = require('express');
const logisticsController = require('../controllers/logisticsController');
const { validateLogistics } = require('../middleware/validation');
const { authenticateToken, authorize } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Logistics:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         order_id:
 *           type: string
 *         shipping_method:
 *           type: string
 *         carrier:
 *           type: string
 *         tracking_number:
 *           type: string
 *         status:
 *           type: string
 *           enum: [pending, picked_up, in_transit, out_for_delivery, delivered, failed, returned]
 *         shipping_address:
 *           type: object
 *         estimated_delivery:
 *           type: string
 *           format: date-time
 *         actual_delivery:
 *           type: string
 *           format: date-time
 *         shipping_cost:
 *           type: number
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/v1/logistics:
 *   get:
 *     summary: 獲取物流記錄列表
 *     tags: [物流管理]
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
router.get('/', authenticateToken, logisticsController.getLogistics);

/**
 * @swagger
 * /api/v1/logistics/{logisticsId}:
 *   get:
 *     summary: 獲取物流記錄詳情
 *     tags: [物流管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: logisticsId
 *         required: true
 *         schema:
 *           type: string
 *         description: 物流記錄ID
 *     responses:
 *       200:
 *         description: 獲取成功
 *       401:
 *         description: 未授權
 *       404:
 *         description: 物流記錄不存在
 *       500:
 *         description: 服務器錯誤
 */
router.get('/:logisticsId', authenticateToken, logisticsController.getLogisticsById);

/**
 * @swagger
 * /api/v1/logistics:
 *   post:
 *     summary: 創建物流記錄
 *     tags: [物流管理]
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
 *               - shipping_method
 *               - carrier
 *               - shipping_address
 *             properties:
 *               order_id:
 *                 type: string
 *               shipping_method:
 *                 type: string
 *               carrier:
 *                 type: string
 *               tracking_number:
 *                 type: string
 *               shipping_address:
 *                 type: object
 *               estimated_delivery:
 *                 type: string
 *                 format: date-time
 *               shipping_cost:
 *                 type: number
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
router.post('/', authenticateToken, authorize(['admin', 'manager']), validateLogistics.create, logisticsController.createLogistics);

/**
 * @swagger
 * /api/v1/logistics/{logisticsId}/status:
 *   put:
 *     summary: 更新物流狀態
 *     tags: [物流管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: logisticsId
 *         required: true
 *         schema:
 *           type: string
 *         description: 物流記錄ID
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
 *                 enum: [pending, picked_up, in_transit, out_for_delivery, delivered, failed, returned]
 *               tracking_data:
 *                 type: object
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
 *         description: 物流記錄不存在
 *       500:
 *         description: 服務器錯誤
 */
router.put('/:logisticsId/status', authenticateToken, authorize(['admin', 'manager']), logisticsController.updateLogisticsStatus);

/**
 * @swagger
 * /api/v1/logistics/track/{trackingNumber}:
 *   get:
 *     summary: 追蹤物流狀態
 *     tags: [物流管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: trackingNumber
 *         required: true
 *         schema:
 *           type: string
 *         description: 追蹤號碼
 *     responses:
 *       200:
 *         description: 追蹤成功
 *       401:
 *         description: 未授權
 *       404:
 *         description: 物流記錄不存在
 *       500:
 *         description: 服務器錯誤
 */
router.get('/track/:trackingNumber', authenticateToken, logisticsController.trackLogistics);

/**
 * @swagger
 * /api/v1/logistics/statistics:
 *   get:
 *     summary: 獲取物流統計
 *     tags: [物流管理]
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
router.get('/statistics', authenticateToken, authorize(['admin', 'manager']), logisticsController.getLogisticsStatistics);

module.exports = router;
