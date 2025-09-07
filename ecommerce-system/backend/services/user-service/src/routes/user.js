const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, requirePermission } = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - name
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: 用戶電子郵件
 *         password:
 *           type: string
 *           minLength: 6
 *           description: 用戶密碼
 *         name:
 *           type: string
 *           maxLength: 50
 *           description: 用戶姓名
 *         phone:
 *           type: string
 *           description: 用戶電話
 *         role:
 *           type: string
 *           enum: [user, vip, admin]
 *           default: user
 *           description: 用戶角色
 *         status:
 *           type: string
 *           enum: [active, inactive, banned]
 *           default: active
 *           description: 用戶狀態
 *         profile:
 *           type: object
 *           properties:
 *             gender:
 *               type: string
 *               enum: [male, female, other]
 *             birthDate:
 *               type: string
 *               format: date
 *             address:
 *               type: object
 *               properties:
 *                 street:
 *                   type: string
 *                 city:
 *                   type: string
 *                 state:
 *                   type: string
 *                 zipCode:
 *                   type: string
 *                 country:
 *                   type: string
 *         statistics:
 *           type: object
 *           properties:
 *             totalOrders:
 *               type: number
 *               default: 0
 *             totalSpent:
 *               type: number
 *               default: 0
 *             lastLogin:
 *               type: string
 *               format: date-time
 *             loginCount:
 *               type: number
 *               default: 0
 *     UserList:
 *       type: object
 *       properties:
 *         users:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/User'
 *         pagination:
 *           type: object
 *           properties:
 *             page:
 *               type: number
 *             limit:
 *               type: number
 *             total:
 *               type: number
 *             pages:
 *               type: number
 *     UserOverview:
 *       type: object
 *       properties:
 *         totalUsers:
 *           type: number
 *         activeUsers:
 *           type: number
 *         adminUsers:
 *           type: number
 *         vipUsers:
 *           type: number
 *         recentUsers:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               createdAt:
 *                 type: string
 *                 format: date-time
 *         activeRecentUsers:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               lastLogin:
 *                 type: string
 *                 format: date-time
 */

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: 取得用戶列表
 *     description: 取得所有用戶的列表，支援分頁、搜尋和篩選
 *     tags: [Users]
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
 *         description: 搜尋關鍵字（姓名或電子郵件）
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [user, vip, admin]
 *         description: 角色篩選
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, banned]
 *         description: 狀態篩選
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
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
 *         description: 成功取得用戶列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/UserList'
 *                 message:
 *                   type: string
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/', verifyToken, requirePermission(['users:read']), userController.getUsers);

/**
 * @swagger
 * /api/v1/users/overview:
 *   get:
 *     summary: 取得用戶概覽統計
 *     description: 取得用戶相關的統計資料
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功取得用戶概覽統計
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/UserOverview'
 *                 message:
 *                   type: string
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/overview', verifyToken, requirePermission(['users:read']), userController.getUsersOverview);

/**
 * @swagger
 * /api/v1/users/{userId}:
 *   get:
 *     summary: 取得單一用戶
 *     description: 根據用戶 ID 取得用戶詳細資料
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: 用戶 ID
 *     responses:
 *       200:
 *         description: 成功取得用戶資料
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *                 message:
 *                   type: string
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
// 特殊路由必須在 :id 路由之前
router.get('/stats', verifyToken, requirePermission(['users:read']), userController.getUserStats);

router.get('/:id', verifyToken, requirePermission(['users:read']), userController.getUserById);

/**
 * @swagger
 * /api/v1/users:
 *   post:
 *     summary: 建立新用戶
 *     description: 建立新的用戶帳號
 *     tags: [Users]
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
 *               phone:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [user, vip, admin]
 *               status:
 *                 type: string
 *                 enum: [active, inactive, banned]
 *     responses:
 *       201:
 *         description: 用戶建立成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *                 message:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/', verifyToken, requirePermission(['users:write']), userController.createUser);

/**
 * @swagger
 * /api/v1/users/{userId}:
 *   put:
 *     summary: 更新用戶資料
 *     description: 更新指定用戶的資料
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: 用戶 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [user, vip, admin]
 *               status:
 *                 type: string
 *                 enum: [active, inactive, banned]
 *               profile:
 *                 type: object
 *     responses:
 *       200:
 *         description: 用戶更新成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *                 message:
 *                   type: string
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.put('/:id', verifyToken, requirePermission(['users:write']), userController.updateUser);

/**
 * @swagger
 * /api/v1/users/{userId}:
 *   delete:
 *     summary: 刪除用戶
 *     description: 刪除指定的用戶
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: 用戶 ID
 *     responses:
 *       200:
 *         description: 用戶刪除成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.delete('/:id', verifyToken, requirePermission(['users:write']), userController.deleteUser);

/**
 * @swagger
 * /api/v1/users/{userId}/role:
 *   put:
 *     summary: 更新用戶角色
 *     description: 更新指定用戶的角色
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: 用戶 ID
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
 *                 enum: [user, vip, admin]
 *     responses:
 *       200:
 *         description: 用戶角色更新成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *                 message:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.put('/:userId/role', verifyToken, requirePermission(['users:write']), userController.updateUserRole);

/**
 * @swagger
 * /api/v1/users/{userId}/analytics:
 *   get:
 *     summary: 取得用戶統計資料
 *     description: 取得指定用戶的統計資料
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: 用戶 ID
 *     responses:
 *       200:
 *         description: 成功取得用戶統計資料
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
 *                     totalOrders:
 *                       type: number
 *                     totalSpent:
 *                       type: number
 *                     lastLogin:
 *                       type: string
 *                       format: date-time
 *                     loginCount:
 *                       type: number
 *                 message:
 *                   type: string
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/:userId/analytics', verifyToken, requirePermission(['users:read']), userController.getUserAnalytics);

module.exports = router;
