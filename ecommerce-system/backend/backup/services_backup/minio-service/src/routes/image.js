const express = require('express');
const { ImageController, uploadSingle, uploadMultiple } = require('../controllers/imageController');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// 上傳限制
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分鐘
  max: 50, // 最多 50 次上傳
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: '上傳次數過多，請稍後再試'
    }
  }
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Image:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: 圖片ID
 *         filename:
 *           type: string
 *           description: 文件名
 *         originalName:
 *           type: string
 *           description: 原始文件名
 *         mimeType:
 *           type: string
 *           description: MIME類型
 *         size:
 *           type: number
 *           description: 文件大小（字節）
 *         bucket:
 *           type: string
 *           description: 存儲桶名稱
 *         objectName:
 *           type: string
 *           description: 對象名稱
 *         url:
 *           type: string
 *           description: 訪問URL
 *         width:
 *           type: number
 *           description: 圖片寬度
 *         height:
 *           type: number
 *           description: 圖片高度
 *         thumbnailUrl:
 *           type: string
 *           description: 縮略圖URL
 *         entityType:
 *           type: string
 *           enum: [product, user, category]
 *           description: 實體類型
 *         entityId:
 *           type: string
 *           description: 實體ID
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: 標籤
 *         description:
 *           type: string
 *           description: 描述
 *         status:
 *           type: string
 *           enum: [active, inactive, deleted]
 *           description: 狀態
 *         isPublic:
 *           type: boolean
 *           description: 是否公開
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: 創建時間
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: 更新時間
 */

/**
 * @swagger
 * /api/v1/images:
 *   post:
 *     summary: 上傳單個圖片
 *     description: 上傳單個圖片到 MinIO 存儲
 *     tags: [Images]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *               - entityType
 *               - entityId
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: 圖片文件
 *               entityType:
 *                 type: string
 *                 enum: [product, user, category]
 *                 description: 實體類型
 *               entityId:
 *                 type: string
 *                 description: 實體ID
 *               description:
 *                 type: string
 *                 description: 圖片描述
 *               tags:
 *                 type: string
 *                 description: 標籤（逗號分隔）
 *     responses:
 *       201:
 *         description: 上傳成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Image'
 *                 message:
 *                   type: string
 *                   example: 圖片上傳成功
 *       400:
 *         description: 請求錯誤
 *       500:
 *         description: 服務器錯誤
 */
router.post('/', uploadLimiter, uploadSingle, ImageController.uploadSingle);

/**
 * @swagger
 * /api/v1/images/batch:
 *   post:
 *     summary: 批量上傳圖片
 *     description: 批量上傳多個圖片到 MinIO 存儲
 *     tags: [Images]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - images
 *               - entityType
 *               - entityId
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: 圖片文件數組
 *               entityType:
 *                 type: string
 *                 enum: [product, user, category]
 *                 description: 實體類型
 *               entityId:
 *                 type: string
 *                 description: 實體ID
 *               description:
 *                 type: string
 *                 description: 圖片描述
 *               tags:
 *                 type: string
 *                 description: 標籤（逗號分隔）
 *     responses:
 *       201:
 *         description: 批量上傳成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     uploaded:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Image'
 *                     errors:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           filename:
 *                             type: string
 *                           errors:
 *                             type: array
 *                             items:
 *                               type: string
 *                 message:
 *                   type: string
 *                   example: 成功上傳 5 個圖片，0 個失敗
 */
router.post('/batch', uploadLimiter, uploadMultiple, ImageController.uploadMultiple);

/**
 * @swagger
 * /api/v1/images:
 *   get:
 *     summary: 獲取圖片列表
 *     description: 獲取圖片列表，支持分頁和篩選
 *     tags: [Images]
 *     parameters:
 *       - in: query
 *         name: entityType
 *         schema:
 *           type: string
 *           enum: [product, user, category]
 *         description: 實體類型篩選
 *       - in: query
 *         name: entityId
 *         schema:
 *           type: string
 *         description: 實體ID篩選
 *       - in: query
 *         name: bucket
 *         schema:
 *           type: string
 *           enum: [product-images, user-avatars, category-images]
 *         description: 存儲桶篩選
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
 *     responses:
 *       200:
 *         description: 成功獲取圖片列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     images:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Image'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 */
router.get('/', ImageController.getImages);

/**
 * @swagger
 * /api/v1/images/{id}:
 *   get:
 *     summary: 獲取單個圖片
 *     description: 根據ID獲取圖片詳情
 *     tags: [Images]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 圖片ID
 *     responses:
 *       200:
 *         description: 成功獲取圖片詳情
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Image'
 *       404:
 *         description: 圖片不存在
 */
router.get('/:id', ImageController.getImage);

/**
 * @swagger
 * /api/v1/images/{id}:
 *   delete:
 *     summary: 刪除圖片
 *     description: 刪除圖片（軟刪除）
 *     tags: [Images]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 圖片ID
 *     responses:
 *       200:
 *         description: 刪除成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 圖片刪除成功
 *       404:
 *         description: 圖片不存在
 */
router.delete('/:id', ImageController.deleteImage);

/**
 * @swagger
 * /api/v1/images/stats:
 *   get:
 *     summary: 獲取圖片統計
 *     description: 獲取圖片統計信息
 *     tags: [Images]
 *     responses:
 *       200:
 *         description: 成功獲取統計信息
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalImages:
 *                       type: integer
 *                       description: 總圖片數
 *                     totalSize:
 *                       type: integer
 *                       description: 總大小（字節）
 *                     byBucket:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             description: 存儲桶名稱
 *                           count:
 *                             type: integer
 *                             description: 圖片數量
 *                           totalSize:
 *                             type: integer
 *                             description: 總大小
 */
router.get('/stats', ImageController.getImageStats);

module.exports = router;
