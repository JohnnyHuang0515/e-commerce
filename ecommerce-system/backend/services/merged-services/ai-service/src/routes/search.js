const express = require('express');
const searchController = require('../controllers/searchController');
const { validateSearch } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     SearchResult:
 *       type: object
 *       properties:
 *         item_id:
 *           type: string
 *         item_type:
 *           type: string
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         score:
 *           type: number
 *         metadata:
 *           type: object
 */

/**
 * @swagger
 * /api/v1/search:
 *   post:
 *     summary: 執行搜尋
 *     tags: [AI搜尋]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - query
 *             properties:
 *               query:
 *                 type: string
 *                 description: 搜尋關鍵字
 *               search_type:
 *                 type: string
 *                 enum: [product, content, user]
 *                 default: product
 *               filters:
 *                 type: object
 *                 description: 搜尋篩選條件
 *               limit:
 *                 type: integer
 *                 default: 10
 *                 description: 結果數量限制
 *               offset:
 *                 type: integer
 *                 default: 0
 *                 description: 結果偏移量
 *     responses:
 *       200:
 *         description: 搜尋成功
 *       400:
 *         description: 請求參數錯誤
 *       401:
 *         description: 未授權
 *       500:
 *         description: 服務器錯誤
 */
router.post('/', authenticateToken, validateSearch.search, searchController.search);

/**
 * @swagger
 * /api/v1/search/suggestions:
 *   get:
 *     summary: 獲取搜尋建議
 *     tags: [AI搜尋]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: 搜尋關鍵字
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *         description: 建議數量限制
 *     responses:
 *       200:
 *         description: 獲取成功
 *       401:
 *         description: 未授權
 *       500:
 *         description: 服務器錯誤
 */
router.get('/suggestions', authenticateToken, searchController.getSuggestions);

/**
 * @swagger
 * /api/v1/search/trending:
 *   get:
 *     summary: 獲取熱門搜尋
 *     tags: [AI搜尋]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [day, week, month]
 *           default: week
 *         description: 時間週期
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 結果數量限制
 *     responses:
 *       200:
 *         description: 獲取成功
 *       401:
 *         description: 未授權
 *       500:
 *         description: 服務器錯誤
 */
router.get('/trending', authenticateToken, searchController.getTrending);

/**
 * @swagger
 * /api/v1/search/analytics:
 *   get:
 *     summary: 獲取搜尋分析
 *     tags: [AI搜尋]
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
router.get('/analytics', authenticateToken, searchController.getSearchAnalytics);

/**
 * @swagger
 * /api/v1/search/click:
 *   post:
 *     summary: 記錄搜尋結果點擊
 *     tags: [AI搜尋]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - search_id
 *               - result_id
 *               - position
 *             properties:
 *               search_id:
 *                 type: string
 *               result_id:
 *                 type: string
 *               position:
 *                 type: integer
 *     responses:
 *       200:
 *         description: 記錄成功
 *       400:
 *         description: 請求參數錯誤
 *       401:
 *         description: 未授權
 *       500:
 *         description: 服務器錯誤
 */
router.post('/click', authenticateToken, searchController.recordClick);

module.exports = router;
