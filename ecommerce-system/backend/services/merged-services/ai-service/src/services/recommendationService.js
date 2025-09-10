const { SearchIndex, UserBehavior, RecommendationLog } = require('../models');
const mongoose = require('mongoose');

class RecommendationService {
  constructor() {
    this.isInitialized = false;
  }

  // 初始化推薦服務
  async initialize() {
    if (this.isInitialized) return;
    
    try {
      console.log('🔄 初始化推薦服務...');
      
      // 同步商品數據到搜尋索引
      await this.syncProductData();
      
      // 更新商品熱度分數
      await this.updatePopularityScores();
      
      this.isInitialized = true;
      console.log('✅ 推薦服務初始化完成');
    } catch (error) {
      console.error('❌ 推薦服務初始化失敗:', error);
      throw error;
    }
  }

  // 同步商品數據到搜尋索引
  async syncProductData() {
    try {
      console.log('🔄 同步商品數據到搜尋索引...');
      
      // 這裡應該從 PRODUCT-SERVICE 獲取商品數據
      // 暫時使用模擬數據
      const mockProducts = [
        {
          item_id: 'product_1',
          item_type: 'product',
          title: 'iPhone 15 Pro',
          description: '最新款 iPhone，搭載 A17 Pro 晶片',
          categories: ['智慧型手機', 'Apple'],
          tags: ['iPhone', 'Apple', '智慧型手機', '旗艦機'],
          keywords: ['iPhone', 'Apple', '手機', '智慧型', '旗艦'],
          popularity_score: 0.9
        },
        {
          item_id: 'product_2',
          item_type: 'product',
          title: 'MacBook Pro 14"',
          description: '專業級筆記型電腦，搭載 M3 Pro 晶片',
          categories: ['筆記型電腦', 'Apple'],
          tags: ['MacBook', 'Apple', '筆記型電腦', '專業'],
          keywords: ['MacBook', 'Apple', '筆電', '專業', 'M3'],
          popularity_score: 0.8
        },
        {
          item_id: 'product_3',
          item_type: 'product',
          title: 'AirPods Pro 2',
          description: '主動降噪無線耳機',
          categories: ['耳機', 'Apple'],
          tags: ['AirPods', 'Apple', '耳機', '降噪'],
          keywords: ['AirPods', 'Apple', '耳機', '降噪', '無線'],
          popularity_score: 0.7
        },
        {
          item_id: 'product_4',
          item_type: 'product',
          title: 'Samsung Galaxy S24',
          description: '三星旗艦智慧型手機',
          categories: ['智慧型手機', 'Samsung'],
          tags: ['Galaxy', 'Samsung', '智慧型手機', '旗艦'],
          keywords: ['Galaxy', 'Samsung', '手機', '智慧型', '旗艦'],
          popularity_score: 0.6
        },
        {
          item_id: 'product_5',
          item_type: 'product',
          title: 'iPad Air 5',
          description: '輕薄平板電腦，搭載 M1 晶片',
          categories: ['平板電腦', 'Apple'],
          tags: ['iPad', 'Apple', '平板電腦', '輕薄'],
          keywords: ['iPad', 'Apple', '平板', 'M1', '輕薄'],
          popularity_score: 0.5
        }
      ];

      // 批量更新搜尋索引
      for (const product of mockProducts) {
        await SearchIndex.findOneAndUpdate(
          { item_id: product.item_id },
          { ...product, last_updated: new Date() },
          { upsert: true }
        );
      }

      console.log(`✅ 同步了 ${mockProducts.length} 個商品到搜尋索引`);
    } catch (error) {
      console.error('❌ 同步商品數據失敗:', error);
      throw error;
    }
  }

  // 更新商品熱度分數
  async updatePopularityScores() {
    try {
      console.log('🔄 更新商品熱度分數...');
      
      const products = await SearchIndex.find({ item_type: 'product' });
      
      for (const product of products) {
        // 計算基於用戶行為的熱度分數
        const behaviorCount = await UserBehavior.countDocuments({
          item_id: product.item_id,
          action: { $in: ['view', 'click', 'purchase', 'add_to_cart', 'like'] }
        });
        
        // 計算基於推薦點擊的熱度分數
        const recommendationClicks = await RecommendationLog.countDocuments({
          item_id: product.item_id,
          clicked: true
        });
        
        // 綜合熱度分數 (0-1)
        const popularityScore = Math.min(
          (behaviorCount * 0.1 + recommendationClicks * 0.2) / 10,
          1
        );
        
        await SearchIndex.updateOne(
          { item_id: product.item_id },
          { 
            popularity_score: popularityScore,
            last_updated: new Date()
          }
        );
      }
      
      console.log(`✅ 更新了 ${products.length} 個商品的熱度分數`);
    } catch (error) {
      console.error('❌ 更新熱度分數失敗:', error);
      throw error;
    }
  }

  // 記錄用戶行為
  async recordUserBehavior(userId, action, itemId, itemType = 'product', metadata = {}) {
    try {
      const behavior = new UserBehavior({
        user_id: userId,
        action: action,
        item_id: itemId,
        item_type: itemType,
        metadata: metadata,
        session_id: metadata.session_id || mongoose.Types.ObjectId().toString(),
        ip_address: metadata.ip_address,
        user_agent: metadata.user_agent
      });
      
      await behavior.save();
      
      // 更新商品熱度分數
      await this.updateItemPopularity(itemId);
      
      return behavior;
    } catch (error) {
      console.error('❌ 記錄用戶行為失敗:', error);
      throw error;
    }
  }

  // 更新單個商品熱度分數
  async updateItemPopularity(itemId) {
    try {
      const behaviorCount = await UserBehavior.countDocuments({
        item_id: itemId,
        action: { $in: ['view', 'click', 'purchase', 'add_to_cart', 'like'] }
      });
      
      const recommendationClicks = await RecommendationLog.countDocuments({
        item_id: itemId,
        clicked: true
      });
      
      const popularityScore = Math.min(
        (behaviorCount * 0.1 + recommendationClicks * 0.2) / 10,
        1
      );
      
      await SearchIndex.updateOne(
        { item_id: itemId },
        { 
          popularity_score: popularityScore,
          last_updated: new Date()
        }
      );
    } catch (error) {
      console.error('❌ 更新商品熱度分數失敗:', error);
    }
  }

  // 獲取推薦統計
  async getRecommendationStats() {
    try {
      const totalRecommendations = await RecommendationLog.countDocuments();
      const totalClicks = await RecommendationLog.countDocuments({ clicked: true });
      const clickThroughRate = totalRecommendations > 0 ? totalClicks / totalRecommendations : 0;
      
      const recommendationTypes = await RecommendationLog.aggregate([
        {
          $group: {
            _id: '$recommendation_type',
            count: { $sum: 1 },
            clicks: { $sum: { $cond: ['$clicked', 1, 0] } }
          }
        },
        {
          $project: {
            type: '$_id',
            count: 1,
            clicks: 1,
            ctr: { $divide: ['$clicks', '$count'] }
          }
        }
      ]);

      return {
        total_recommendations: totalRecommendations,
        total_clicks: totalClicks,
        click_through_rate: clickThroughRate,
        recommendation_types: recommendationTypes
      };
    } catch (error) {
      console.error('❌ 獲取推薦統計失敗:', error);
      throw error;
    }
  }

  // 清理舊數據
  async cleanupOldData(daysToKeep = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      const deletedBehaviors = await UserBehavior.deleteMany({
        created_at: { $lt: cutoffDate }
      });
      
      const deletedLogs = await RecommendationLog.deleteMany({
        created_at: { $lt: cutoffDate }
      });
      
      console.log(`✅ 清理了 ${deletedBehaviors.deletedCount} 個舊用戶行為記錄`);
      console.log(`✅ 清理了 ${deletedLogs.deletedCount} 個舊推薦記錄`);
      
      return {
        deleted_behaviors: deletedBehaviors.deletedCount,
        deleted_logs: deletedLogs.deletedCount
      };
    } catch (error) {
      console.error('❌ 清理舊數據失敗:', error);
      throw error;
    }
  }
}

module.exports = new RecommendationService();
