const { SearchLog, SearchIndex } = require('../models');
const natural = require('natural');
const { v4: uuidv4 } = require('uuid');

// 執行搜尋
const search = async (req, res) => {
  try {
    const startTime = Date.now();
    const { query, search_type = 'product', filters = {}, limit = 10, offset = 0 } = req.body;
    const userId = req.user.userId;
    const sessionId = req.headers['x-session-id'] || uuidv4();

    // 使用自然語言處理進行搜尋
    const searchResults = await performSearch(query, search_type, filters, limit, offset);
    
    const responseTime = Date.now() - startTime;

    // 記錄搜尋日誌
    const searchLog = new SearchLog({
      user_id: userId,
      query: query,
      results_count: searchResults.length,
      search_type: search_type,
      filters: filters,
      response_time: responseTime,
      session_id: sessionId
    });

    await searchLog.save();

    res.json({
      success: true,
      data: {
        query: query,
        results: searchResults,
        total: searchResults.length,
        response_time: responseTime,
        search_id: searchLog._id,
        pagination: {
          limit: limit,
          offset: offset,
          has_more: searchResults.length === limit
        }
      }
    });
  } catch (error) {
    console.error('搜尋錯誤:', error);
    res.status(500).json({
      success: false,
      message: '搜尋時發生錯誤'
    });
  }
};

// 實際搜尋邏輯
const performSearch = async (query, searchType, filters, limit, offset) => {
  try {
    // 使用自然語言處理進行文本分析
    const tokenizer = new natural.WordTokenizer();
    const tokens = tokenizer.tokenize(query.toLowerCase());
    
    // 建立搜尋條件
    const searchConditions = {
      item_type: searchType,
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { tags: { $in: tokens } },
        { keywords: { $in: tokens } }
      ]
    };

    // 添加篩選條件
    if (filters.categories && filters.categories.length > 0) {
      searchConditions.categories = { $in: filters.categories };
    }

    if (filters.tags && filters.tags.length > 0) {
      searchConditions.tags = { $in: filters.tags };
    }

    // 執行搜尋
    const results = await SearchIndex.find(searchConditions)
      .sort({ popularity_score: -1, last_updated: -1 })
      .skip(offset)
      .limit(limit)
      .lean();

    // 計算相關性分數
    return results.map((item, index) => ({
      item_id: item.item_id,
      item_type: item.item_type,
      title: item.title,
      description: item.description,
      score: calculateRelevanceScore(query, item, index),
      metadata: {
        categories: item.categories,
        tags: item.tags,
        popularity_score: item.popularity_score,
        last_updated: item.last_updated
      }
    }));
  } catch (error) {
    console.error('執行搜尋錯誤:', error);
    return [];
  }
};

// 計算相關性分數
const calculateRelevanceScore = (query, item, position) => {
  let score = 0.5; // 基礎分數
  
  // 標題匹配
  if (item.title.toLowerCase().includes(query.toLowerCase())) {
    score += 0.3;
  }
  
  // 描述匹配
  if (item.description && item.description.toLowerCase().includes(query.toLowerCase())) {
    score += 0.2;
  }
  
  // 標籤匹配
  if (item.tags && item.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))) {
    score += 0.1;
  }
  
  // 位置懲罰
  score -= position * 0.01;
  
  // 流行度加成
  score += item.popularity_score * 0.1;
  
  return Math.min(Math.max(score, 0), 1);
};

// 獲取搜尋建議
const getSuggestions = async (req, res) => {
  try {
    const { q, limit = 5 } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({
        success: true,
        data: {
          suggestions: []
        }
      });
    }

    // 從搜尋索引中獲取建議
    const suggestions = await SearchIndex.aggregate([
      {
        $match: {
          $or: [
            { title: { $regex: q, $options: 'i' } },
            { tags: { $regex: q, $options: 'i' } },
            { keywords: { $regex: q, $options: 'i' } }
          ]
        }
      },
      {
        $project: {
          title: 1,
          tags: 1,
          popularity_score: 1,
          score: {
            $add: [
              { $multiply: ['$popularity_score', 0.5] },
              {
                $cond: [
                  { $regexMatch: { input: '$title', regex: q, options: 'i' } },
                  0.3,
                  0
                ]
              }
            ]
          }
        }
      },
      {
        $sort: { score: -1 }
      },
      {
        $limit: limit
      }
    ]);

    res.json({
      success: true,
      data: {
        suggestions: suggestions.map(item => ({
          text: item.title,
          type: 'title',
          score: item.score
        }))
      }
    });
  } catch (error) {
    console.error('獲取搜尋建議錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取搜尋建議時發生錯誤'
    });
  }
};

// 獲取熱門搜尋
const getTrending = async (req, res) => {
  try {
    const { period = 'week', limit = 10 } = req.query;
    
    const periodMap = {
      day: 1,
      week: 7,
      month: 30
    };
    
    const days = periodMap[period] || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const trending = await SearchLog.aggregate([
      {
        $match: {
          created_at: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$query',
          count: { $sum: 1 },
          avg_response_time: { $avg: '$response_time' },
          unique_users: { $addToSet: '$user_id' }
        }
      },
      {
        $project: {
          query: '$_id',
          count: 1,
          avg_response_time: 1,
          unique_user_count: { $size: '$unique_users' }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: parseInt(limit)
      }
    ]);

    res.json({
      success: true,
      data: {
        period: period,
        trending: trending
      }
    });
  } catch (error) {
    console.error('獲取熱門搜尋錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取熱門搜尋時發生錯誤'
    });
  }
};

// 獲取搜尋分析
const getSearchAnalytics = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    const matchConditions = {};
    if (start_date && end_date) {
      matchConditions.created_at = {
        $gte: new Date(start_date),
        $lte: new Date(end_date)
      };
    }

    const analytics = await SearchLog.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: null,
          total_searches: { $sum: 1 },
          unique_users: { $addToSet: '$user_id' },
          avg_response_time: { $avg: '$response_time' },
          search_types: { $addToSet: '$search_type' },
          total_clicks: { $sum: { $size: '$clicked_results' } }
        }
      },
      {
        $project: {
          total_searches: 1,
          unique_user_count: { $size: '$unique_users' },
          avg_response_time: { $round: ['$avg_response_time', 2] },
          search_types: 1,
          total_clicks: 1,
          click_through_rate: {
            $round: [
              { $divide: ['$total_clicks', '$total_searches'] },
              4
            ]
          }
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
        analytics: analytics[0] || {
          total_searches: 0,
          unique_user_count: 0,
          avg_response_time: 0,
          search_types: [],
          total_clicks: 0,
          click_through_rate: 0
        }
      }
    });
  } catch (error) {
    console.error('獲取搜尋分析錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取搜尋分析時發生錯誤'
    });
  }
};

// 記錄搜尋結果點擊
const recordClick = async (req, res) => {
  try {
    const { search_id, result_id, position } = req.body;
    const userId = req.user.userId;

    await SearchLog.findByIdAndUpdate(search_id, {
      $push: {
        clicked_results: {
          result_id: result_id,
          position: position,
          clicked_at: new Date()
        }
      }
    });

    res.json({
      success: true,
      message: '點擊記錄成功'
    });
  } catch (error) {
    console.error('記錄點擊錯誤:', error);
    res.status(500).json({
      success: false,
      message: '記錄點擊時發生錯誤'
    });
  }
};

module.exports = {
  search,
  getSuggestions,
  getTrending,
  getSearchAnalytics,
  recordClick
};
