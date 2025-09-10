const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const RedisCacheManager = require('../models/redisCacheManager');
const settings = require('../config/settings');
const logger = require('../utils/logger');

const router = express.Router();

// 創建快取管理器實例
const cacheManager = new RedisCacheManager(settings);

/**
 * @swagger
 * components:
 *   schemas:
 *     CacheStats:
 *       type: object
 *       properties:
 *         connected:
 *           type: boolean
 *         db_size:
 *           type: integer
 *         memory_used:
 *           type: string
 *         memory_peak:
 *           type: string
 *         hit_rate:
 *           type: string
 *         miss_rate:
 *           type: string
 *         uptime:
 *           type: string
 */

/**
 * @swagger
 * /api/v1/cache/stats:
 *   get:
 *     summary: 獲取快取統計信息
 *     tags: [快取管理]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 獲取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/CacheStats'
 *       401:
 *         description: 未授權
 *       500:
 *         description: 服務器錯誤
 */
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const stats = await cacheManager.getCacheStats();
    
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('獲取快取統計錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取快取統計時發生錯誤',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/cache/health:
 *   get:
 *     summary: 快取健康檢查
 *     tags: [快取管理]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 健康檢查成功
 *       401:
 *         description: 未授權
 *       500:
 *         description: 服務器錯誤
 */
router.get('/health', authenticateToken, async (req, res) => {
  try {
    const health = await cacheManager.healthCheck();
    
    const statusCode = health.status === 'healthy' ? 200 : 503;
    
    res.status(statusCode).json({
      success: health.status === 'healthy',
      data: health,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('快取健康檢查錯誤:', error);
    res.status(500).json({
      success: false,
      message: '快取健康檢查時發生錯誤',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/cache/clear:
 *   post:
 *     summary: 清理快取
 *     tags: [快取管理]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               pattern:
 *                 type: string
 *                 description: 清理模式 (如 "search:*", "recommendations:*")
 *               user_id:
 *                 type: string
 *                 description: 清理特定用戶的快取
 *               product_id:
 *                 type: string
 *                 description: 清理特定商品的快取
 *     responses:
 *       200:
 *         description: 清理成功
 *       401:
 *         description: 未授權
 *       500:
 *         description: 服務器錯誤
 */
router.post('/clear', authenticateToken, async (req, res) => {
  try {
    const { pattern, user_id, product_id } = req.body;
    
    let cleared = false;
    
    if (user_id) {
      // 清理用戶相關快取
      cleared = await cacheManager.invalidateUserCache(user_id);
      logger.info(`🧹 清理用戶 ${user_id} 的快取`);
    } else if (product_id) {
      // 清理商品相關快取
      cleared = await cacheManager.invalidateProductCache(product_id);
      logger.info(`🧹 清理商品 ${product_id} 的快取`);
    } else if (pattern) {
      // 清理模式匹配的快取
      const keysToDelete = await cacheManager.scanKeys(pattern);
      if (keysToDelete.length > 0) {
        await cacheManager.client.del(keysToDelete);
        cleared = true;
        logger.info(`🧹 清理快取模式 ${pattern}: ${keysToDelete.length} 個鍵`);
      }
    } else {
      // 清理所有快取
      await cacheManager.client.flushDb();
      cleared = true;
      logger.info('🧹 清理所有快取');
    }
    
    res.json({
      success: cleared,
      message: cleared ? '快取清理成功' : '快取清理失敗',
      pattern: pattern,
      user_id: user_id,
      product_id: product_id,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('清理快取錯誤:', error);
    res.status(500).json({
      success: false,
      message: '清理快取時發生錯誤',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/cache/get/{key}:
 *   get:
 *     summary: 獲取快取值
 *     tags: [快取管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: 快取鍵
 *     responses:
 *       200:
 *         description: 獲取成功
 *       401:
 *         description: 未授權
 *       404:
 *         description: 快取未找到
 *       500:
 *         description: 服務器錯誤
 */
router.get('/get/:key', authenticateToken, async (req, res) => {
  try {
    const { key } = req.params;
    const value = await cacheManager.get(key);
    
    if (value === null) {
      return res.status(404).json({
        success: false,
        message: '快取未找到',
        key: key
      });
    }
    
    res.json({
      success: true,
      key: key,
      value: value,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('獲取快取值錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取快取值時發生錯誤',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/cache/set:
 *   post:
 *     summary: 設置快取值
 *     tags: [快取管理]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - key
 *               - value
 *             properties:
 *               key:
 *                 type: string
 *                 description: 快取鍵
 *               value:
 *                 type: object
 *                 description: 快取值
 *               ttl:
 *                 type: integer
 *                 description: 過期時間（秒）
 *                 default: 3600
 *     responses:
 *       200:
 *         description: 設置成功
 *       400:
 *         description: 請求參數錯誤
 *       401:
 *         description: 未授權
 *       500:
 *         description: 服務器錯誤
 */
router.post('/set', authenticateToken, async (req, res) => {
  try {
    const { key, value, ttl = 3600 } = req.body;
    
    if (!key || value === undefined) {
      return res.status(400).json({
        success: false,
        message: '快取鍵和值為必填欄位'
      });
    }
    
    const success = await cacheManager.set(key, value, ttl);
    
    res.json({
      success: success,
      message: success ? '快取設置成功' : '快取設置失敗',
      key: key,
      ttl: ttl,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('設置快取值錯誤:', error);
    res.status(500).json({
      success: false,
      message: '設置快取值時發生錯誤',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/cache/delete/{key}:
 *   delete:
 *     summary: 刪除快取值
 *     tags: [快取管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: 快取鍵
 *     responses:
 *       200:
 *         description: 刪除成功
 *       401:
 *         description: 未授權
 *       500:
 *         description: 服務器錯誤
 */
router.delete('/delete/:key', authenticateToken, async (req, res) => {
  try {
    const { key } = req.params;
    const success = await cacheManager.del(key);
    
    res.json({
      success: success,
      message: success ? '快取刪除成功' : '快取刪除失敗',
      key: key,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('刪除快取值錯誤:', error);
    res.status(500).json({
      success: false,
      message: '刪除快取值時發生錯誤',
      error: error.message
    });
  }
});

module.exports = router;
