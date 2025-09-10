const VectorSearchService = require('../services/vectorSearchService');
const logger = require('../utils/logger');

class SearchController {
  constructor() {
    this.vectorSearchService = null;
    this.initialized = false;
  }

  async initialize(settings) {
    try {
      this.vectorSearchService = new VectorSearchService(settings);
      this.initialized = await this.vectorSearchService.initialize();
      
      if (this.initialized) {
        logger.info('✅ 搜尋控制器初始化成功');
      } else {
        logger.error('❌ 搜尋控制器初始化失敗');
      }
      
      return this.initialized;
    } catch (error) {
      logger.error('❌ 搜尋控制器初始化錯誤:', error);
      return false;
    }
  }

  // 語意搜尋商品
  async searchProducts(req, res) {
    try {
      if (!this.initialized) {
        return res.status(503).json({
          success: false,
          message: '搜尋服務未初始化'
        });
      }

      const { query, limit = 20, threshold = 0.7, filters = {} } = req.body;
      const userId = req.user?.userId;

      if (!query || query.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: '搜尋關鍵字不能為空'
        });
      }

      const searchResult = await this.vectorSearchService.searchProducts(query, {
        limit: Math.min(limit, 100), // 限制最大搜尋數量
        threshold,
        filters,
        userId
      });

      res.json(searchResult);
    } catch (error) {
      logger.error('搜尋商品錯誤:', error);
      res.status(500).json({
        success: false,
        message: '搜尋時發生錯誤',
        error: error.message
      });
    }
  }

  // 獲取搜尋建議
  async getSearchSuggestions(req, res) {
    try {
      const { q: query, limit = 10 } = req.query;

      if (!query || query.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: '搜尋關鍵字不能為空'
        });
      }

      // 簡化的搜尋建議實現
      const suggestions = [
        `${query} 推薦`,
        `${query} 評價`,
        `${query} 價格`,
        `${query} 比較`,
        `${query} 優惠`
      ].slice(0, limit);

      res.json({
        success: true,
        query: query,
        suggestions: suggestions,
        total: suggestions.length
      });
    } catch (error) {
      logger.error('獲取搜尋建議錯誤:', error);
      res.status(500).json({
        success: false,
        message: '獲取搜尋建議時發生錯誤'
      });
    }
  }

  // 索引商品
  async indexProduct(req, res) {
    try {
      if (!this.initialized) {
        return res.status(503).json({
          success: false,
          message: '搜尋服務未初始化'
        });
      }

      const productData = req.body;

      if (!productData.id || !productData.name || !productData.description) {
        return res.status(400).json({
          success: false,
          message: '商品ID、名稱和描述為必填欄位'
        });
      }

      const indexResult = await this.vectorSearchService.indexProduct(productData);

      res.json(indexResult);
    } catch (error) {
      logger.error('索引商品錯誤:', error);
      res.status(500).json({
        success: false,
        message: '索引商品時發生錯誤',
        error: error.message
      });
    }
  }

  // 批量索引商品
  async batchIndexProducts(req, res) {
    try {
      if (!this.initialized) {
        return res.status(503).json({
          success: false,
          message: '搜尋服務未初始化'
        });
      }

      const { products } = req.body;

      if (!products || !Array.isArray(products) || products.length === 0) {
        return res.status(400).json({
          success: false,
          message: '商品列表不能為空'
        });
      }

      // 驗證商品數據
      const invalidProducts = products.filter(product => 
        !product.id || !product.name || !product.description
      );

      if (invalidProducts.length > 0) {
        return res.status(400).json({
          success: false,
          message: '部分商品缺少必要欄位（ID、名稱、描述）'
        });
      }

      const batchResult = await this.vectorSearchService.batchIndexProducts(products);

      res.json(batchResult);
    } catch (error) {
      logger.error('批量索引商品錯誤:', error);
      res.status(500).json({
        success: false,
        message: '批量索引商品時發生錯誤',
        error: error.message
      });
    }
  }

  // 移除商品索引
  async removeProduct(req, res) {
    try {
      if (!this.initialized) {
        return res.status(503).json({
          success: false,
          message: '搜尋服務未初始化'
        });
      }

      const { productId } = req.params;

      if (!productId) {
        return res.status(400).json({
          success: false,
          message: '商品ID不能為空'
        });
      }

      const removeResult = await this.vectorSearchService.removeProduct(productId);

      res.json(removeResult);
    } catch (error) {
      logger.error('移除商品索引錯誤:', error);
      res.status(500).json({
        success: false,
        message: '移除商品索引時發生錯誤',
        error: error.message
      });
    }
  }

  // 獲取相似商品
  async getSimilarProducts(req, res) {
    try {
      if (!this.initialized) {
        return res.status(503).json({
          success: false,
          message: '搜尋服務未初始化'
        });
      }

      const { productId } = req.params;
      const { limit = 10 } = req.query;

      if (!productId) {
        return res.status(400).json({
          success: false,
          message: '商品ID不能為空'
        });
      }

      const similarResult = await this.vectorSearchService.getSimilarProducts(
        productId, 
        Math.min(parseInt(limit), 50)
      );

      res.json(similarResult);
    } catch (error) {
      logger.error('獲取相似商品錯誤:', error);
      res.status(500).json({
        success: false,
        message: '獲取相似商品時發生錯誤',
        error: error.message
      });
    }
  }

  // 獲取搜尋統計
  async getSearchStats(req, res) {
    try {
      if (!this.initialized) {
        return res.status(503).json({
          success: false,
          message: '搜尋服務未初始化'
        });
      }

      const stats = await this.vectorSearchService.getServiceStats();

      res.json(stats);
    } catch (error) {
      logger.error('獲取搜尋統計錯誤:', error);
      res.status(500).json({
        success: false,
        message: '獲取搜尋統計時發生錯誤',
        error: error.message
      });
    }
  }

  // 獲取熱門搜尋
  async getTrending(req, res) {
    try {
      const { period = 'week', limit = 10 } = req.query;

      // 簡化的熱門搜尋實現
      const trendingSearches = [
        'iPhone 15',
        'MacBook Pro',
        'AirPods',
        'Samsung Galaxy',
        'iPad',
        'Nike 運動鞋',
        'Adidas 外套',
        'Uniqlo 襯衫',
        'Zara 裙子',
        'H&M 牛仔褲'
      ].slice(0, limit);

      res.json({
        success: true,
        period: period,
        trending_searches: trendingSearches,
        total: trendingSearches.length
      });
    } catch (error) {
      logger.error('獲取熱門搜尋錯誤:', error);
      res.status(500).json({
        success: false,
        message: '獲取熱門搜尋時發生錯誤'
      });
    }
  }

  // 獲取搜尋分析
  async getSearchAnalytics(req, res) {
    try {
      const { start_date, end_date } = req.query;

      // 簡化的搜尋分析實現
      const analytics = {
        total_searches: 1250,
        unique_users: 890,
        avg_results_per_search: 8.5,
        click_through_rate: 0.15,
        top_queries: [
          { query: 'iPhone 15', count: 45 },
          { query: 'MacBook Pro', count: 38 },
          { query: 'AirPods', count: 32 },
          { query: 'Samsung Galaxy', count: 28 },
          { query: 'iPad', count: 25 }
        ],
        period: {
          start_date: start_date,
          end_date: end_date
        }
      };

      res.json({
        success: true,
        analytics: analytics
      });
    } catch (error) {
      logger.error('獲取搜尋分析錯誤:', error);
      res.status(500).json({
        success: false,
        message: '獲取搜尋分析時發生錯誤'
      });
    }
  }

  // 記錄搜尋點擊
  async recordClick(req, res) {
    try {
      const { search_id, result_id, position } = req.body;
      const userId = req.user?.userId;

      if (!search_id || !result_id || position === undefined) {
        return res.status(400).json({
          success: false,
          message: '搜尋ID、結果ID和位置為必填欄位'
        });
      }

      // 記錄點擊事件（這裡可以存儲到資料庫）
      logger.info(`用戶 ${userId} 點擊了搜尋結果 ${result_id}，位置 ${position}`);

      res.json({
        success: true,
        message: '點擊記錄成功'
      });
    } catch (error) {
      logger.error('記錄搜尋點擊錯誤:', error);
      res.status(500).json({
        success: false,
        message: '記錄搜尋點擊時發生錯誤'
      });
    }
  }

  // 通用搜尋方法（向後兼容）
  async search(req, res) {
    // 將舊的搜尋格式轉換為新的格式
    const { query, search_type = 'product', filters = {}, limit = 10, offset = 0 } = req.body;
    
    // 轉換為新的搜尋請求格式
    req.body = {
      query,
      limit: limit + offset, // 調整限制以包含偏移
      filters
    };

    // 調用新的搜尋方法
    await this.searchProducts(req, res);
  }

  // 獲取建議（向後兼容）
  async getSuggestions(req, res) {
    // 轉換參數格式
    req.query.q = req.query.q || req.query.query;
    await this.getSearchSuggestions(req, res);
  }
}

// 創建單例實例
const searchController = new SearchController();

module.exports = searchController;