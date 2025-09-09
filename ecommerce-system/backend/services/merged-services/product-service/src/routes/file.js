const express = require('express');
const fileController = require('../controllers/fileController');
const { authenticateToken, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
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
 *     File:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         filename:
 *           type: string
 *         original_name:
 *           type: string
 *         mime_type:
 *           type: string
 *         size:
 *           type: integer
 *         path:
 *           type: string
 *         url:
 *           type: string
 *         category:
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
 * /api/v1/files:
 *   get:
 *     summary: 獲取檔案列表
 *     tags: [檔案管理]
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
 *         name: category
 *         schema:
 *           type: string
 *         description: 分類篩選
 *     responses:
 *       200:
 *         description: 獲取成功
 *       401:
 *         description: 未授權
 *       500:
 *         description: 服務器錯誤
 */
router.get('/', authenticateToken, fileController.getFiles);

/**
 * @swagger
 * /api/v1/files/upload:
 *   post:
 *     summary: 上傳檔案
 *     tags: [檔案管理]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               category:
 *                 type: string
 *                 default: 'general'
 *     responses:
 *       200:
 *         description: 上傳成功
 *       400:
 *         description: 請求參數錯誤
 *       401:
 *         description: 未授權
 *       500:
 *         description: 服務器錯誤
 */
router.post('/upload', uploadLimiter, authenticateToken, authorize(['admin', 'manager']), upload.single('file'), fileController.uploadFile);

/**
 * @swagger
 * /api/v1/files/batch:
 *   post:
 *     summary: 批量上傳圖片
 *     description: 批量上傳多個圖片到 MinIO 存儲
 *     tags: [檔案管理]
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
 *       400:
 *         description: 請求錯誤
 *       500:
 *         description: 服務器錯誤
 */
router.post('/batch', uploadLimiter, authenticateToken, authorize(['admin', 'manager']), upload.array('images', 10), fileController.uploadMultiple);

/**
 * @swagger
 * /api/v1/files/{fileId}:
 *   get:
 *     summary: 獲取檔案詳情
 *     tags: [檔案管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *         description: 檔案ID
 *     responses:
 *       200:
 *         description: 獲取成功
 *       401:
 *         description: 未授權
 *       404:
 *         description: 檔案不存在
 *       500:
 *         description: 服務器錯誤
 */
router.get('/:fileId', authenticateToken, fileController.getFileById);

/**
 * @swagger
 * /api/v1/files/{fileId}:
 *   delete:
 *     summary: 刪除檔案
 *     tags: [檔案管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *         description: 檔案ID
 *     responses:
 *       200:
 *         description: 刪除成功
 *       401:
 *         description: 未授權
 *       404:
 *         description: 檔案不存在
 *       500:
 *         description: 服務器錯誤
 */
router.delete('/:fileId', authenticateToken, authorize(['admin', 'manager']), fileController.deleteFile);

/**
 * @swagger
 * /api/v1/files/{fileId}/download:
 *   get:
 *     summary: 下載檔案
 *     tags: [檔案管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *         description: 檔案ID
 *     responses:
 *       200:
 *         description: 下載成功
 *       401:
 *         description: 未授權
 *       404:
 *         description: 檔案不存在
 *       500:
 *         description: 服務器錯誤
 */
router.get('/:fileId/download', authenticateToken, fileController.downloadFile);

/**
 * @swagger
 * /api/v1/files/statistics:
 *   get:
 *     summary: 獲取檔案統計
 *     tags: [檔案管理]
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
router.get('/statistics', authenticateToken, fileController.getFileStatistics);

module.exports = router;
