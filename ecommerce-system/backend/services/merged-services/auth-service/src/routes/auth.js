const express = require('express');
const authController = require('../controllers/authController');
const { validateAuth } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

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
 *           description: 用戶郵箱
 *         password:
 *           type: string
 *           minLength: 6
 *           description: 用戶密碼
 *     LoginResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           type: object
 *           properties:
 *             token:
 *               type: string
 *             user:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 email:
 *                   type: string
 *                 role:
 *                   type: string
 *                 permissions:
 *                   type: array
 *                   items:
 *                     type: string
 */

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: 用戶登入
 *     tags: [認證]
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
 *         description: 請求參數錯誤
 *       401:
 *         description: 認證失敗
 *       500:
 *         description: 服務器錯誤
 */
router.post('/login', validateAuth.login, authController.login);

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: 用戶註冊
 *     tags: [認證]
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
 *     responses:
 *       201:
 *         description: 註冊成功
 *       400:
 *         description: 請求參數錯誤
 *       409:
 *         description: 用戶已存在
 *       500:
 *         description: 服務器錯誤
 */
router.post('/register', validateAuth.register, authController.register);

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     summary: 刷新 Token
 *     tags: [認證]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token 刷新成功
 *       401:
 *         description: Token 無效
 *       500:
 *         description: 服務器錯誤
 */
router.post('/refresh', authenticateToken, authController.refreshToken);

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: 用戶登出
 *     tags: [認證]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 登出成功
 *       401:
 *         description: Token 無效
 *       500:
 *         description: 服務器錯誤
 */
router.post('/logout', authenticateToken, authController.logout);

/**
 * @swagger
 * /api/v1/auth/verify:
 *   get:
 *     summary: 驗證 Token
 *     tags: [認證]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token 有效
 *       401:
 *         description: Token 無效
 *       500:
 *         description: 服務器錯誤
 */
router.get('/verify', authenticateToken, authController.verifyToken);

module.exports = router;
