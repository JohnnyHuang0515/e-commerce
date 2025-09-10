const MilvusManager = require('../models/milvusManager');
const AIModelManager = require('../models/aiModelManager');
const RedisCacheManager = require('../models/redisCacheManager');
const logger = require('../utils/logger');

class VectorSearchService {
  constructor(settings) {
    this.settings = settings;
    this.milvusManager = new MilvusManager(settings);
    this.aiModelManager = new AIModelManager(settings);
    this.redisCacheManager = new RedisCacheManager(settings);
    this.initialized = false;
  }

  async initialize() {
    try {
      logger.info('🔄 初始化向量搜尋服務...');
      
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

      // 創建集合
      await this.milvusManager.createCollection();
      
      // 創建索引
      await this.milvusManager.createIndex();
      
      // 載入集合
      await this.milvusManager.loadCollection();

      this.initialized = true;
      logger.info('✅ 向量搜尋服務初始化完成');
      return true;
    } catch (error) {
      logger.error('❌ 向量搜尋服務初始化失敗:', error);
      return false;
    }
  }

  async searchProducts(query, options = {}) {
    try {
      if (!this.initialized) {
        throw new Error('向量搜尋服務未初始化');
      }

      const {
        limit = 20,
        threshold = 0.7,
        filters = {},
        userId = null
      } = options;

      logger.info(`🔍 搜尋商品: "${query}"`);

      // 檢查快取
      const cachedResults = await this.redisCacheManager.getCachedSearchResult(query);
      if (cachedResults) {
        logger.info(`🎯 搜尋快取命中: "${query}"`);
        return {
          success: true,
          query: query,
          results: cachedResults.slice(0, limit),
          total: cachedResults.length,
          filters: filters,
          cached: true
        };
      }

      // 生成查詢向量
      const queryVector = await this.aiModelManager.encodeText(query);
      if (!queryVector) {
        throw new Error('查詢向量生成失敗');
      }

      // 在 Milvus 中搜尋
      const searchResults = await this.milvusManager.searchVectors(
        queryVector,
        limit * 2, // 獲取更多結果以便過濾
        threshold
      );

      // 應用額外過濾器
      let filteredResults = searchResults;
      if (Object.keys(filters).length > 0) {
        filteredResults = this.applyFilters(searchResults, filters);
      }

      // 限制結果數量
      const finalResults = filteredResults.slice(0, limit);

      // 快取搜尋結果
      await this.redisCacheManager.cacheSearchResult(query, finalResults);

      // 記錄搜尋日誌
      if (userId) {
        await this.logSearchActivity(userId, query, finalResults.length);
      }

      return {
        success: true,
        query: query,
        results: finalResults,
        total: finalResults.length,
        filters: filters,
        cached: false
      };
    } catch (error) {
      logger.error('❌ 商品搜尋失敗:', error);
      return {
        success: false,
        query: query,
        results: [],
        total: 0,
        error: error.message
      };
    }
  }

  async indexProduct(productData) {
    try {
      if (!this.initialized) {
        throw new Error('向量搜尋服務未初始化');
      }

      logger.info(`📝 索引商品: ${productData.id}`);

      // 檢查快取中是否已有嵌入向量
      let embedding = await this.redisCacheManager.getCachedProductEmbedding(productData.id);
      
      if (!embedding) {
        // 創建商品嵌入向量
        embedding = await this.aiModelManager.createProductEmbedding(productData);
        if (!embedding) {
          throw new Error('商品嵌入向量生成失敗');
        }
        
        // 快取嵌入向量
        await this.redisCacheManager.cacheProductEmbedding(productData.id, embedding);
      } else {
        logger.info(`🎯 使用快取的嵌入向量: ${productData.id}`);
      }

      // 準備元數據
      const metadata = {
        name: productData.name,
        description: productData.description,
        category: productData.category,
        brand: productData.brand,
        price: productData.price,
        tags: productData.tags,
        image_url: productData.image_url,
        created_at: new Date().toISOString()
      };

      // 插入到 Milvus
      await this.milvusManager.insertVectors(
        [embedding],
        [productData.id],
        [metadata]
      );

      logger.info(`✅ 商品 ${productData.id} 索引成功`);
      return {
        success: true,
        product_id: productData.id,
        message: '商品索引成功'
      };
    } catch (error) {
      logger.error(`❌ 商品 ${productData.id} 索引失敗:`, error);
      return {
        success: false,
        product_id: productData.id,
        error: error.message
      };
    }
  }

  async batchIndexProducts(products) {
    try {
      if (!this.initialized) {
        throw new Error('向量搜尋服務未初始化');
      }

      logger.info(`📝 批量索引 ${products.length} 個商品`);

      const embeddings = [];
      const productIds = [];
      const metadataList = [];

      for (const product of products) {
        const embedding = await this.aiModelManager.createProductEmbedding(product);
        if (embedding) {
          embeddings.push(embedding);
          productIds.push(product.id);
          metadataList.push({
            name: product.name,
            description: product.description,
            category: product.category,
            brand: product.brand,
            price: product.price,
            tags: product.tags,
            image_url: product.image_url,
            created_at: new Date().toISOString()
          });
        }
      }

      if (embeddings.length > 0) {
        await this.milvusManager.insertVectors(embeddings, productIds, metadataList);
        logger.info(`✅ 批量索引 ${embeddings.length} 個商品成功`);
      }

      return {
        success: true,
        indexed: embeddings.length,
        total: products.length,
        message: `成功索引 ${embeddings.length}/${products.length} 個商品`
      };
    } catch (error) {
      logger.error('❌ 批量索引失敗:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async removeProduct(productId) {
    try {
      if (!this.initialized) {
        throw new Error('向量搜尋服務未初始化');
      }

      await this.milvusManager.deleteVectors([productId]);
      
      // 清理相關快取
      await this.redisCacheManager.invalidateProductCache(productId);
      
      logger.info(`✅ 商品 ${productId} 已從索引中移除`);
      
      return {
        success: true,
        product_id: productId,
        message: '商品已從索引中移除'
      };
    } catch (error) {
      logger.error(`❌ 移除商品 ${productId} 失敗:`, error);
      return {
        success: false,
        product_id: productId,
        error: error.message
      };
    }
  }

  async getSimilarProducts(productId, limit = 10) {
    try {
      if (!this.initialized) {
        throw new Error('向量搜尋服務未初始化');
      }

      // 獲取商品信息（這裡需要從商品服務獲取）
      // 暫時使用模擬數據
      const productData = {
        id: productId,
        name: '示例商品',
        description: '示例商品描述',
        category: '電子產品'
      };

      // 生成商品向量
      const productVector = await this.aiModelManager.createProductEmbedding(productData);
      if (!productVector) {
        throw new Error('商品向量生成失敗');
      }

      // 搜尋相似商品
      const similarProducts = await this.milvusManager.searchVectors(
        productVector,
        limit + 1, // +1 因為會包含自己
        0.5
      );

      // 過濾掉自己
      const filteredResults = similarProducts.filter(item => item.product_id !== productId);

      return {
        success: true,
        product_id: productId,
        similar_products: filteredResults.slice(0, limit),
        total: filteredResults.length
      };
    } catch (error) {
      logger.error(`❌ 獲取相似商品失敗:`, error);
      return {
        success: false,
        product_id: productId,
        error: error.message
      };
    }
  }

  applyFilters(results, filters) {
    return results.filter(result => {
      const metadata = result.metadata || {};
      
      // 分類過濾
      if (filters.category && metadata.category !== filters.category) {
        return false;
      }
      
      // 品牌過濾
      if (filters.brand && metadata.brand !== filters.brand) {
        return false;
      }
      
      // 價格範圍過濾
      if (filters.price_min && metadata.price < filters.price_min) {
        return false;
      }
      
      if (filters.price_max && metadata.price > filters.price_max) {
        return false;
      }
      
      // 標籤過濾
      if (filters.tags && Array.isArray(filters.tags)) {
        const productTags = metadata.tags || [];
        const hasMatchingTag = filters.tags.some(tag => 
          productTags.includes(tag)
        );
        if (!hasMatchingTag) {
          return false;
        }
      }
      
      return true;
    });
  }

  async logSearchActivity(userId, query, resultCount) {
    try {
      // 這裡可以記錄搜尋活動到日誌或資料庫
      logger.info(`🔍 用戶 ${userId} 搜尋 "${query}"，找到 ${resultCount} 個結果`);
    } catch (error) {
      logger.error('❌ 記錄搜尋活動失敗:', error);
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
      logger.error('❌ 獲取服務統計失敗:', error);
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
      logger.info('✅ 向量搜尋服務清理完成');
    } catch (error) {
      logger.error('❌ 向量搜尋服務清理失敗:', error);
    }
  }
}

module.exports = VectorSearchService;
