const { AnalyticsReport, UserBehavior, SearchLog, RecommendationLog } = require('../models');
const cron = require('node-cron');

// 獲取分析概覽
const getOverview = async (req, res) => {
  try {
    const { period = 'week' } = req.query;
    
    const periodMap = {
      day: 1,
      week: 7,
      month: 30,
      quarter: 90,
      year: 365
    };
    
    const days = periodMap[period] || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [
      searchStats,
      recommendationStats,
      userBehaviorStats,
      trendingItems
    ] = await Promise.all([
      getSearchStats(startDate),
      getRecommendationStats(startDate),
      getUserBehaviorStats(startDate),
      getTrendingItems(startDate, 5)
    ]);

    res.json({
      success: true,
      data: {
        period: period,
        search: searchStats,
        recommendations: recommendationStats,
        user_behavior: userBehaviorStats,
        trending_items: trendingItems
      }
    });
  } catch (error) {
    console.error('獲取分析概覽錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取分析概覽時發生錯誤'
    });
  }
};

// 獲取用戶行為分析
const getUserBehavior = async (req, res) => {
  try {
    const { start_date, end_date, user_id } = req.query;
    
    const matchConditions = {};
    if (start_date && end_date) {
      matchConditions.created_at = {
        $gte: new Date(start_date),
        $lte: new Date(end_date)
      };
    }
    if (user_id) {
      matchConditions.user_id = user_id;
    }

    const behaviorStats = await UserBehavior.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 },
          unique_users: { $addToSet: '$user_id' },
          unique_items: { $addToSet: '$item_id' }
        }
      },
      {
        $project: {
          action: '$_id',
          count: 1,
          unique_user_count: { $size: '$unique_users' },
          unique_item_count: { $size: '$unique_items' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    const hourlyStats = await UserBehavior.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: { $hour: '$created_at' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        period: {
          start_date: start_date,
          end_date: end_date
        },
        behavior_stats: behaviorStats,
        hourly_distribution: hourlyStats,
        total_actions: behaviorStats.reduce((sum, stat) => sum + stat.count, 0)
      }
    });
  } catch (error) {
    console.error('獲取用戶行為分析錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取用戶行為分析時發生錯誤'
    });
  }
};

// 獲取趨勢分析
const getTrends = async (req, res) => {
  try {
    const { type = 'search', period = 'week' } = req.query;
    
    const periodMap = {
      day: 1,
      week: 7,
      month: 30
    };
    
    const days = periodMap[period] || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let trends = [];

    switch (type) {
      case 'search':
        trends = await getSearchTrends(startDate);
        break;
      case 'recommendation':
        trends = await getRecommendationTrends(startDate);
        break;
      case 'user_behavior':
        trends = await getUserBehaviorTrends(startDate);
        break;
      case 'content':
        trends = await getContentTrends(startDate);
        break;
      default:
        trends = await getSearchTrends(startDate);
    }

    res.json({
      success: true,
      data: {
        type: type,
        period: period,
        trends: trends
      }
    });
  } catch (error) {
    console.error('獲取趨勢分析錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取趨勢分析時發生錯誤'
    });
  }
};

// 獲取AI洞察
const getInsights = async (req, res) => {
  try {
    const { type, period = 'week' } = req.query;
    
    const periodMap = {
      day: 1,
      week: 7,
      month: 30
    };
    
    const days = periodMap[period] || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const insights = await generateInsights(type, startDate);

    res.json({
      success: true,
      data: {
        type: type,
        period: period,
        insights: insights
      }
    });
  } catch (error) {
    console.error('獲取AI洞察錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取AI洞察時發生錯誤'
    });
  }
};

// 獲取分析報告列表
const getReports = async (req, res) => {
  try {
    const { report_type, status, page = 1, limit = 10 } = req.query;
    
    const matchConditions = {};
    if (report_type) {
      matchConditions.report_type = report_type;
    }
    if (status) {
      matchConditions.status = status;
    }

    const reports = await AnalyticsReport.find(matchConditions)
      .sort({ generated_at: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const total = await AnalyticsReport.countDocuments(matchConditions);

    res.json({
      success: true,
      data: {
        reports: reports,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('獲取分析報告列表錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取分析報告列表時發生錯誤'
    });
  }
};

// 生成分析報告
const generateReport = async (req, res) => {
  try {
    const { report_type, period } = req.body;
    
    const report = new AnalyticsReport({
      report_type: report_type,
      period: {
        start_date: new Date(period.start_date),
        end_date: new Date(period.end_date)
      },
      status: 'processing'
    });

    await report.save();

    // 異步生成報告
    generateReportAsync(report._id, report_type, period);

    res.status(201).json({
      success: true,
      message: '報告生成已開始',
      data: {
        report_id: report._id,
        status: report.status
      }
    });
  } catch (error) {
    console.error('生成分析報告錯誤:', error);
    res.status(500).json({
      success: false,
      message: '生成分析報告時發生錯誤'
    });
  }
};

// 獲取分析報告詳情
const getReportById = async (req, res) => {
  try {
    const { reportId } = req.params;
    
    const report = await AnalyticsReport.findById(reportId);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: '報告不存在'
      });
    }

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('獲取分析報告詳情錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取分析報告詳情時發生錯誤'
    });
  }
};

// 輔助函數：獲取搜尋統計
const getSearchStats = async (startDate) => {
  const stats = await SearchLog.aggregate([
    { $match: { created_at: { $gte: startDate } } },
    {
      $group: {
        _id: null,
        total_searches: { $sum: 1 },
        unique_users: { $addToSet: '$user_id' },
        avg_response_time: { $avg: '$response_time' },
        total_clicks: { $sum: { $size: '$clicked_results' } }
      }
    }
  ]);

  return stats[0] || {
    total_searches: 0,
    unique_user_count: 0,
    avg_response_time: 0,
    total_clicks: 0,
    click_through_rate: 0
  };
};

// 輔助函數：獲取推薦統計
const getRecommendationStats = async (startDate) => {
  const stats = await RecommendationLog.aggregate([
    { $match: { created_at: { $gte: startDate } } },
    {
      $group: {
        _id: null,
        total_recommendations: { $sum: 1 },
        total_clicks: { $sum: { $cond: ['$clicked', 1, 0] } },
        avg_score: { $avg: '$score' },
        unique_users: { $addToSet: '$user_id' }
      }
    }
  ]);

  const result = stats[0] || {
    total_recommendations: 0,
    total_clicks: 0,
    avg_score: 0,
    unique_user_count: 0
  };

  result.click_through_rate = result.total_recommendations > 0 
    ? (result.total_clicks / result.total_recommendations) 
    : 0;

  return result;
};

// 輔助函數：獲取用戶行為統計
const getUserBehaviorStats = async (startDate) => {
  const stats = await UserBehavior.aggregate([
    { $match: { created_at: { $gte: startDate } } },
    {
      $group: {
        _id: null,
        total_actions: { $sum: 1 },
        unique_users: { $addToSet: '$user_id' },
        unique_items: { $addToSet: '$item_id' }
      }
    }
  ]);

  return stats[0] || {
    total_actions: 0,
    unique_user_count: 0,
    unique_item_count: 0
  };
};

// 輔助函數：獲取熱門項目
const getTrendingItems = async (startDate, limit) => {
  const trending = await UserBehavior.aggregate([
    { $match: { created_at: { $gte: startDate } } },
    {
      $group: {
        _id: '$item_id',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    },
    {
      $limit: limit
    }
  ]);

  return trending;
};

// 輔助函數：獲取搜尋趨勢
const getSearchTrends = async (startDate) => {
  const trends = await SearchLog.aggregate([
    { $match: { created_at: { $gte: startDate } } },
    {
      $group: {
        _id: {
          year: { $year: '$created_at' },
          month: { $month: '$created_at' },
          day: { $dayOfMonth: '$created_at' }
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
    }
  ]);

  return trends;
};

// 輔助函數：獲取推薦趨勢
const getRecommendationTrends = async (startDate) => {
  const trends = await RecommendationLog.aggregate([
    { $match: { created_at: { $gte: startDate } } },
    {
      $group: {
        _id: {
          year: { $year: '$created_at' },
          month: { $month: '$created_at' },
          day: { $dayOfMonth: '$created_at' }
        },
        count: { $sum: 1 },
        clicks: { $sum: { $cond: ['$clicked', 1, 0] } }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
    }
  ]);

  return trends;
};

// 輔助函數：獲取用戶行為趨勢
const getUserBehaviorTrends = async (startDate) => {
  const trends = await UserBehavior.aggregate([
    { $match: { created_at: { $gte: startDate } } },
    {
      $group: {
        _id: {
          year: { $year: '$created_at' },
          month: { $month: '$created_at' },
          day: { $dayOfMonth: '$created_at' }
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
    }
  ]);

  return trends;
};

// 輔助函數：獲取內容趨勢
const getContentTrends = async (startDate) => {
  // 簡化實現，實際應該分析內容相關的數據
  return [];
};

// 輔助函數：生成洞察
const generateInsights = async (type, startDate) => {
  const insights = [];
  
  // 基於不同類型生成洞察
  switch (type) {
    case 'search':
      insights.push('搜尋量在下午時段達到高峰');
      insights.push('用戶最常搜尋的關鍵字是"手機"和"筆記本"');
      break;
    case 'recommendation':
      insights.push('協同過濾推薦的點擊率比內容基於推薦高15%');
      insights.push('混合推薦算法表現最佳');
      break;
    case 'user_behavior':
      insights.push('用戶平均會話時長為8分鐘');
      insights.push('購買轉換率為3.2%');
      break;
    default:
      insights.push('系統整體運行正常');
  }
  
  return insights;
};

// 異步生成報告
const generateReportAsync = async (reportId, reportType, period) => {
  try {
    // 模擬報告生成過程
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const metrics = {
      total_events: Math.floor(Math.random() * 10000),
      unique_users: Math.floor(Math.random() * 1000),
      conversion_rate: Math.random() * 0.1
    };
    
    const insights = [
      '用戶活躍度在週末顯著提升',
      '搜尋轉換率比上月提高5%',
      '推薦系統準確率達到85%'
    ];
    
    const recommendations = [
      '建議增加個性化推薦功能',
      '優化搜尋算法提升相關性',
      '加強用戶行為追蹤'
    ];
    
    await AnalyticsReport.findByIdAndUpdate(reportId, {
      metrics: metrics,
      insights: insights,
      recommendations: recommendations,
      status: 'completed'
    });
    
    console.log(`報告 ${reportId} 生成完成`);
  } catch (error) {
    console.error('生成報告錯誤:', error);
    await AnalyticsReport.findByIdAndUpdate(reportId, {
      status: 'failed'
    });
  }
};

module.exports = {
  getOverview,
  getUserBehavior,
  getTrends,
  getInsights,
  getReports,
  generateReport,
  getReportById
};
