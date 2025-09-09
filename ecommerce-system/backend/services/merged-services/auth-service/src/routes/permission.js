const express = require('express');
const permissionController = require('../controllers/permissionController');
const { validatePermission } = require('../middleware/validation');
const { authenticateToken, authorize } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Permission:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         resource:
 *           type: string
 *         action:
 *           type: string
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *     Role:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         permissions:
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
 * /api/v1/permissions:
 *   get:
 *     summary: 獲取權限列表
 *     tags: [權限管理]
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
 *         name: resource
 *         schema:
 *           type: string
 *         description: 資源篩選
 *     responses:
 *       200:
 *         description: 獲取成功
 *       401:
 *         description: 未授權
 *       500:
 *         description: 服務器錯誤
 */
router.get('/', authenticateToken, authorize(['admin']), permissionController.getPermissions);

/**
 * @swagger
 * /api/v1/permissions/roles:
 *   get:
 *     summary: 獲取角色列表
 *     tags: [權限管理]
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
 *     responses:
 *       200:
 *         description: 獲取成功
 *       401:
 *         description: 未授權
 *       500:
 *         description: 服務器錯誤
 */
router.get('/roles', authenticateToken, authorize(['admin']), permissionController.getRoles);

/**
 * @swagger
 * /api/v1/permissions/roles/{roleId}:
 *   get:
 *     summary: 獲取角色詳情
 *     tags: [權限管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *         description: 角色ID
 *     responses:
 *       200:
 *         description: 獲取成功
 *       401:
 *         description: 未授權
 *       404:
 *         description: 角色不存在
 *       500:
 *         description: 服務器錯誤
 */
router.get('/roles/:roleId', authenticateToken, authorize(['admin']), permissionController.getRoleById);

/**
 * @swagger
 * /api/v1/permissions/roles:
 *   post:
 *     summary: 創建新角色
 *     tags: [權限管理]
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
 *               - description
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               permissions:
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
 *       409:
 *         description: 角色已存在
 *       500:
 *         description: 服務器錯誤
 */
router.post('/roles', authenticateToken, authorize(['admin']), validatePermission.createRole, permissionController.createRole);

/**
 * @swagger
 * /api/v1/permissions/roles/{roleId}:
 *   put:
 *     summary: 更新角色
 *     tags: [權限管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *         description: 角色ID
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
 *               permissions:
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
 *         description: 角色不存在
 *       500:
 *         description: 服務器錯誤
 */
router.put('/roles/:roleId', authenticateToken, authorize(['admin']), validatePermission.updateRole, permissionController.updateRole);

/**
 * @swagger
 * /api/v1/permissions/roles/{roleId}:
 *   delete:
 *     summary: 刪除角色
 *     tags: [權限管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *         description: 角色ID
 *     responses:
 *       200:
 *         description: 刪除成功
 *       401:
 *         description: 未授權
 *       404:
 *         description: 角色不存在
 *       500:
 *         description: 服務器錯誤
 */
router.delete('/roles/:roleId', authenticateToken, authorize(['admin']), permissionController.deleteRole);

/**
 * @swagger
 * /api/v1/permissions/roles/{roleId}/permissions:
 *   put:
 *     summary: 更新角色權限
 *     tags: [權限管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *         description: 角色ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - permissions
 *             properties:
 *               permissions:
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
 *         description: 角色不存在
 *       500:
 *         description: 服務器錯誤
 */
router.put('/roles/:roleId/permissions', authenticateToken, authorize(['admin']), permissionController.updateRolePermissions);

/**
 * @swagger
 * /api/v1/permissions/check:
 *   post:
 *     summary: 檢查用戶權限
 *     tags: [權限管理]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - resource
 *               - action
 *             properties:
 *               resource:
 *                 type: string
 *               action:
 *                 type: string
 *     responses:
 *       200:
 *         description: 權限檢查結果
 *       401:
 *         description: 未授權
 *       500:
 *         description: 服務器錯誤
 */
router.post('/check', authenticateToken, permissionController.checkPermission);

module.exports = router;
