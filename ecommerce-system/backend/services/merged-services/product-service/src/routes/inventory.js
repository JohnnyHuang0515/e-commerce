const express = require('express');
const inventoryController = require('../controllers/inventoryController');
const { validateInventory } = require('../middleware/validation');
const { authenticateToken, authorize } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Inventory:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         product_id:
 *           type: string
 *         sku:
 *           type: string
 *         quantity:
 *           type: integer
 *         reserved_quantity:
 *           type: integer
 *         reorder_point:
 *           type: integer
 *         status:
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
 * /api/v1/inventory:
 *   get:
 *     summary: 獲取庫存列表
 *     tags: [庫存管理]
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
 *         name: search
 *         schema:
 *           type: string
 *         description: 搜尋關鍵字
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: 狀態篩選
 *     responses:
 *       200:
 *         description: 獲取成功
 *       401:
 *         description: 未授權
 *       500:
 *         description: 服務器錯誤
 */
router.get('/', authenticateToken, inventoryController.getInventory);

/**
 * @swagger
 * /api/v1/inventory/{inventoryId}:
 *   get:
 *     summary: 獲取庫存詳情
 *     tags: [庫存管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: inventoryId
 *         required: true
 *         schema:
 *           type: string
 *         description: 庫存ID
 *     responses:
 *       200:
 *         description: 獲取成功
 *       401:
 *         description: 未授權
 *       404:
 *         description: 庫存不存在
 *       500:
 *         description: 服務器錯誤
 */
router.get('/:inventoryId', authenticateToken, inventoryController.getInventoryById);

/**
 * @swagger
 * /api/v1/inventory:
 *   post:
 *     summary: 創建庫存記錄
 *     tags: [庫存管理]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - product_id
 *               - sku
 *               - quantity
 *             properties:
 *               product_id:
 *                 type: string
 *               sku:
 *                 type: string
 *               quantity:
 *                 type: integer
 *               reserved_quantity:
 *                 type: integer
 *                 default: 0
 *               reorder_point:
 *                 type: integer
 *                 default: 10
 *               status:
 *                 type: string
 *                 default: 'active'
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
router.post('/', authenticateToken, authorize(['admin', 'manager']), validateInventory.create, inventoryController.createInventory);

/**
 * @swagger
 * /api/v1/inventory/{inventoryId}:
 *   put:
 *     summary: 更新庫存
 *     tags: [庫存管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: inventoryId
 *         required: true
 *         schema:
 *           type: string
 *         description: 庫存ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantity:
 *                 type: integer
 *               reserved_quantity:
 *                 type: integer
 *               reorder_point:
 *                 type: integer
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: 更新成功
 *       400:
 *         description: 請求參數錯誤
 *       401:
 *         description: 未授權
 *       404:
 *         description: 庫存不存在
 *       500:
 *         description: 服務器錯誤
 */
router.put('/:inventoryId', authenticateToken, authorize(['admin', 'manager']), validateInventory.update, inventoryController.updateInventory);

/**
 * @swagger
 * /api/v1/inventory/{inventoryId}/adjust:
 *   post:
 *     summary: 調整庫存數量
 *     tags: [庫存管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: inventoryId
 *         required: true
 *         schema:
 *           type: string
 *         description: 庫存ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - adjustment
 *               - reason
 *             properties:
 *               adjustment:
 *                 type: integer
 *                 description: 調整數量（正數為增加，負數為減少）
 *               reason:
 *                 type: string
 *                 description: 調整原因
 *     responses:
 *       200:
 *         description: 調整成功
 *       400:
 *         description: 請求參數錯誤
 *       401:
 *         description: 未授權
 *       404:
 *         description: 庫存不存在
 *       500:
 *         description: 服務器錯誤
 */
router.post('/:inventoryId/adjust', authenticateToken, authorize(['admin', 'manager']), inventoryController.adjustInventory);

/**
 * @swagger
 * /api/v1/inventory/low-stock:
 *   get:
 *     summary: 獲取低庫存商品
 *     tags: [庫存管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: threshold
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 低庫存閾值
 *     responses:
 *       200:
 *         description: 獲取成功
 *       401:
 *         description: 未授權
 *       500:
 *         description: 服務器錯誤
 */
router.get('/low-stock', authenticateToken, inventoryController.getLowStockItems);

/**
 * @swagger
 * /api/v1/inventory/statistics:
 *   get:
 *     summary: 獲取庫存統計
 *     tags: [庫存管理]
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
router.get('/statistics', authenticateToken, inventoryController.getInventoryStatistics);

module.exports = router;
