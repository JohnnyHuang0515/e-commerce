const { RecommendationLog, UserBehavior, SearchIndex } = require('../models');
const VectorRecommendationService = require('../services/vectorRecommendationService');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

// 向量推薦服務實例
let vectorRecommendationService = null;

// 初始化向量推薦服務
const initializeVectorRecommendationService = async (settings) => {
  try {
    if (!vectorRecommendationService) {
      vectorRecommendationService = new VectorRecommendationService(settings);
      await vectorRecommendationService.initialize();
      logger.info('✅ 向量推薦服務初始化成功');
    }
    return true;
  } catch (error) {
    logger.error('❌ 向量推薦服務初始化失敗:', error);
    return false;
  }
};

// 獲取推薦項目
const getRecommendations = async (req, res) => {
  try {
    const { type = 'hybrid', limit = 10, item_type = 'product' } = req.query;
    const userId = req.user.userId;
    const sessionId = req.headers['x-session-id'] || uuidv4();

    let recommendations = [];

    // 優先使用向量推薦服務
    if (vectorRecommendationService && vectorRecommendationService.initialized) {
      const vectorResult = await vectorRecommendationService.getPersonalizedRecommendations(
        userId, 
        { limit, recommendationType: type, itemType: item_type }
      );
      
      if (vectorResult.success) {
        recommendations = vectorResult.recommendations;
      } else {
        logger.warn('向量推薦失敗，使用傳統方法:', vectorResult.error);
        recommendations = await getTraditionalRecommendations(userId, type, item_type, limit);
      }
    } else {
      // 使用傳統推薦方法
      recommendations = await getTraditionalRecommendations(userId, type, item_type, limit);
    }

    // 記錄推薦日誌
    for (const rec of recommendations) {
      const recommendationLog = new RecommendationLog({
        user_id: userId,
        item_id: rec.item_id,
        item_type: rec.item_type || item_type,
        recommendation_type: type,
        score: rec.score,
        reason: rec.reason,
        session_id: sessionId
      });
      await recommendationLog.save();
    }

    res.json({
      success: true,
      data: {
        recommendations: recommendations,
        type: type,
        total: recommendations.length,
        method: vectorRecommendationService && vectorRecommendationService.initialized ? 'vector' : 'traditional'
      }
    });
  } catch (error) {
    logger.error('獲取推薦錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取推薦時發生錯誤',
      error: error.message
    });
  }
};

// 傳統推薦方法（向後兼容）
const getTraditionalRecommendations = async (userId, type, itemType, limit) => {
  switch (type) {
    case 'collaborative':
      return await getCollaborativeRecommendations(userId, itemType, limit);
    case 'content_based':
      return await getContentBasedRecommendations(userId, itemType, limit);
    case 'trending':
      return await getTrendingRecommendations(itemType, limit);
    case 'hybrid':
    default:
      return await getHybridRecommendations(userId, itemType, limit);
  }
};

// 協同過濾推薦
const getCollaborativeRecommendations = async (userId, itemType, limit) => {
  try {
    // 獲取用戶歷史行為，增加權重
    const userBehaviors = await UserBehavior.find({
      user_id: userId,
      action: { $in: ['view', 'click', 'purchase', 'add_to_cart', 'like'] }
    }).sort({ created_at: -1 }).limit(200);

    if (userBehaviors.length === 0) {
      return getTrendingRecommendations(itemType, limit);
    }

    // 計算用戶行為權重
    const userItemWeights = calculateUserItemWeights(userBehaviors);
    
    // 找到相似用戶（改進算法）
    const similarUsers = await findSimilarUsersImproved(userId, userItemWeights);
    
    if (similarUsers.length === 0) {
      return getTrendingRecommendations(itemType, limit);
    }
    
    // 基於相似用戶的行為推薦（改進算法）
    const recommendations = await getRecommendationsFromSimilarUsersImproved(similarUsers, userId, itemType, limit);
    
    return recommendations;
  } catch (error) {
    console.error('協同過濾推薦錯誤:', error);
    return [];
  }
};

// 內容基於推薦
const getContentBasedRecommendations = async (userId, itemType, limit) => {
  try {
    // 獲取用戶喜歡的項目
    const likedItems = await UserBehavior.find({
      user_id: userId,
      action: { $in: ['like', 'purchase', 'click'] },
      item_type: itemType
    }).sort({ created_at: -1 }).limit(50);

    if (likedItems.length === 0) {
      return getTrendingRecommendations(itemType, limit);
    }

    // 基於內容相似性推薦
    const recommendations = await getSimilarItems(likedItems, itemType, limit);
    
    return recommendations;
  } catch (error) {
    console.error('內容基於推薦錯誤:', error);
    return [];
  }
};

// 混合推薦
const getHybridRecommendations = async (userId, itemType, limit) => {
  try {
    const collaborativeRecs = await getCollaborativeRecommendations(userId, itemType, Math.ceil(limit / 2));
    const contentBasedRecs = await getContentBasedRecommendations(userId, itemType, Math.ceil(limit / 2));
    
    // 合併並去重
    const allRecs = [...collaborativeRecs, ...contentBasedRecs];
    const uniqueRecs = allRecs.filter((rec, index, self) => 
      index === self.findIndex(r => r.item_id === rec.item_id)
    );
    
    // 重新計算分數
    return uniqueRecs
      .map(rec => ({
        ...rec,
        score: rec.score * 0.7 + Math.random() * 0.3 // 混合分數
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  } catch (error) {
    console.error('混合推薦錯誤:', error);
    return [];
  }
};

// 熱門推薦
const getTrendingRecommendations = async (itemType, limit) => {
  try {
    const trending = await SearchIndex.find({
      item_type: itemType
    })
    .sort({ popularity_score: -1, last_updated: -1 })
    .limit(limit)
    .lean();

    return trending.map(item => ({
      item_id: item.item_id,
      item_type: item.item_type,
      title: item.title,
      description: item.description,
      score: item.popularity_score,
      reason: '熱門推薦',
      metadata: {
        categories: item.categories,
        tags: item.tags,
        popularity_score: item.popularity_score
      }
    }));
  } catch (error) {
    console.error('熱門推薦錯誤:', error);
    return [];
  }
};

// 獲取相似項目
const getSimilarItems = async (req, res) => {
  try {
    const { item_id, item_type = 'product', limit = 5 } = req.query;
    
    if (!item_id) {
      return res.status(400).json({
        success: false,
        message: '缺少項目ID參數'
      });
    }

    // 獲取參考項目
    const referenceItem = await SearchIndex.findOne({
      item_id: item_id,
      item_type: item_type
    });

    if (!referenceItem) {
      return res.status(404).json({
        success: false,
        message: '找不到參考項目'
      });
    }

    // 找到相似項目
    const similarItems = await findSimilarItems(referenceItem, item_type, limit);

    res.json({
      success: true,
      data: {
        reference_item: {
          item_id: referenceItem.item_id,
          title: referenceItem.title,
          description: referenceItem.description
        },
        similar_items: similarItems
      }
    });
  } catch (error) {
    console.error('獲取相似項目錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取相似項目時發生錯誤'
    });
  }
};

// 獲取個人化推薦
const getPersonalizedRecommendations = async (req, res) => {
  try {
    const { type = 'hybrid', limit = 10 } = req.query;
    const userId = req.user.userId;

    const recommendations = await getHybridRecommendations(userId, 'product', limit);

    res.json({
      success: true,
      data: {
        recommendations: recommendations,
        type: 'personalized',
        total: recommendations.length
      }
    });
  } catch (error) {
    console.error('獲取個人化推薦錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取個人化推薦時發生錯誤'
    });
  }
};

// 獲取熱門項目
const getTrendingItems = async (req, res) => {
  try {
    const { period = 'week', limit = 10 } = req.query;
    
    const recommendations = await getTrendingRecommendations('product', limit);

    res.json({
      success: true,
      data: {
        period: period,
        trending_items: recommendations
      }
    });
  } catch (error) {
    console.error('獲取熱門項目錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取熱門項目時發生錯誤'
    });
  }
};

// 記錄推薦點擊
const recordClick = async (req, res) => {
  try {
    const { item_id, recommendation_type, score } = req.body;
    const userId = req.user.userId;
    const sessionId = req.headers['x-session-id'] || uuidv4();

    await RecommendationLog.findOneAndUpdate(
      {
        user_id: userId,
        item_id: item_id,
        recommendation_type: recommendation_type,
        session_id: sessionId
      },
      {
        clicked: true,
        clicked_at: new Date()
      },
      { upsert: true }
    );

    res.json({
      success: true,
      message: '點擊記錄成功'
    });
  } catch (error) {
    console.error('記錄推薦點擊錯誤:', error);
    res.status(500).json({
      success: false,
      message: '記錄推薦點擊時發生錯誤'
    });
  }
};

// 獲取推薦分析
const getRecommendationAnalytics = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    const matchConditions = {};
    if (start_date && end_date) {
      matchConditions.created_at = {
        $gte: new Date(start_date),
        $lte: new Date(end_date)
      };
    }

    const analytics = await RecommendationLog.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: '$recommendation_type',
          total_recommendations: { $sum: 1 },
          total_clicks: { $sum: { $cond: ['$clicked', 1, 0] } },
          avg_score: { $avg: '$score' },
          unique_users: { $addToSet: '$user_id' }
        }
      },
      {
        $project: {
          recommendation_type: '$_id',
          total_recommendations: 1,
          total_clicks: 1,
          click_through_rate: {
            $round: [
              { $divide: ['$total_clicks', '$total_recommendations'] },
              4
            ]
          },
          avg_score: { $round: ['$avg_score', 4] },
          unique_user_count: { $size: '$unique_users' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        period: {
          start_date: start_date,
          end_date: end_date
        },
        analytics: analytics
      }
    });
  } catch (error) {
    console.error('獲取推薦分析錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取推薦分析時發生錯誤'
    });
  }
};

// 輔助函數：找到相似用戶
const findSimilarUsers = async (userId, userBehaviors) => {
  // 簡化實現，實際應該使用更複雜的相似性算法
  const userItems = userBehaviors.map(b => b.item_id);
  
  const similarUsers = await UserBehavior.aggregate([
    {
      $match: {
        user_id: { $ne: userId },
        item_id: { $in: userItems },
        action: { $in: ['view', 'click', 'purchase'] }
      }
    },
    {
      $group: {
        _id: '$user_id',
        common_items: { $sum: 1 }
      }
    },
    {
      $sort: { common_items: -1 }
    },
    {
      $limit: 10
    }
  ]);

  return similarUsers.map(u => u._id);
};

// 輔助函數：基於相似用戶獲取推薦
const getRecommendationsFromSimilarUsers = async (similarUsers, userId, itemType, limit) => {
  const recommendations = await UserBehavior.aggregate([
    {
      $match: {
        user_id: { $in: similarUsers },
        item_type: itemType,
        action: { $in: ['view', 'click', 'purchase'] }
      }
    },
    {
      $group: {
        _id: '$item_id',
        score: { $sum: 1 }
      }
    },
    {
      $sort: { score: -1 }
    },
    {
      $limit: limit
    }
  ]);

  // 獲取項目詳情
  const itemIds = recommendations.map(r => r._id);
  const items = await SearchIndex.find({
    item_id: { $in: itemIds },
    item_type: itemType
  }).lean();

  return items.map(item => ({
    item_id: item.item_id,
    item_type: item.item_type,
    title: item.title,
    description: item.description,
    score: recommendations.find(r => r._id === item.item_id)?.score / 10 || 0,
    reason: '基於相似用戶的喜好',
    metadata: {
      categories: item.categories,
      tags: item.tags
    }
  }));
};

// 輔助函數：找到相似項目
const findSimilarItems = async (referenceItem, itemType, limit) => {
  const similarItems = await SearchIndex.find({
    item_id: { $ne: referenceItem.item_id },
    item_type: itemType,
    $or: [
      { categories: { $in: referenceItem.categories } },
      { tags: { $in: referenceItem.tags } }
    ]
  })
  .sort({ popularity_score: -1 })
  .limit(limit)
  .lean();

  return similarItems.map(item => ({
    item_id: item.item_id,
    item_type: item.item_type,
    title: item.title,
    description: item.description,
    score: calculateSimilarityScore(referenceItem, item),
    reason: '內容相似性',
    metadata: {
      categories: item.categories,
      tags: item.tags
    }
  }));
};

// 輔助函數：計算用戶行為權重
const calculateUserItemWeights = (userBehaviors) => {
  const weights = {};
  const actionWeights = {
    'purchase': 5,
    'add_to_cart': 3,
    'like': 2,
    'click': 1,
    'view': 0.5
  };
  
  userBehaviors.forEach(behavior => {
    const itemId = behavior.item_id;
    const weight = actionWeights[behavior.action] || 0;
    const timeDecay = Math.exp(-0.1 * (Date.now() - new Date(behavior.created_at).getTime()) / (1000 * 60 * 60 * 24)); // 時間衰減
    
    if (!weights[itemId]) {
      weights[itemId] = 0;
    }
    weights[itemId] += weight * timeDecay;
  });
  
  return weights;
};

// 輔助函數：改進的相似用戶查找
const findSimilarUsersImproved = async (userId, userItemWeights) => {
  const userItems = Object.keys(userItemWeights);
  
  if (userItems.length === 0) return [];
  
  const similarUsers = await UserBehavior.aggregate([
    {
      $match: {
        user_id: { $ne: userId },
        item_id: { $in: userItems },
        action: { $in: ['view', 'click', 'purchase', 'add_to_cart', 'like'] }
      }
    },
    {
      $group: {
        _id: '$user_id',
        behaviors: {
          $push: {
            item_id: '$item_id',
            action: '$action',
            created_at: '$created_at'
          }
        }
      }
    },
    {
      $addFields: {
        similarity_score: {
          $let: {
            vars: {
              userBehaviors: '$behaviors'
            },
            in: {
              $divide: [
                {
                  $sum: {
                    $map: {
                      input: '$userBehaviors',
                      as: 'behavior',
                      in: {
                        $cond: [
                          { $in: ['$$behavior.item_id', userItems] },
                          {
                            $multiply: [
                              { $switch: {
                                branches: [
                                  { case: { $eq: ['$$behavior.action', 'purchase'] }, then: 5 },
                                  { case: { $eq: ['$$behavior.action', 'add_to_cart'] }, then: 3 },
                                  { case: { $eq: ['$$behavior.action', 'like'] }, then: 2 },
                                  { case: { $eq: ['$$behavior.action', 'click'] }, then: 1 },
                                  { case: { $eq: ['$$behavior.action', 'view'] }, then: 0.5 }
                                ],
                                default: 0
                              }},
                              userItemWeights['$$behavior.item_id'] || 0
                            ]
                          },
                          0
                        ]
                      }
                    }
                  }
                },
                { $size: '$behaviors' }
              ]
            }
          }
        }
      }
    },
    {
      $sort: { similarity_score: -1 }
    },
    {
      $limit: 20
    }
  ]);

  return similarUsers.map(u => ({
    user_id: u._id,
    similarity_score: u.similarity_score
  }));
};

// 輔助函數：改進的基於相似用戶推薦
const getRecommendationsFromSimilarUsersImproved = async (similarUsers, userId, itemType, limit) => {
  const similarUserIds = similarUsers.map(u => u.user_id);
  
  const recommendations = await UserBehavior.aggregate([
    {
      $match: {
        user_id: { $in: similarUserIds },
        item_type: itemType,
        action: { $in: ['view', 'click', 'purchase', 'add_to_cart', 'like'] }
      }
    },
    {
      $group: {
        _id: '$item_id',
        total_score: {
          $sum: {
            $switch: {
              branches: [
                { case: { $eq: ['$action', 'purchase'] }, then: 5 },
                { case: { $eq: ['$action', 'add_to_cart'] }, then: 3 },
                { case: { $eq: ['$action', 'like'] }, then: 2 },
                { case: { $eq: ['$action', 'click'] }, then: 1 },
                { case: { $eq: ['$action', 'view'] }, then: 0.5 }
              ],
              default: 0
            }
          }
        },
        user_count: { $addToSet: '$user_id' }
      }
    },
    {
      $addFields: {
        avg_score: { $divide: ['$total_score', { $size: '$user_count' }] }
      }
    },
    {
      $sort: { avg_score: -1 }
    },
    {
      $limit: limit * 2 // 獲取更多候選項目
    }
  ]);

  // 獲取項目詳情
  const itemIds = recommendations.map(r => r._id);
  const items = await SearchIndex.find({
    item_id: { $in: itemIds },
    item_type: itemType
  }).lean();

  // 排除用戶已經互動過的項目
  const userInteractedItems = await UserBehavior.distinct('item_id', {
    user_id: userId,
    item_type: itemType
  });

  return items
    .filter(item => !userInteractedItems.includes(item.item_id))
    .map(item => {
      const rec = recommendations.find(r => r._id === item.item_id);
      return {
        item_id: item.item_id,
        item_type: item.item_type,
        title: item.title,
        description: item.description,
        score: Math.min((rec?.avg_score || 0) / 10, 1),
        reason: '基於相似用戶的喜好',
        metadata: {
          categories: item.categories,
          tags: item.tags,
          popularity_score: item.popularity_score
        }
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
};

// 輔助函數：計算相似性分數
const calculateSimilarityScore = (item1, item2) => {
  let score = 0;
  
  // 分類相似性
  if (item1.categories && item2.categories) {
    const commonCategories = item1.categories.filter(cat => 
      item2.categories.includes(cat)
    );
    score += commonCategories.length / Math.max(item1.categories.length, item2.categories.length) * 0.5;
  }
  
  // 標籤相似性
  if (item1.tags && item2.tags) {
    const commonTags = item1.tags.filter(tag => 
      item2.tags.includes(tag)
    );
    score += commonTags.length / Math.max(item1.tags.length, item2.tags.length) * 0.3;
  }
  
  // 流行度加成
  score += item2.popularity_score * 0.2;
  
  return Math.min(score, 1);
};

module.exports = {
  getRecommendations,
  getSimilarItems,
  getPersonalizedRecommendations,
  getTrendingItems,
  recordClick,
  getRecommendationAnalytics,
  initializeVectorRecommendationService
};
