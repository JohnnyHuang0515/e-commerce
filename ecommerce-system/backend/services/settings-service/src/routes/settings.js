const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { verifyToken, requirePermission } = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     Setting:
 *       type: object
 *       properties:
 *         category:
 *           type: string
 *           enum: [system, payment, shipping, notification, security, general]
 *           description: 設定分類
 *         key:
 *           type: string
 *           description: 設定鍵值
 *         value:
 *           type: object
 *           description: 設定值
 *         description:
 *           type: string
 *           description: 設定描述
 *         isPublic:
 *           type: boolean
 *           description: 是否為公開設定
 *         isRequired:
 *           type: boolean
 *           description: 是否為必要設定
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     
 *     SettingUpdate:
 *       type: object
 *       properties:
 *         value:
 *           type: object
 *           description: 新的設定值
 *         description:
 *           type: string
 *           description: 設定描述
 *     
 *     SettingCreate:
 *       type: object
 *       required:
 *         - category
 *         - key
 *         - value
 *       properties:
 *         category:
 *           type: string
 *           enum: [system, payment, shipping, notification, security, general]
 *         key:
 *           type: string
 *         value:
 *           type: object
 *         description:
 *           type: string
 *         isPublic:
 *           type: boolean
 *           default: false
 *         isRequired:
 *           type: boolean
 *           default: false
 *     
 *     CategoryInfo:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         count:
 *           type: integer
 */

/**
 * @swagger
 * /api/v1/settings:
 *   get:
 *     summary: 取得所有設定
 *     description: 取得系統所有設定，可依分類篩選
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [system, payment, shipping, notification, security, general]
 *         description: 設定分類篩選
 *       - in: query
 *         name: publicOnly
 *         schema:
 *           type: boolean
 *         description: 只取得公開設定
 *     responses:
 *       200:
 *         description: 成功取得設定列表
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
 *                     settings:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Setting'
 *                     total:
 *                       type: integer
 *                     categories:
 *                       type: array
 *                       items:
 *                         type: string
 *       401:
 *         description: 未授權
 *       500:
 *         description: 伺服器錯誤
 */
router.get('/', verifyToken, requirePermission(['settings:read']), settingsController.getAllSettings);

/**
 * @swagger
 * /api/v1/settings/categories:
 *   get:
 *     summary: 取得設定分類
 *     description: 取得所有設定分類及其統計資訊
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功取得分類資訊
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CategoryInfo'
 *       401:
 *         description: 未授權
 *       500:
 *         description: 伺服器錯誤
 */
router.get('/categories', verifyToken, requirePermission(['settings:read']), settingsController.getCategories);

/**
 * @swagger
 * /api/v1/settings/public:
 *   get:
 *     summary: 取得公開設定
 *     description: 取得所有公開的設定（無需認證）
 *     tags: [Settings]
 *     responses:
 *       200:
 *         description: 成功取得公開設定
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
 *                     settings:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Setting'
 *                     total:
 *                       type: integer
 *       500:
 *         description: 伺服器錯誤
 */
router.get('/public', settingsController.getPublicSettings);

/**
 * @swagger
 * /api/v1/settings/{category}/{key}:
 *   get:
 *     summary: 取得單一設定
 *     description: 取得指定分類和鍵值的設定
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *           enum: [system, payment, shipping, notification, security, general]
 *         description: 設定分類
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: 設定鍵值
 *     responses:
 *       200:
 *         description: 成功取得設定
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Setting'
 *       401:
 *         description: 未授權
 *       404:
 *         description: 找不到設定
 *       500:
 *         description: 伺服器錯誤
 */
router.get('/:category/:key', verifyToken, requirePermission(['settings:read']), settingsController.getSetting);

/**
 * @swagger
 * /api/v1/settings/{category}/{key}:
 *   put:
 *     summary: 更新設定
 *     description: 更新指定分類和鍵值的設定
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *           enum: [system, payment, shipping, notification, security, general]
 *         description: 設定分類
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: 設定鍵值
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SettingUpdate'
 *     responses:
 *       200:
 *         description: 成功更新設定
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
 *                   $ref: '#/components/schemas/Setting'
 *       400:
 *         description: 設定值驗證失敗
 *       401:
 *         description: 未授權
 *       404:
 *         description: 找不到設定
 *       500:
 *         description: 伺服器錯誤
 */
router.put('/:category/:key', verifyToken, requirePermission(['settings:write']), settingsController.updateSetting);

/**
 * @swagger
 * /api/v1/settings/{category}/{key}/reset:
 *   post:
 *     summary: 重設設定為預設值
 *     description: 將指定設定重設為系統預設值
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *           enum: [system, payment, shipping, notification, security, general]
 *         description: 設定分類
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: 設定鍵值
 *     responses:
 *       200:
 *         description: 成功重設設定
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
 *                   $ref: '#/components/schemas/Setting'
 *       400:
 *         description: 找不到預設值
 *       401:
 *         description: 未授權
 *       500:
 *         description: 伺服器錯誤
 */
router.post('/:category/:key/reset', verifyToken, requirePermission(['settings:write']), settingsController.resetToDefault);

/**
 * @swagger
 * /api/v1/settings:
 *   post:
 *     summary: 建立新設定
 *     description: 建立新的系統設定
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SettingCreate'
 *     responses:
 *       201:
 *         description: 成功建立設定
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
 *                   $ref: '#/components/schemas/Setting'
 *       400:
 *         description: 設定已存在或驗證失敗
 *       401:
 *         description: 未授權
 *       500:
 *         description: 伺服器錯誤
 */
router.post('/', verifyToken, requirePermission(['settings:write']), settingsController.createSetting);

/**
 * @swagger
 * /api/v1/settings/{category}/{key}:
 *   delete:
 *     summary: 刪除設定
 *     description: 刪除指定的設定（無法刪除必要設定）
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *           enum: [system, payment, shipping, notification, security, general]
 *         description: 設定分類
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: 設定鍵值
 *     responses:
 *       200:
 *         description: 成功刪除設定
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: 無法刪除必要設定
 *       401:
 *         description: 未授權
 *       404:
 *         description: 找不到設定
 *       500:
 *         description: 伺服器錯誤
 */
router.delete('/:category/:key', verifyToken, requirePermission(['settings:write']), settingsController.deleteSetting);

/**
 * @swagger
 * /api/v1/settings/initialize:
 *   post:
 *     summary: 初始化預設設定
 *     description: 初始化系統預設設定
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功初始化預設設定
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: 未授權
 *       500:
 *         description: 伺服器錯誤
 */
router.post('/initialize', verifyToken, requirePermission(['settings:admin']), settingsController.initializeDefaults);

/**
 * @swagger
 * /api/v1/settings/export:
 *   get:
 *     summary: 匯出設定
 *     description: 匯出設定為 JSON 檔案
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [system, payment, shipping, notification, security, general]
 *         description: 指定分類匯出
 *     responses:
 *       200:
 *         description: 成功匯出設定
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
 *                     exportDate:
 *                       type: string
 *                       format: date-time
 *                     totalSettings:
 *                       type: integer
 *                     settings:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Setting'
 *       401:
 *         description: 未授權
 *       500:
 *         description: 伺服器錯誤
 */
router.get('/export', verifyToken, requirePermission(['settings:read']), settingsController.exportSettings);

module.exports = router;
