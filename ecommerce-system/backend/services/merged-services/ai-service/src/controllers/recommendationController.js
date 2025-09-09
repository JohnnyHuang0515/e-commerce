const { RecommendationLog, UserBehavior, SearchIndex } = require('../models');
const { v4: uuidv4 } = require('uuid');

// 獲取推薦項目
const getRecommendations = async (req, res) => {
  try {
    const { type = 'hybrid', limit = 10, item_type = 'product' } = req.query;
    const userId = req.user.userId;
    const sessionId = req.headers['x-session-id'] || uuidv4();

    let recommendations = [];

    switch (type) {
      case 'collaborative':
        recommendations = await getCollaborativeRecommendations(userId, item_type, limit);
        break;
      case 'content_based':
        recommendations = await getContentBasedRecommendations(userId, item_type, limit);
        break;
      case 'trending':
        recommendations = await getTrendingRecommendations(item_type, limit);
        break;
      case 'hybrid':
      default:
        recommendations = await getHybridRecommendations(userId, item_type, limit);
        break;
    }

    // 記錄推薦日誌
    for (const rec of recommendations) {
      const recommendationLog = new RecommendationLog({
        user_id: userId,
        item_id: rec.item_id,
        item_type: rec.item_type,
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
        total: recommendations.length
      }
    });
  } catch (error) {
    console.error('獲取推薦錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取推薦時發生錯誤'
    });
  }
};

// 協同過濾推薦
const getCollaborativeRecommendations = async (userId, itemType, limit) => {
  try {
    // 獲取用戶歷史行為
    const userBehaviors = await UserBehavior.find({
      user_id: userId,
      action: { $in: ['view', 'click', 'purchase'] }
    }).sort({ created_at: -1 }).limit(100);

    if (userBehaviors.length === 0) {
      return getTrendingRecommendations(itemType, limit);
    }

    // 找到相似用戶
    const similarUsers = await findSimilarUsers(userId, userBehaviors);
    
    // 基於相似用戶的行為推薦
    const recommendations = await getRecommendationsFromSimilarUsers(similarUsers, userId, itemType, limit);
    
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
  getRecommendationAnalytics
};
