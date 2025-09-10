const MilvusManager = require('../models/milvusManager');
const AIModelManager = require('../models/aiModelManager');
const RedisCacheManager = require('../models/redisCacheManager');
const { UserBehavior, RecommendationLog } = require('../models');
const logger = require('../utils/logger');

class VectorRecommendationService {
  constructor(settings) {
    this.settings = settings;
    this.milvusManager = new MilvusManager(settings);
    this.aiModelManager = new AIModelManager(settings);
    this.redisCacheManager = new RedisCacheManager(settings);
    this.initialized = false;
  }

  async initialize() {
    try {
      logger.info('🔄 初始化向量推薦服務...');
      
      // 連接 Milvus
      const milvusConnected = await this.milvusManager.connect();
      if (!milvusConnected) {
        throw new Error('Milvus 連接失敗');
      }

      // 載入 AI 模型
      const modelLoaded = await this.aiModelManager.loadModel();
      if (!modelLoaded) {
        throw new Error('AI 模型載入失敗');
      }

      // 連接 Redis 快取
      const redisConnected = await this.redisCacheManager.connect();
      if (!redisConnected) {
        logger.warn('⚠️ Redis 快取連接失敗，將繼續運行但無快取功能');
      }

      // 創建用戶向量集合
      await this.createUserVectorCollection();

      this.initialized = true;
      logger.info('✅ 向量推薦服務初始化完成');
      return true;
    } catch (error) {
      logger.error('❌ 向量推薦服務初始化失敗:', error);
      return false;
    }
  }

  async createUserVectorCollection() {
    try {
      const userCollectionName = 'user_vectors';
      
      // 檢查集合是否存在
      const collections = await this.milvusManager.client.listCollections();
      if (collections.collection_names.includes(userCollectionName)) {
        logger.info(`📦 用戶向量集合 ${userCollectionName} 已存在`);
        return true;
      }

      // 創建用戶向量集合
      const collectionSchema = {
        collection_name: userCollectionName,
        description: '用戶行為向量集合，用於協同過濾推薦',
        fields: [
          {
            name: 'id',
            data_type: 'Int64',
            is_primary_key: true,
            auto_id: true
          },
          {
            name: 'user_id',
            data_type: 'VarChar',
            max_length: 100
          },
          {
            name: 'vector',
            data_type: 'FloatVector',
            dim: this.settings.milvus.dimension || 384
          },
          {
            name: 'metadata',
            data_type: 'JSON'
          },
          {
            name: 'created_at',
            data_type: 'Int64'
          }
        ]
      };

      await this.milvusManager.client.createCollection(collectionSchema);
      
      // 創建索引
      const indexParams = {
        collection_name: userCollectionName,
        field_name: 'vector',
        index_type: 'IVF_FLAT',
        metric_type: 'COSINE',
        params: { nlist: 1024 }
      };
      
      await this.milvusManager.client.createIndex(indexParams);
      await this.milvusManager.client.loadCollection({ collection_name: userCollectionName });
      
      logger.info(`✅ 創建用戶向量集合 ${userCollectionName} 成功`);
      return true;
    } catch (error) {
      logger.error('❌ 創建用戶向量集合失敗:', error);
      return false;
    }
  }

  async getPersonalizedRecommendations(userId, options = {}) {
    try {
      if (!this.initialized) {
        throw new Error('向量推薦服務未初始化');
      }

      const {
        limit = 10,
        recommendationType = 'hybrid',
        itemType = 'product'
      } = options;

      logger.info(`🎯 為用戶 ${userId} 生成個人化推薦`);

      // 檢查快取
      const cachedRecommendations = await this.redisCacheManager.getCachedUserRecommendations(userId, recommendationType);
      if (cachedRecommendations) {
        logger.info(`🎯 推薦快取命中: 用戶 ${userId}, 類型 ${recommendationType}`);
        return {
          success: true,
          user_id: userId,
          recommendations: cachedRecommendations.slice(0, limit),
          type: recommendationType,
          total: cachedRecommendations.length,
          cached: true,
          timestamp: new Date().toISOString()
        };
      }

      let recommendations = [];

      switch (recommendationType) {
        case 'collaborative':
          recommendations = await this.getCollaborativeRecommendations(userId, itemType, limit);
          break;
        case 'content_based':
          recommendations = await this.getContentBasedRecommendations(userId, itemType, limit);
          break;
        case 'hybrid':
        default:
          recommendations = await this.getHybridRecommendations(userId, itemType, limit);
          break;
      }

      // 快取推薦結果
      await this.redisCacheManager.cacheUserRecommendations(userId, recommendations, recommendationType);

      // 記錄推薦日誌
      await this.logRecommendations(userId, recommendations, recommendationType);

      return {
        success: true,
        user_id: userId,
        recommendations: recommendations,
        type: recommendationType,
        total: recommendations.length,
        cached: false,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`❌ 為用戶 ${userId} 生成推薦失敗:`, error);
      return {
        success: false,
        user_id: userId,
        error: error.message
      };
    }
  }

  async getCollaborativeRecommendations(userId, itemType, limit) {
    try {
      // 獲取用戶行為數據
      const userBehaviors = await UserBehavior.find({
        user_id: userId,
        action: { $in: ['view', 'click', 'purchase', 'add_to_cart', 'like'] }
      }).sort({ created_at: -1 }).limit(200);

      if (userBehaviors.length === 0) {
        return await this.getTrendingRecommendations(itemType, limit);
      }

      // 創建用戶行為向量
      const userVector = await this.createUserBehaviorVector(userBehaviors);
      if (!userVector) {
        return await this.getTrendingRecommendations(itemType, limit);
      }

      // 在用戶向量集合中搜尋相似用戶
      const similarUsers = await this.findSimilarUsers(userVector, limit * 2);
      
      if (similarUsers.length === 0) {
        return await this.getTrendingRecommendations(itemType, limit);
      }

      // 基於相似用戶的行為推薦商品
      const recommendations = await this.getRecommendationsFromSimilarUsers(
        similarUsers, userId, itemType, limit
      );

      return recommendations;
    } catch (error) {
      logger.error('❌ 協同過濾推薦失敗:', error);
      return [];
    }
  }

  async getContentBasedRecommendations(userId, itemType, limit) {
    try {
      // 獲取用戶喜歡的商品
      const likedItems = await UserBehavior.find({
        user_id: userId,
        action: { $in: ['like', 'purchase', 'click'] },
        item_type: itemType
      }).sort({ created_at: -1 }).limit(50);

      if (likedItems.length === 0) {
        return await this.getTrendingRecommendations(itemType, limit);
      }

      // 基於用戶喜歡的商品推薦相似商品
      const recommendations = [];
      const processedItems = new Set();

      for (const item of likedItems.slice(0, 5)) { // 只取前5個喜歡的商品
        if (processedItems.has(item.item_id)) continue;
        processedItems.add(item.item_id);

        const similarItems = await this.getSimilarProducts(item.item_id, 3);
        recommendations.push(...similarItems);
      }

      // 去重並排序
      const uniqueRecommendations = this.deduplicateRecommendations(recommendations);
      return uniqueRecommendations.slice(0, limit);
    } catch (error) {
      logger.error('❌ 內容推薦失敗:', error);
      return [];
    }
  }

  async getHybridRecommendations(userId, itemType, limit) {
    try {
      // 獲取協同過濾推薦
      const collaborativeRecs = await this.getCollaborativeRecommendations(
        userId, itemType, Math.ceil(limit / 2)
      );
      
      // 獲取內容推薦
      const contentRecs = await this.getContentBasedRecommendations(
        userId, itemType, Math.ceil(limit / 2)
      );
      
      // 合併推薦結果
      const allRecs = [...collaborativeRecs, ...contentRecs];
      const uniqueRecs = this.deduplicateRecommendations(allRecs);
      
      // 重新計算分數
      const hybridRecs = uniqueRecs.map(rec => ({
        ...rec,
        score: rec.score * 0.7 + Math.random() * 0.3, // 混合分數
        reason: '混合推薦算法'
      }));
      
      return hybridRecs
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    } catch (error) {
      logger.error('❌ 混合推薦失敗:', error);
      return [];
    }
  }

  async getTrendingRecommendations(itemType, limit) {
    try {
      // 獲取熱門商品（基於用戶行為統計）
      const trendingItems = await UserBehavior.aggregate([
        {
          $match: {
            item_type: itemType,
            action: { $in: ['view', 'click', 'purchase', 'add_to_cart'] }
          }
        },
        {
          $group: {
            _id: '$item_id',
            score: { $sum: 1 },
            last_action: { $max: '$created_at' }
          }
        },
        {
          $sort: { score: -1, last_action: -1 }
        },
        {
          $limit: limit
        }
      ]);

      return trendingItems.map(item => ({
        item_id: item._id,
        item_type: itemType,
        score: Math.min(item.score / 100, 1), // 正規化分數
        reason: '熱門推薦',
        metadata: {
          popularity_score: item.score,
          last_action: item.last_action
        }
      }));
    } catch (error) {
      logger.error('❌ 熱門推薦失敗:', error);
      return [];
    }
  }

  async createUserBehaviorVector(userBehaviors) {
    try {
      // 分析用戶行為模式
      const behaviorData = {
        categories: [],
        brands: [],
        priceRange: 'medium',
        actions: {}
      };

      // 統計用戶行為
      userBehaviors.forEach(behavior => {
        behaviorData.actions[behavior.action] = 
          (behaviorData.actions[behavior.action] || 0) + 1;
      });

      // 創建用戶行為嵌入向量
      const userVector = await this.aiModelManager.createUserEmbedding(behaviorData);
      return userVector;
    } catch (error) {
      logger.error('❌ 創建用戶行為向量失敗:', error);
      return null;
    }
  }

  async findSimilarUsers(userVector, limit) {
    try {
      const searchParams = {
        collection_name: 'user_vectors',
        data: [userVector],
        anns_field: 'vector',
        param: {
          metric_type: 'COSINE',
          params: { nprobe: 10 }
        },
        limit: limit,
        output_fields: ['user_id', 'metadata']
      };

      const results = await this.milvusManager.client.search(searchParams);
      
      const similarUsers = [];
      if (results.results && results.results.length > 0) {
        for (const hit of results.results[0]) {
          similarUsers.push({
            user_id: hit.entity.user_id,
            similarity_score: hit.score,
            metadata: hit.entity.metadata
          });
        }
      }

      return similarUsers;
    } catch (error) {
      logger.error('❌ 搜尋相似用戶失敗:', error);
      return [];
    }
  }

  async getRecommendationsFromSimilarUsers(similarUsers, userId, itemType, limit) {
    try {
      const similarUserIds = similarUsers.map(u => u.user_id);
      
      // 獲取相似用戶喜歡的商品
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
          $limit: limit * 2
        }
      ]);

      // 排除用戶已經互動過的項目
      const userInteractedItems = await UserBehavior.distinct('item_id', {
        user_id: userId,
        item_type: itemType
      });

      return recommendations
        .filter(rec => !userInteractedItems.includes(rec._id))
        .slice(0, limit)
        .map(rec => ({
          item_id: rec._id,
          item_type: itemType,
          score: Math.min((rec.avg_score || 0) / 10, 1),
          reason: '基於相似用戶的喜好',
          metadata: {
            avg_score: rec.avg_score,
            user_count: rec.user_count.length
          }
        }));
    } catch (error) {
      logger.error('❌ 基於相似用戶推薦失敗:', error);
      return [];
    }
  }

  async getSimilarProducts(productId, limit) {
    try {
      // 這裡需要從商品服務獲取商品信息
      // 暫時使用模擬數據
      const productData = {
        id: productId,
        name: '示例商品',
        description: '示例商品描述',
        category: '電子產品'
      };

      const productVector = await this.aiModelManager.createProductEmbedding(productData);
      if (!productVector) {
        return [];
      }

      const searchResults = await this.milvusManager.searchVectors(
        productVector,
        limit + 1, // +1 因為會包含自己
        0.5
      );

      return searchResults
        .filter(item => item.product_id !== productId)
        .slice(0, limit)
        .map(item => ({
          item_id: item.product_id,
          score: item.score,
          reason: '內容相似性',
          metadata: item.metadata
        }));
    } catch (error) {
      logger.error(`❌ 獲取相似商品失敗:`, error);
      return [];
    }
  }

  deduplicateRecommendations(recommendations) {
    const seen = new Set();
    return recommendations.filter(rec => {
      if (seen.has(rec.item_id)) {
        return false;
      }
      seen.add(rec.item_id);
      return true;
    });
  }

  async logRecommendations(userId, recommendations, recommendationType) {
    try {
      const logs = recommendations.map(rec => ({
        user_id: userId,
        item_id: rec.item_id,
        item_type: rec.item_type || 'product',
        recommendation_type: recommendationType,
        score: rec.score,
        reason: rec.reason,
        session_id: `session_${Date.now()}_${userId}`
      }));

      await RecommendationLog.insertMany(logs);
      logger.info(`📝 記錄了 ${logs.length} 個推薦日誌`);
    } catch (error) {
      logger.error('❌ 記錄推薦日誌失敗:', error);
    }
  }

  async updateUserVector(userId) {
    try {
      if (!this.initialized) {
        throw new Error('向量推薦服務未初始化');
      }

      // 獲取用戶最新行為數據
      const userBehaviors = await UserBehavior.find({
        user_id: userId
      }).sort({ created_at: -1 }).limit(100);

      if (userBehaviors.length === 0) {
        return { success: false, message: '用戶無行為數據' };
      }

      // 檢查快取中是否已有用戶向量
      let userVector = await this.redisCacheManager.getCachedUserVector(userId);
      
      if (!userVector) {
        // 創建用戶向量
        userVector = await this.createUserBehaviorVector(userBehaviors);
        if (!userVector) {
          return { success: false, message: '用戶向量創建失敗' };
        }
        
        // 快取用戶向量
        await this.redisCacheManager.cacheUserVector(userId, userVector);
      } else {
        logger.info(`🎯 使用快取的用戶向量: ${userId}`);
      }

      // 準備元數據
      const metadata = {
        user_id: userId,
        behavior_count: userBehaviors.length,
        last_updated: new Date().toISOString(),
        categories: [...new Set(userBehaviors.map(b => b.metadata?.category).filter(Boolean))],
        brands: [...new Set(userBehaviors.map(b => b.metadata?.brand).filter(Boolean))]
      };

      // 插入或更新用戶向量
      await this.milvusManager.client.insert({
        collection_name: 'user_vectors',
        data: [
          [userId],
          [userVector],
          [metadata],
          [Date.now()]
        ]
      });

      // 清理用戶相關快取
      await this.redisCacheManager.invalidateUserCache(userId);
      
      logger.info(`✅ 更新用戶 ${userId} 向量成功`);
      return { success: true, message: '用戶向量更新成功' };
    } catch (error) {
      logger.error(`❌ 更新用戶 ${userId} 向量失敗:`, error);
      return { success: false, error: error.message };
    }
  }

  async getServiceStats() {
    try {
      const milvusStats = await this.milvusManager.getCollectionStats();
      const modelInfo = await this.aiModelManager.getModelInfo();
      const cacheStats = await this.redisCacheManager.getCacheStats();
      
      return {
        success: true,
        milvus: milvusStats,
        ai_model: modelInfo,
        redis_cache: cacheStats,
        initialized: this.initialized,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('❌ 獲取推薦服務統計失敗:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async cleanup() {
    try {
      await this.milvusManager.disconnect();
      await this.redisCacheManager.disconnect();
      logger.info('✅ 向量推薦服務清理完成');
    } catch (error) {
      logger.error('❌ 向量推薦服務清理失敗:', error);
    }
  }
}

module.exports = VectorRecommendationService;
