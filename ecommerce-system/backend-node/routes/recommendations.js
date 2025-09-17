const express = require('express');
const { mongoClient, redisClient } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { getIdMapping } = require('../utils/idMapper');
const { checkPermission } = require('../middleware/rbac');
const { asyncHandler, NotFoundError } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * @swagger
 * /api/v1/recommendations:
 *   get:
 *     summary: 獲取個人化推薦商品
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 推薦數量
 *       - in: query
 *         name: category_id
 *         schema:
 *           type: string
 *         description: 分類 ID
 *     responses:
 *       200:
 *         description: 獲取成功
 */
router.get('/', authenticateToken, checkPermission('view_products'), asyncHandler(async (req, res) => {
  const { limit = 10, category_id } = req.query;
  const userId = req.user.user_id;
  
  // 先從 Redis 快取獲取推薦結果
  try {
    const cacheKey = `recommendations:${userId}:${category_id || 'all'}`;
    const cachedRecommendations = await redisClient.get(cacheKey);
    
    if (cachedRecommendations) {
      return res.json({
        success: true,
        data: JSON.parse(cachedRecommendations),
        source: 'cache'
      });
    }
  } catch (error) {
    console.error('獲取推薦快取失敗:', error);
  }
  
  // 從 MongoDB 獲取推薦結果
  let recommendations = null;
  try {
    const recommendationsCollection = mongoClient.db('ecommerce').collection('recommendations');
    const query = { user_id: userId };
    if (category_id) {
      query.category_id = category_id;
    }
    
    recommendations = await recommendationsCollection.findOne(query);
  } catch (error) {
    console.error('獲取推薦結果失敗:', error);
  }
  
  // 如果沒有推薦結果，生成新的推薦
  if (!recommendations || !recommendations.recommended_products) {
    recommendations = await generateRecommendations(userId, parseInt(limit), category_id);
  }
  
  // 快取推薦結果 (30分鐘)
  try {
    const cacheKey = `recommendations:${userId}:${category_id || 'all'}`;
    await redisClient.setEx(cacheKey, 1800, JSON.stringify(recommendations.recommended_products));
  } catch (error) {
    console.error('快取推薦結果失敗:', error);
  }
  
  res.json({
    success: true,
    data: recommendations.recommended_products,
    source: 'generated'
  });
}));

/**
 * @swagger
 * /api/v1/recommendations/similar/{productId}:
 *   get:
 *     summary: 獲取相似商品推薦
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: 商品公開 ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *         description: 推薦數量
 *     responses:
 *       200:
 *         description: 獲取成功
 *       404:
 *         description: 商品不存在
 */
router.get('/similar/:productId', authenticateToken, checkPermission('view_products'), asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { limit = 5 } = req.query;
  
  // 獲取商品信息
  const productMapping = await getIdMapping('products', productId);
  if (!productMapping) {
    throw new NotFoundError('商品不存在');
  }
  
  // 從 MongoDB 獲取相似商品推薦
  let similarProducts = null;
  try {
    const recommendationsCollection = mongoClient.db('ecommerce').collection('recommendations');
    const result = await recommendationsCollection.findOne({
      type: 'similar_products',
      product_id: productMapping.internal_id
    });
    
    if (result && result.similar_products) {
      similarProducts = result.similar_products.slice(0, parseInt(limit));
    }
  } catch (error) {
    console.error('獲取相似商品推薦失敗:', error);
  }
  
  // 如果沒有推薦結果，生成新的推薦
  if (!similarProducts) {
    similarProducts = await generateSimilarProducts(productMapping.internal_id, parseInt(limit));
  }
  
  res.json({
    success: true,
    data: similarProducts
  });
}));

/**
 * @swagger
 * /api/v1/recommendations/popular:
 *   get:
 *     summary: 獲取熱銷商品推薦
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 推薦數量
 *       - in: query
 *         name: category_id
 *         schema:
 *           type: string
 *         description: 分類 ID
 *     responses:
 *       200:
 *         description: 獲取成功
 */
router.get('/popular', authenticateToken, checkPermission('view_products'), asyncHandler(async (req, res) => {
  const { limit = 10, category_id } = req.query;
  
  // 先從 Redis 快取獲取熱銷商品
  try {
    const cacheKey = `popular_products:${category_id || 'all'}`;
    const cachedProducts = await redisClient.get(cacheKey);
    
    if (cachedProducts) {
      return res.json({
        success: true,
        data: JSON.parse(cachedProducts),
        source: 'cache'
      });
    }
  } catch (error) {
    console.error('獲取熱銷商品快取失敗:', error);
  }
  
  // 從 ClickHouse 獲取熱銷商品數據
  let popularProducts = null;
  try {
    const { clickhouseClient } = require('../config/database');
    
    let query = `
      SELECT 
        product_id,
        COUNT(*) as order_count,
        SUM(quantity) as total_quantity,
        AVG(unit_price) as avg_price
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.order_id
      WHERE o.order_status = 'delivered'
      AND o.created_at >= NOW() - INTERVAL 30 DAY
    `;
    
    if (category_id) {
      query += ` AND oi.product_id IN (
        SELECT product_id FROM products WHERE category_id = (
          SELECT category_id FROM categories WHERE public_id = '${category_id}'
        )
      )`;
    }
    
    query += `
      GROUP BY product_id
      ORDER BY order_count DESC, total_quantity DESC
      LIMIT ${parseInt(limit)}
    `;
    
    const result = await clickhouseClient.query(query);
    popularProducts = result.data;
  } catch (error) {
    console.error('獲取熱銷商品數據失敗:', error);
  }
  
  // 如果沒有數據，使用簡單的熱銷商品查詢
  if (!popularProducts || popularProducts.length === 0) {
    popularProducts = await getPopularProductsFromPostgres(parseInt(limit), category_id);
  }
  
  // 快取結果 (1小時)
  try {
    const cacheKey = `popular_products:${category_id || 'all'}`;
    await redisClient.setEx(cacheKey, 3600, JSON.stringify(popularProducts));
  } catch (error) {
    console.error('快取熱銷商品失敗:', error);
  }
  
  res.json({
    success: true,
    data: popularProducts,
    source: 'database'
  });
}));

/**
 * @swagger
 * /api/v1/recommendations/refresh:
 *   post:
 *     summary: 刷新推薦結果
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 刷新成功
 */
router.post('/refresh', authenticateToken, checkPermission('view_products'), asyncHandler(async (req, res) => {
  const userId = req.user.user_id;
  
  // 清除推薦快取
  try {
    const pattern = `recommendations:${userId}:*`;
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (error) {
    console.error('清除推薦快取失敗:', error);
  }
  
  // 觸發新的推薦生成
  try {
    await generateRecommendations(userId, 10, null);
  } catch (error) {
    console.error('生成新推薦失敗:', error);
  }
  
  res.json({
    success: true,
    message: '推薦結果已刷新'
  });
}));

// 輔助函數：生成個人化推薦
async function generateRecommendations(userId, limit, categoryId) {
  try {
    // 獲取用戶行為數據
    const userEvents = await mongoClient.db('ecommerce').collection('user_events').find({
      user_id: userId,
      event_type: { $in: ['product_viewed', 'product_purchased', 'product_added_to_cart'] }
    }).sort({ created_at: -1 }).limit(100).toArray();
    
    // 分析用戶偏好
    const preferences = analyzeUserPreferences(userEvents);
    
    // 基於偏好生成推薦
    const recommendations = await generateRecommendationsByPreferences(preferences, limit, categoryId);
    
    // 保存推薦結果到 MongoDB
    await mongoClient.db('ecommerce').collection('recommendations').updateOne(
      { user_id: userId, type: 'personalized' },
      {
        $set: {
          user_id: userId,
          type: 'personalized',
          recommended_products: recommendations,
          generated_at: new Date(),
          preferences: preferences
        }
      },
      { upsert: true }
    );
    
    return { recommended_products: recommendations };
  } catch (error) {
    console.error('生成個人化推薦失敗:', error);
    return { recommended_products: [] };
  }
}

// 輔助函數：生成相似商品推薦
async function generateSimilarProducts(productId, limit) {
  try {
    // 獲取商品信息
    const { postgresPool } = require('../config/database');
    const productResult = await postgresPool.query(`
      SELECT category_id, price, name
      FROM products
      WHERE product_id = $1
    `, [productId]);
    
    if (productResult.rows.length === 0) {
      return [];
    }
    
    const product = productResult.rows[0];
    
    // 基於分類和價格範圍查找相似商品
    const similarResult = await postgresPool.query(`
      SELECT 
        product_id,
        public_id,
        name,
        price,
        description
      FROM products
      WHERE product_id != $1
      AND category_id = $2
      AND status = 1
      AND price BETWEEN $3 AND $4
      ORDER BY ABS(price - $5) ASC
      LIMIT $6
    `, [
      productId,
      product.category_id,
      product.price * 0.7, // 價格範圍：70% - 130%
      product.price * 1.3,
      product.price,
      limit
    ]);
    
    return similarResult.rows;
  } catch (error) {
    console.error('生成相似商品推薦失敗:', error);
    return [];
  }
}

// 輔助函數：從 PostgreSQL 獲取熱銷商品
async function getPopularProductsFromPostgres(limit, categoryId) {
  try {
    const { postgresPool } = require('../config/database');
    
    let query = `
      SELECT 
        p.product_id,
        p.public_id,
        p.name,
        p.price,
        p.description,
        COUNT(oi.order_item_id) as order_count,
        SUM(oi.quantity) as total_quantity
      FROM products p
      LEFT JOIN order_items oi ON p.product_id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.order_id
      WHERE p.status = 1
    `;
    
    if (categoryId) {
      query += ` AND p.category_id = (SELECT category_id FROM categories WHERE public_id = $1)`;
    }
    
    query += `
      GROUP BY p.product_id, p.public_id, p.name, p.price, p.description
      ORDER BY order_count DESC, total_quantity DESC
      LIMIT $${categoryId ? '2' : '1'}
    `;
    
    const params = categoryId ? [categoryId, limit] : [limit];
    const result = await postgresPool.query(query, params);
    
    return result.rows;
  } catch (error) {
    console.error('從 PostgreSQL 獲取熱銷商品失敗:', error);
    return [];
  }
}

// 輔助函數：分析用戶偏好
function analyzeUserPreferences(userEvents) {
  const preferences = {
    categories: {},
    priceRange: { min: 0, max: 0 },
    brands: {},
    totalEvents: userEvents.length
  };
  
  userEvents.forEach(event => {
    if (event.event_data && event.event_data.product_id) {
      // 這裡可以根據實際的產品數據結構來分析偏好
      // 例如：分類偏好、價格偏好、品牌偏好等
    }
  });
  
  return preferences;
}

// 輔助函數：基於偏好生成推薦
async function generateRecommendationsByPreferences(preferences, limit, categoryId) {
  try {
    const { postgresPool } = require('../config/database');
    
    let query = `
      SELECT 
        product_id,
        public_id,
        name,
        price,
        description
      FROM products
      WHERE status = 1
    `;
    
    if (categoryId) {
      query += ` AND category_id = (SELECT category_id FROM categories WHERE public_id = $1)`;
    }
    
    query += ` ORDER BY RANDOM() LIMIT $${categoryId ? '2' : '1'}`;
    
    const params = categoryId ? [categoryId, limit] : [limit];
    const result = await postgresPool.query(query, params);
    
    return result.rows;
  } catch (error) {
    console.error('基於偏好生成推薦失敗:', error);
    return [];
  }
}

module.exports = router;
