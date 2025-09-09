const express = require('express');
const utilityController = require('../controllers/utilityController');
const { authenticateToken, authorize } = require('../middleware/auth');
const multer = require('multer');

const router = express.Router();

// 文件上傳配置
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
    }
  }),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
});

/**
 * @swagger
 * components:
 *   schemas:
 *     FileUpload:
 *       type: object
 *       properties:
 *         filename:
 *           type: string
 *         original_name:
 *           type: string
 *         file_path:
 *           type: string
 *         file_size:
 *           type: number
 *         mime_type:
 *           type: string
 *         uploader_id:
 *           type: string
 *         category:
 *           type: string
 *         is_public:
 *           type: boolean
 */

/**
 * @swagger
 * /api/v1/utilities/upload:
 *   post:
 *     summary: 上傳文件
 *     tags: [系統工具]
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
 *                 enum: [system, backup, export, import, temp]
 *                 default: system
 *               is_public:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: 上傳成功
 *       400:
 *         description: 請求參數錯誤
 *       401:
 *         description: 未授權
 *       500:
 *         description: 服務器錯誤
 */
router.post('/upload', authenticateToken, upload.single('file'), utilityController.uploadFile);

/**
 * @swagger
 * /api/v1/utilities/files:
 *   get:
 *     summary: 獲取文件列表
 *     tags: [系統工具]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: 文件分類
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
 *     responses:
 *       200:
 *         description: 獲取成功
 *       401:
 *         description: 未授權
 *       500:
 *         description: 服務器錯誤
 */
router.get('/files', authenticateToken, utilityController.getFiles);

/**
 * @swagger
 * /api/v1/utilities/files/{fileId}:
 *   get:
 *     summary: 下載文件
 *     tags: [系統工具]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *         description: 文件ID
 *     responses:
 *       200:
 *         description: 下載成功
 *       401:
 *         description: 未授權
 *       404:
 *         description: 文件不存在
 *       500:
 *         description: 服務器錯誤
 */
router.get('/files/:fileId', authenticateToken, utilityController.downloadFile);

/**
 * @swagger
 * /api/v1/utilities/files/{fileId}:
 *   delete:
 *     summary: 刪除文件
 *     tags: [系統工具]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *         description: 文件ID
 *     responses:
 *       200:
 *         description: 刪除成功
 *       401:
 *         description: 未授權
 *       404:
 *         description: 文件不存在
 *       500:
 *         description: 服務器錯誤
 */
router.delete('/files/:fileId', authenticateToken, authorize(['admin', 'manager']), utilityController.deleteFile);

/**
 * @swagger
 * /api/v1/utilities/backup:
 *   post:
 *     summary: 創建系統備份
 *     tags: [系統工具]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               backup_type:
 *                 type: string
 *                 enum: [full, incremental, differential]
 *                 default: full
 *               include_logs:
 *                 type: boolean
 *                 default: true
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: 備份創建成功
 *       400:
 *         description: 請求參數錯誤
 *       401:
 *         description: 未授權
 *       500:
 *         description: 服務器錯誤
 */
router.post('/backup', authenticateToken, authorize(['admin']), utilityController.createBackup);

/**
 * @swagger
 * /api/v1/utilities/backup:
 *   get:
 *     summary: 獲取備份列表
 *     tags: [系統工具]
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
 *     responses:
 *       200:
 *         description: 獲取成功
 *       401:
 *         description: 未授權
 *       500:
 *         description: 服務器錯誤
 */
router.get('/backup', authenticateToken, authorize(['admin', 'manager']), utilityController.getBackups);

/**
 * @swagger
 * /api/v1/utilities/backup/{backupId}:
 *   post:
 *     summary: 恢復備份
 *     tags: [系統工具]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: backupId
 *         required: true
 *         schema:
 *           type: string
 *         description: 備份ID
 *     responses:
 *       200:
 *         description: 恢復成功
 *       401:
 *         description: 未授權
 *       404:
 *         description: 備份不存在
 *       500:
 *         description: 服務器錯誤
 */
router.post('/backup/:backupId/restore', authenticateToken, authorize(['admin']), utilityController.restoreBackup);

/**
 * @swagger
 * /api/v1/utilities/export:
 *   post:
 *     summary: 導出數據
 *     tags: [系統工具]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - data_type
 *             properties:
 *               data_type:
 *                 type: string
 *                 enum: [users, products, orders, logs, all]
 *               format:
 *                 type: string
 *                 enum: [json, csv, excel]
 *                 default: json
 *               filters:
 *                 type: object
 *               date_range:
 *                 type: object
 *                 properties:
 *                   start_date:
 *                     type: string
 *                     format: date
 *                   end_date:
 *                     type: string
 *                     format: date
 *     responses:
 *       201:
 *         description: 導出成功
 *       400:
 *         description: 請求參數錯誤
 *       401:
 *         description: 未授權
 *       500:
 *         description: 服務器錯誤
 */
router.post('/export', authenticateToken, authorize(['admin', 'manager']), utilityController.exportData);

/**
 * @swagger
 * /api/v1/utilities/import:
 *   post:
 *     summary: 導入數據
 *     tags: [系統工具]
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
 *               data_type:
 *                 type: string
 *                 enum: [users, products, orders]
 *               validate_only:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: 導入成功
 *       400:
 *         description: 請求參數錯誤
 *       401:
 *         description: 未授權
 *       500:
 *         description: 服務器錯誤
 */
router.post('/import', authenticateToken, authorize(['admin']), upload.single('file'), utilityController.importData);

/**
 * @swagger
 * /api/v1/utilities/cleanup:
 *   post:
 *     summary: 清理系統數據
 *     tags: [系統工具]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cleanup_type:
 *                 type: string
 *                 enum: [logs, temp_files, expired_data, all]
 *               older_than_days:
 *                 type: integer
 *                 default: 30
 *     responses:
 *       200:
 *         description: 清理成功
 *       400:
 *         description: 請求參數錯誤
 *       401:
 *         description: 未授權
 *       500:
 *         description: 服務器錯誤
 */
router.post('/cleanup', authenticateToken, authorize(['admin']), utilityController.cleanupData);

module.exports = router;
