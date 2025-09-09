const express = require('express');
const userController = require('../controllers/userController');
const { validateUser } = require('../middleware/validation');
const { authenticateToken, authorize } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         email:
 *           type: string
 *         name:
 *           type: string
 *         role:
 *           type: string
 *         status:
 *           type: string
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *     UserListResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         data:
 *           type: object
 *           properties:
 *             users:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *             pagination:
 *               type: object
 *               properties:
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 total:
 *                   type: integer
 *                 pages:
 *                   type: integer
 */

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: 獲取用戶列表
 *     tags: [用戶管理]
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
 *         name: role
 *         schema:
 *           type: string
 *         description: 角色篩選
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: 狀態篩選
 *     responses:
 *       200:
 *         description: 獲取成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserListResponse'
 *       401:
 *         description: 未授權
 *       500:
 *         description: 服務器錯誤
 */
router.get('/', authenticateToken, authorize(['ADMIN', 'MANAGER']), userController.getUsers);

/**
 * @swagger
 * /api/v1/users/overview:
 *   get:
 *     summary: 獲取用戶概覽統計
 *     tags: [用戶管理]
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
router.get('/overview', authenticateToken, authorize(['ADMIN', 'MANAGER']), userController.getUserOverview);

/**
 * @swagger
 * /api/v1/users/{userId}:
 *   get:
 *     summary: 獲取用戶詳情
 *     tags: [用戶管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: 用戶ID
 *     responses:
 *       200:
 *         description: 獲取成功
 *       401:
 *         description: 未授權
 *       404:
 *         description: 用戶不存在
 *       500:
 *         description: 服務器錯誤
 */
router.get('/:userId', authenticateToken, userController.getUserById);

/**
 * @swagger
 * /api/v1/users:
 *   post:
 *     summary: 創建新用戶
 *     tags: [用戶管理]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               name:
 *                 type: string
 *               role:
 *                 type: string
 *                 default: 'user'
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
 *       409:
 *         description: 用戶已存在
 *       500:
 *         description: 服務器錯誤
 */
router.post('/', authenticateToken, authorize(['admin']), validateUser.create, userController.createUser);

/**
 * @swagger
 * /api/v1/users/{userId}:
 *   put:
 *     summary: 更新用戶資料
 *     tags: [用戶管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: 用戶ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               role:
 *                 type: string
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
 *         description: 用戶不存在
 *       500:
 *         description: 服務器錯誤
 */
router.put('/:userId', authenticateToken, validateUser.update, userController.updateUser);

/**
 * @swagger
 * /api/v1/users/{userId}:
 *   delete:
 *     summary: 刪除用戶
 *     tags: [用戶管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: 用戶ID
 *     responses:
 *       200:
 *         description: 刪除成功
 *       401:
 *         description: 未授權
 *       404:
 *         description: 用戶不存在
 *       500:
 *         description: 服務器錯誤
 */
router.delete('/:userId', authenticateToken, authorize(['admin']), userController.deleteUser);

/**
 * @swagger
 * /api/v1/users/{userId}/role:
 *   put:
 *     summary: 更新用戶角色
 *     tags: [用戶管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: 用戶ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [ADMIN, MANAGER, CUSTOMER]
 *     responses:
 *       200:
 *         description: 更新成功
 *       400:
 *         description: 請求參數錯誤
 *       401:
 *         description: 未授權
 *       404:
 *         description: 用戶不存在
 *       500:
 *         description: 服務器錯誤
 */
router.put('/:userId/role', authenticateToken, authorize(['admin']), userController.updateUserRole);

/**
 * @swagger
 * /api/v1/users/{userId}/analytics:
 *   get:
 *     summary: 獲取用戶統計分析
 *     tags: [用戶管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: 用戶ID
 *     responses:
 *       200:
 *         description: 獲取成功
 *       401:
 *         description: 未授權
 *       404:
 *         description: 用戶不存在
 *       500:
 *         description: 服務器錯誤
 */
router.get('/:userId/analytics', authenticateToken, userController.getUserAnalytics);

module.exports = router;
