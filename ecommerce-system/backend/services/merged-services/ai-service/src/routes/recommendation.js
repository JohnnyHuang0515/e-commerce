const express = require('express');
const recommendationController = require('../controllers/recommendationController');
const { validateRecommendation } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Recommendation:
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
 *         reason:
 *           type: string
 *         metadata:
 *           type: object
 */

/**
 * @swagger
 * /api/v1/recommendations:
 *   get:
 *     summary: 獲取推薦項目
 *     tags: [AI推薦]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [collaborative, content_based, hybrid, trending]
 *           default: hybrid
 *         description: 推薦類型
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 推薦數量限制
 *       - in: query
 *         name: item_type
 *         schema:
 *           type: string
 *           enum: [product, content, user]
 *           default: product
 *         description: 項目類型
 *     responses:
 *       200:
 *         description: 獲取成功
 *       401:
 *         description: 未授權
 *       500:
 *         description: 服務器錯誤
 */
router.get('/', authenticateToken, recommendationController.getRecommendations);

/**
 * @swagger
 * /api/v1/recommendations/similar:
 *   get:
 *     summary: 獲取相似項目推薦
 *     tags: [AI推薦]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: item_id
 *         required: true
 *         schema:
 *           type: string
 *         description: 參考項目ID
 *       - in: query
 *         name: item_type
 *         schema:
 *           type: string
 *           enum: [product, content, user]
 *           default: product
 *         description: 項目類型
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *         description: 推薦數量限制
 *     responses:
 *       200:
 *         description: 獲取成功
 *       400:
 *         description: 請求參數錯誤
 *       401:
 *         description: 未授權
 *       500:
 *         description: 服務器錯誤
 */
router.get('/similar', authenticateToken, recommendationController.getSimilarItems);

/**
 * @swagger
 * /api/v1/recommendations/personalized:
 *   get:
 *     summary: 獲取個人化推薦
 *     tags: [AI推薦]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [collaborative, content_based, hybrid]
 *           default: hybrid
 *         description: 推薦類型
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 推薦數量限制
 *     responses:
 *       200:
 *         description: 獲取成功
 *       401:
 *         description: 未授權
 *       500:
 *         description: 服務器錯誤
 */
router.get('/personalized', authenticateToken, recommendationController.getPersonalizedRecommendations);

/**
 * @swagger
 * /api/v1/recommendations/trending:
 *   get:
 *     summary: 獲取熱門推薦
 *     tags: [AI推薦]
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
 *         description: 推薦數量限制
 *     responses:
 *       200:
 *         description: 獲取成功
 *       401:
 *         description: 未授權
 *       500:
 *         description: 服務器錯誤
 */
router.get('/trending', authenticateToken, recommendationController.getTrendingItems);

/**
 * @swagger
 * /api/v1/recommendations/click:
 *   post:
 *     summary: 記錄推薦項目點擊
 *     tags: [AI推薦]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - item_id
 *               - recommendation_type
 *             properties:
 *               item_id:
 *                 type: string
 *               recommendation_type:
 *                 type: string
 *                 enum: [collaborative, content_based, hybrid, trending]
 *               score:
 *                 type: number
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
router.post('/click', authenticateToken, recommendationController.recordClick);

/**
 * @swagger
 * /api/v1/recommendations/analytics:
 *   get:
 *     summary: 獲取推薦分析
 *     tags: [AI推薦]
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
router.get('/analytics', authenticateToken, recommendationController.getRecommendationAnalytics);

module.exports = router;
