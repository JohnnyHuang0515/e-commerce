const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: 管理員 Email
 *         password:
 *           type: string
 *           description: 管理員密碼
 *     LoginResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *           properties:
 *             token:
 *               type: string
 *               description: JWT Token
 *             user:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 email:
 *                   type: string
 *                 name:
 *                   type: string
 *                 role:
 *                   type: string
 *                 permissions:
 *                   type: array
 *                   items:
 *                     type: string
 *         message:
 *           type: string
 *           example: 登入成功
 */

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: 管理員登入
 *     description: 管理員登入系統
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: 登入成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: 請求格式錯誤
 *       500:
 *         description: 伺服器內部錯誤
 */
router.post('/login', authController.login);

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: 管理員登出
 *     description: 管理員登出系統
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 登出成功
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
 *                   example: 登出成功
 *       401:
 *         description: 未授權
 *       500:
 *         description: 伺服器內部錯誤
 */
router.post('/logout', verifyToken, authController.logout);

/**
 * @swagger
 * /api/v1/auth/profile:
 *   get:
 *     summary: 取得管理員資料
 *     description: 取得當前登入管理員的資料
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功取得管理員資料
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
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     name:
 *                       type: string
 *                     role:
 *                       type: string
 *                     permissions:
 *                       type: array
 *                       items:
 *                         type: string
 *       401:
 *         description: 未授權
 *       500:
 *         description: 伺服器內部錯誤
 */
router.get('/profile', verifyToken, authController.getProfile);

/**
 * @swagger
 * /api/v1/auth/password:
 *   put:
 *     summary: 修改密碼
 *     description: 修改管理員密碼
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 description: 目前密碼
 *               newPassword:
 *                 type: string
 *                 description: 新密碼
 *     responses:
 *       200:
 *         description: 密碼修改成功
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
 *                   example: 密碼修改成功
 *       400:
 *         description: 目前密碼錯誤
 *       401:
 *         description: 未授權
 *       500:
 *         description: 伺服器內部錯誤
 */
router.put('/password', verifyToken, authController.changePassword);

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     summary: 重新整理 Token
 *     description: 重新整理 JWT Token
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token 重新整理成功
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
 *                     token:
 *                       type: string
 *                       description: 新的 JWT Token
 *                 message:
 *                   type: string
 *                   example: Token 重新整理成功
 *       401:
 *         description: 未授權
 *       500:
 *         description: 伺服器內部錯誤
 */
router.post('/refresh', verifyToken, authController.refreshToken);

module.exports = router;
