const express = require('express');
const router = express.Router();
const {
  getInventories,
  getInventory,
  createInventory,
  updateInventory,
  bulkUpdateInventory,
  reserveStock,
  releaseReservedStock,
  confirmShipment,
  getInventoryTransactions,
  getInventoryStats,
  getLowStockAlerts,
} = require('../controllers/inventoryController');

/**
 * @swagger
 * components:
 *   schemas:
 *     Inventory:
 *       type: object
 *       properties:
 *         productId:
 *           type: string
 *           description: 商品 ID
 *         sku:
 *           type: string
 *           description: 商品 SKU
 *         currentStock:
 *           type: number
 *           description: 當前庫存
 *         reservedStock:
 *           type: number
 *           description: 預留庫存
 *         availableStock:
 *           type: number
 *           description: 可用庫存
 *         minStock:
 *           type: number
 *           description: 最低庫存
 *         maxStock:
 *           type: number
 *           description: 最高庫存
 *         status:
 *           type: string
 *           enum: [in_stock, low_stock, out_of_stock, discontinued]
 *           description: 庫存狀態
 *         unitCost:
 *           type: number
 *           description: 單位成本
 *         totalValue:
 *           type: number
 *           description: 總價值
 *         lastUpdated:
 *           type: string
 *           format: date-time
 *         location:
 *           type: object
 *           properties:
 *             warehouse:
 *               type: string
 *             zone:
 *               type: string
 *             shelf:
 *               type: string
 *             position:
 *               type: string
 *         supplier:
 *           type: object
 *           properties:
 *             supplierId:
 *               type: string
 *             supplierName:
 *               type: string
 *             supplierSku:
 *               type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/v1/inventory:
 *   get:
 *     summary: 取得庫存列表
 *     tags: [Inventory]
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
 *           enum: [in_stock, low_stock, out_of_stock, discontinued]
 *         description: 庫存狀態
 *       - in: query
 *         name: lowStock
 *         schema:
 *           type: boolean
 *         description: 低庫存篩選
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: 搜尋關鍵字
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: lastUpdated
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
 *         description: 庫存列表
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
 *                     inventories:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Inventory'
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
router.get('/', getInventories);

/**
 * @swagger
 * /api/v1/inventory/alerts:
 *   get:
 *     summary: 取得低庫存預警
 *     tags: [Inventory]
 *     parameters:
 *       - in: query
 *         name: threshold
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 預警閾值
 *     responses:
 *       200:
 *         description: 低庫存預警
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
 *                     lowStockItems:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Inventory'
 *                     criticalStockItems:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Inventory'
 *                     outOfStockItems:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Inventory'
 *                     summary:
 *                       type: object
 *                       properties:
 *                         lowStockCount:
 *                           type: integer
 *                         criticalStockCount:
 *                           type: integer
 *                         outOfStockCount:
 *                           type: integer
 *                         totalAlerts:
 *                           type: integer
 *                     threshold:
 *                       type: integer
 *       500:
 *         description: 伺服器錯誤
 */
router.get('/alerts', getLowStockAlerts);

/**
 * @swagger
 * /api/v1/inventory/stats:
 *   get:
 *     summary: 取得庫存統計
 *     tags: [Inventory]
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
 *         description: 庫存統計
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
 *                         totalProducts:
 *                           type: integer
 *                         totalStock:
 *                           type: number
 *                         totalValue:
 *                           type: number
 *                         averageStock:
 *                           type: number
 *                         averageValue:
 *                           type: number
 *                         lowStockCount:
 *                           type: integer
 *                         outOfStockCount:
 *                           type: integer
 *                         inStockCount:
 *                           type: integer
 *                     statusStats:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           count:
 *                             type: integer
 *                           totalStock:
 *                             type: number
 *                           totalValue:
 *                             type: number
 *                     locationStats:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           count:
 *                             type: integer
 *                           totalStock:
 *                             type: number
 *                           totalValue:
 *                             type: number
 *                     lowStockItems:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Inventory'
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
router.get('/stats', getInventoryStats);

/**
 * @swagger
 * /api/v1/inventory:
 *   post:
 *     summary: 建立庫存記錄
 *     tags: [Inventory]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - sku
 *               - initialStock
 *             properties:
 *               productId:
 *                 type: string
 *                 description: 商品 ID
 *               sku:
 *                 type: string
 *                 description: 商品 SKU
 *               initialStock:
 *                 type: number
 *                 description: 初始庫存
 *               minStock:
 *                 type: number
 *                 description: 最低庫存
 *               maxStock:
 *                 type: number
 *                 description: 最高庫存
 *               unitCost:
 *                 type: number
 *                 description: 單位成本
 *               location:
 *                 type: object
 *                 properties:
 *                   warehouse:
 *                     type: string
 *                   zone:
 *                     type: string
 *                   shelf:
 *                     type: string
 *                   position:
 *                     type: string
 *               supplier:
 *                 type: object
 *                 properties:
 *                   supplierId:
 *                     type: string
 *                   supplierName:
 *                     type: string
 *                   supplierSku:
 *                     type: string
 *               expiryDate:
 *                 type: string
 *                 format: date-time
 *                 description: 過期日期
 *               batchNumber:
 *                 type: string
 *                 description: 批次號碼
 *               metadata:
 *                 type: object
 *                 description: 額外資料
 *     responses:
 *       201:
 *         description: 庫存記錄建立成功
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
 *                     inventory:
 *                       $ref: '#/components/schemas/Inventory'
 *                     transaction:
 *                       type: string
 *       400:
 *         description: 請求參數錯誤
 *       409:
 *         description: 庫存記錄已存在
 *       500:
 *         description: 伺服器錯誤
 */
router.post('/', createInventory);

/**
 * @swagger
 * /api/v1/inventory/{productId}:
 *   get:
 *     summary: 取得庫存詳情
 *     tags: [Inventory]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: 商品 ID
 *     responses:
 *       200:
 *         description: 庫存詳情
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Inventory'
 *       404:
 *         description: 庫存記錄不存在
 *       500:
 *         description: 伺服器錯誤
 */
router.get('/:productId', getInventory);

/**
 * @swagger
 * /api/v1/inventory/{productId}:
 *   put:
 *     summary: 更新庫存
 *     tags: [Inventory]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: 商品 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *               - type
 *               - reason
 *             properties:
 *               quantity:
 *                 type: number
 *                 description: 庫存變動數量
 *               type:
 *                 type: string
 *                 enum: [purchase, sale, return, adjustment, transfer, damage, expired, initial]
 *                 description: 變動類型
 *               reason:
 *                 type: string
 *                 enum: [order_placed, order_cancelled, order_returned, stock_adjustment, damage_loss, expiration, transfer_in, transfer_out, initial_stock, manual_adjustment]
 *                 description: 變動原因
 *               referenceId:
 *                 type: string
 *                 description: 參考 ID
 *               notes:
 *                 type: string
 *                 description: 備註
 *     responses:
 *       200:
 *         description: 庫存更新成功
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
 *                     inventory:
 *                       $ref: '#/components/schemas/Inventory'
 *                     transaction:
 *                       type: string
 *       400:
 *         description: 請求參數錯誤
 *       404:
 *         description: 庫存記錄不存在
 *       500:
 *         description: 伺服器錯誤
 */
router.put('/:productId', updateInventory);

/**
 * @swagger
 * /api/v1/inventory/bulk:
 *   post:
 *     summary: 批量更新庫存
 *     tags: [Inventory]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - updates
 *             properties:
 *               updates:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - productId
 *                     - quantity
 *                     - type
 *                     - reason
 *                   properties:
 *                     productId:
 *                       type: string
 *                     quantity:
 *                       type: number
 *                     type:
 *                       type: string
 *                     reason:
 *                       type: string
 *                     referenceId:
 *                       type: string
 *                     notes:
 *                       type: string
 *     responses:
 *       200:
 *         description: 批量庫存更新成功
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
 *                     updated:
 *                       type: integer
 *                     results:
 *                       type: array
 *       400:
 *         description: 請求參數錯誤
 *       500:
 *         description: 伺服器錯誤
 */
router.post('/bulk', bulkUpdateInventory);

/**
 * @swagger
 * /api/v1/inventory/{productId}/reserve:
 *   post:
 *     summary: 預留庫存
 *     tags: [Inventory]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: 商品 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *               - orderId
 *             properties:
 *               quantity:
 *                 type: number
 *                 description: 預留數量
 *               orderId:
 *                 type: string
 *                 description: 訂單 ID
 *     responses:
 *       200:
 *         description: 庫存預留成功
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
 *                     inventory:
 *                       $ref: '#/components/schemas/Inventory'
 *                     transaction:
 *                       type: string
 *       400:
 *         description: 請求參數錯誤
 *       404:
 *         description: 庫存記錄不存在
 *       500:
 *         description: 伺服器錯誤
 */
router.post('/:productId/reserve', reserveStock);

/**
 * @swagger
 * /api/v1/inventory/{productId}/release:
 *   post:
 *     summary: 釋放預留庫存
 *     tags: [Inventory]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: 商品 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *               - orderId
 *             properties:
 *               quantity:
 *                 type: number
 *                 description: 釋放數量
 *               orderId:
 *                 type: string
 *                 description: 訂單 ID
 *     responses:
 *       200:
 *         description: 預留庫存釋放成功
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
 *                     inventory:
 *                       $ref: '#/components/schemas/Inventory'
 *                     transaction:
 *                       type: string
 *       400:
 *         description: 請求參數錯誤
 *       404:
 *         description: 庫存記錄不存在
 *       500:
 *         description: 伺服器錯誤
 */
router.post('/:productId/release', releaseReservedStock);

/**
 * @swagger
 * /api/v1/inventory/{productId}/ship:
 *   post:
 *     summary: 確認出庫
 *     tags: [Inventory]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: 商品 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *               - orderId
 *             properties:
 *               quantity:
 *                 type: number
 *                 description: 出庫數量
 *               orderId:
 *                 type: string
 *                 description: 訂單 ID
 *     responses:
 *       200:
 *         description: 出庫確認成功
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
 *                     inventory:
 *                       $ref: '#/components/schemas/Inventory'
 *                     transaction:
 *                       type: string
 *       400:
 *         description: 請求參數錯誤
 *       404:
 *         description: 庫存記錄不存在
 *       500:
 *         description: 伺服器錯誤
 */
router.post('/:productId/ship', confirmShipment);

/**
 * @swagger
 * /api/v1/inventory/{productId}/transactions:
 *   get:
 *     summary: 取得庫存交易記錄
 *     tags: [Inventory]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: 商品 ID
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
 *         name: type
 *         schema:
 *           type: string
 *           enum: [purchase, sale, return, adjustment, transfer, damage, expired, initial]
 *         description: 交易類型
 *       - in: query
 *         name: reason
 *         schema:
 *           type: string
 *           enum: [order_placed, order_cancelled, order_returned, stock_adjustment, damage_loss, expiration, transfer_in, transfer_out, initial_stock, manual_adjustment]
 *         description: 交易原因
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
 *         description: 庫存交易記錄
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
 *                     transactions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           transactionId:
 *                             type: string
 *                           type:
 *                             type: string
 *                           reason:
 *                             type: string
 *                           quantity:
 *                             type: number
 *                           previousStock:
 *                             type: number
 *                           newStock:
 *                             type: number
 *                           unitCost:
 *                             type: number
 *                           totalCost:
 *                             type: number
 *                           referenceId:
 *                             type: string
 *                           notes:
 *                             type: string
 *                           performedBy:
 *                             type: string
 *                           performedAt:
 *                             type: string
 *                             format: date-time
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
 *       404:
 *         description: 庫存記錄不存在
 *       500:
 *         description: 伺服器錯誤
 */
router.get('/:productId/transactions', getInventoryTransactions);

module.exports = router;
