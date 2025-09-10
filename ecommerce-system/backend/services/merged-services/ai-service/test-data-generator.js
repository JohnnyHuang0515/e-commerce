const mongoose = require('mongoose');
const { SearchLog, RecommendationLog, UserBehavior, SearchIndex } = require('./src/models');

// 連接 MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://admin:password123@localhost:27017/ecommerce?authSource=admin', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB 連接成功');
  } catch (error) {
    console.error('❌ MongoDB 連接失敗:', error);
    process.exit(1);
  }
};

// 生成測試搜尋索引數據
const generateSearchIndexData = async () => {
  const searchIndexData = [
    {
      item_id: 'product_001',
      item_type: 'product',
      title: 'iPhone 15 Pro',
      description: '最新款 iPhone，搭載 A17 Pro 晶片',
      categories: ['electronics', 'smartphones'],
      tags: ['apple', 'iphone', 'smartphone', 'premium'],
      keywords: ['iphone', 'apple', 'smartphone', 'premium', 'a17'],
      popularity_score: 0.95,
      last_updated: new Date()
    },
    {
      item_id: 'product_002',
      item_type: 'product',
      title: 'Samsung Galaxy S24',
      description: 'Samsung 旗艦手機，AI 功能強大',
      categories: ['electronics', 'smartphones'],
      tags: ['samsung', 'galaxy', 'smartphone', 'ai'],
      keywords: ['samsung', 'galaxy', 'smartphone', 'ai', 'android'],
      popularity_score: 0.88,
      last_updated: new Date()
    },
    {
      item_id: 'product_003',
      item_type: 'product',
      title: 'MacBook Pro M3',
      description: 'Apple 筆記型電腦，M3 晶片效能卓越',
      categories: ['electronics', 'laptops'],
      tags: ['apple', 'macbook', 'laptop', 'm3'],
      keywords: ['macbook', 'apple', 'laptop', 'm3', 'pro'],
      popularity_score: 0.92,
      last_updated: new Date()
    },
    {
      item_id: 'product_004',
      item_type: 'product',
      title: 'AirPods Pro 2',
      description: 'Apple 無線耳機，主動降噪功能',
      categories: ['electronics', 'audio'],
      tags: ['apple', 'airpods', 'earphones', 'wireless'],
      keywords: ['airpods', 'apple', 'earphones', 'wireless', 'noise'],
      popularity_score: 0.85,
      last_updated: new Date()
    },
    {
      item_id: 'product_005',
      item_type: 'product',
      title: 'Nike Air Max 270',
      description: 'Nike 運動鞋，舒適透氣',
      categories: ['fashion', 'shoes'],
      tags: ['nike', 'shoes', 'sports', 'comfortable'],
      keywords: ['nike', 'shoes', 'sports', 'air max', 'comfortable'],
      popularity_score: 0.78,
      last_updated: new Date()
    }
  ];

  try {
    await SearchIndex.deleteMany({});
    await SearchIndex.insertMany(searchIndexData);
    console.log('✅ 搜尋索引數據生成完成');
  } catch (error) {
    console.error('❌ 搜尋索引數據生成失敗:', error);
  }
};

// 生成測試搜尋記錄
const generateSearchLogs = async () => {
  const searchLogs = [
    {
      user_id: 'user_001',
      query: 'iPhone',
      results_count: 2,
      search_type: 'product',
      filters: { categories: ['electronics'] },
      response_time: 45,
      clicked_results: [
        { result_id: 'product_001', position: 1, clicked_at: new Date() }
      ],
      session_id: 'session_001'
    },
    {
      user_id: 'user_002',
      query: 'MacBook',
      results_count: 1,
      search_type: 'product',
      filters: {},
      response_time: 38,
      clicked_results: [
        { result_id: 'product_003', position: 1, clicked_at: new Date() }
      ],
      session_id: 'session_002'
    },
    {
      user_id: 'user_001',
      query: 'Apple',
      results_count: 3,
      search_type: 'product',
      filters: {},
      response_time: 52,
      clicked_results: [
        { result_id: 'product_001', position: 1, clicked_at: new Date() },
        { result_id: 'product_004', position: 3, clicked_at: new Date() }
      ],
      session_id: 'session_003'
    },
    {
      user_id: 'user_003',
      query: 'Nike shoes',
      results_count: 1,
      search_type: 'product',
      filters: { categories: ['fashion'] },
      response_time: 41,
      clicked_results: [
        { result_id: 'product_005', position: 1, clicked_at: new Date() }
      ],
      session_id: 'session_004'
    },
    {
      user_id: 'user_002',
      query: 'Samsung',
      results_count: 1,
      search_type: 'product',
      filters: {},
      response_time: 35,
      clicked_results: [],
      session_id: 'session_005'
    }
  ];

  try {
    await SearchLog.deleteMany({});
    await SearchLog.insertMany(searchLogs);
    console.log('✅ 搜尋記錄數據生成完成');
  } catch (error) {
    console.error('❌ 搜尋記錄數據生成失敗:', error);
  }
};

// 生成測試推薦記錄
const generateRecommendationLogs = async () => {
  const recommendationLogs = [
    {
      user_id: 'user_001',
      item_id: 'product_002',
      item_type: 'product',
      recommendation_type: 'hybrid',
      score: 0.85,
      reason: '基於 iPhone 購買歷史推薦',
      clicked: true,
      clicked_at: new Date(),
      session_id: 'session_001'
    },
    {
      user_id: 'user_001',
      item_id: 'product_004',
      item_type: 'product',
      recommendation_type: 'content_based',
      score: 0.78,
      reason: 'Apple 產品相關推薦',
      clicked: true,
      clicked_at: new Date(),
      session_id: 'session_001'
    },
    {
      user_id: 'user_002',
      item_id: 'product_001',
      item_type: 'product',
      recommendation_type: 'collaborative',
      score: 0.82,
      reason: '相似用戶購買推薦',
      clicked: false,
      session_id: 'session_002'
    },
    {
      user_id: 'user_003',
      item_id: 'product_005',
      item_type: 'product',
      recommendation_type: 'trending',
      score: 0.75,
      reason: '熱門商品推薦',
      clicked: true,
      clicked_at: new Date(),
      session_id: 'session_004'
    }
  ];

  try {
    await RecommendationLog.deleteMany({});
    await RecommendationLog.insertMany(recommendationLogs);
    console.log('✅ 推薦記錄數據生成完成');
  } catch (error) {
    console.error('❌ 推薦記錄數據生成失敗:', error);
  }
};

// 生成測試用戶行為記錄
const generateUserBehaviorLogs = async () => {
  const userBehaviorLogs = [
    {
      user_id: 'user_001',
      action: 'search',
      item_id: 'product_001',
      item_type: 'product',
      metadata: { query: 'iPhone', results_count: 2 },
      session_id: 'session_001'
    },
    {
      user_id: 'user_001',
      action: 'click',
      item_id: 'product_001',
      item_type: 'product',
      metadata: { position: 1, source: 'search' },
      session_id: 'session_001'
    },
    {
      user_id: 'user_001',
      action: 'view',
      item_id: 'product_001',
      item_type: 'product',
      metadata: { duration: 120 },
      session_id: 'session_001'
    },
    {
      user_id: 'user_002',
      action: 'search',
      item_id: 'product_003',
      item_type: 'product',
      metadata: { query: 'MacBook', results_count: 1 },
      session_id: 'session_002'
    },
    {
      user_id: 'user_002',
      action: 'click',
      item_id: 'product_003',
      item_type: 'product',
      metadata: { position: 1, source: 'search' },
      session_id: 'session_002'
    },
    {
      user_id: 'user_003',
      action: 'search',
      item_id: 'product_005',
      item_type: 'product',
      metadata: { query: 'Nike shoes', results_count: 1 },
      session_id: 'session_004'
    },
    {
      user_id: 'user_003',
      action: 'click',
      item_id: 'product_005',
      item_type: 'product',
      metadata: { position: 1, source: 'search' },
      session_id: 'session_004'
    }
  ];

  try {
    await UserBehavior.deleteMany({});
    await UserBehavior.insertMany(userBehaviorLogs);
    console.log('✅ 用戶行為記錄數據生成完成');
  } catch (error) {
    console.error('❌ 用戶行為記錄數據生成失敗:', error);
  }
};

// 主函數
const main = async () => {
  await connectDB();
  
  console.log('🚀 開始生成測試數據...');
  
  await generateSearchIndexData();
  await generateSearchLogs();
  await generateRecommendationLogs();
  await generateUserBehaviorLogs();
  
  console.log('🎉 所有測試數據生成完成！');
  
  await mongoose.disconnect();
  console.log('✅ 資料庫連接已關閉');
};

// 執行
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  generateSearchIndexData,
  generateSearchLogs,
  generateRecommendationLogs,
  generateUserBehaviorLogs
};
