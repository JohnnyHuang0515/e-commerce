const express = require('express');
const productController = require('../controllers/productController');
const { validateProduct } = require('../middleware/validation');
const { authenticateToken, authorize } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         price:
 *           type: number
 *         category_id:
 *           type: string
 *           format: uuid
 *         status:
 *           type: string
 *         images:
 *           type: array
 *           items:
 *             type: string
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/v1/products:
 *   get:
 *     summary: 獲取商品列表
 *     tags: [商品管理]
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
 *         name: category
 *         schema:
 *           type: string
 *         description: 分類篩選
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
router.get('/', authenticateToken, productController.getProducts);

/**
 * @swagger
 * /api/v1/products/{productId}:
 *   get:
 *     summary: 獲取商品詳情
 *     tags: [商品管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: 商品ID
 *     responses:
 *       200:
 *         description: 獲取成功
 *       401:
 *         description: 未授權
 *       404:
 *         description: 商品不存在
 *       500:
 *         description: 服務器錯誤
 */
router.get('/:productId', authenticateToken, productController.getProductById);

/**
 * @swagger
 * /api/v1/products:
 *   post:
 *     summary: 創建新商品
 *     tags: [商品管理]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *               - category
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               category_id:
 *                 type: string
 *                 format: uuid
 *               status:
 *                 type: string
 *                 default: 'active'
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
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
router.post('/', authenticateToken, authorize(['ADMIN', 'MANAGER']), validateProduct.create, productController.createProduct);

/**
 * @swagger
 * /api/v1/products/{productId}:
 *   put:
 *     summary: 更新商品
 *     tags: [商品管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: 商品ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               category_id:
 *                 type: string
 *                 format: uuid
 *               status:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: 更新成功
 *       400:
 *         description: 請求參數錯誤
 *       401:
 *         description: 未授權
 *       404:
 *         description: 商品不存在
 *       500:
 *         description: 服務器錯誤
 */
router.put('/:productId', authenticateToken, authorize(['ADMIN', 'MANAGER']), validateProduct.update, productController.updateProduct);

/**
 * @swagger
 * /api/v1/products/{productId}:
 *   delete:
 *     summary: 刪除商品
 *     tags: [商品管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: 商品ID
 *     responses:
 *       200:
 *         description: 刪除成功
 *       401:
 *         description: 未授權
 *       404:
 *         description: 商品不存在
 *       500:
 *         description: 服務器錯誤
 */
router.delete('/:productId', authenticateToken, authorize(['ADMIN']), productController.deleteProduct);

/**
 * @swagger
 * /api/v1/products/categories:
 *   get:
 *     summary: 獲取商品分類列表
 *     tags: [商品管理]
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
router.get('/categories', authenticateToken, productController.getCategories);

/**
 * @swagger
 * /api/v1/products/categories:
 *   post:
 *     summary: 創建新分類
 *     tags: [商品管理]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               parent_id:
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
router.post('/categories', authenticateToken, authorize(['ADMIN', 'MANAGER']), productController.createCategory);

// 新增端點
router.post('/batch', authenticateToken, authorize(['ADMIN', 'MANAGER']), productController.batchOperation);
router.get('/statistics', authenticateToken, productController.getProductStatistics);
router.post('/import', authenticateToken, authorize(['ADMIN', 'MANAGER']), productController.importProducts);
router.get('/export', authenticateToken, productController.exportProducts);

module.exports = router;
