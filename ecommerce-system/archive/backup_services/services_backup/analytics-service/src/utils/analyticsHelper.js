const moment = require('moment');
const _ = require('lodash');

/**
 * 計算日期範圍
 */
const getDateRange = (period = '7d') => {
  const endDate = moment().endOf('day');
  let startDate;

  switch (period) {
    case '1d':
      startDate = moment().startOf('day');
      break;
    case '7d':
      startDate = moment().subtract(7, 'days').startOf('day');
      break;
    case '30d':
      startDate = moment().subtract(30, 'days').startOf('day');
      break;
    case '90d':
      startDate = moment().subtract(90, 'days').startOf('day');
      break;
    case '1y':
      startDate = moment().subtract(1, 'year').startOf('day');
      break;
    default:
      startDate = moment().subtract(7, 'days').startOf('day');
  }

  return { startDate: startDate.toDate(), endDate: endDate.toDate() };
};

/**
 * 計算銷售趨勢
 */
const calculateSalesTrend = (currentData, previousData) => {
  if (!previousData || previousData.totalRevenue === 0) {
    return { trend: 0, percentage: 0 };
  }

  const trend = currentData.totalRevenue - previousData.totalRevenue;
  const percentage = ((trend / previousData.totalRevenue) * 100);

  return {
    trend: Math.round(trend * 100) / 100,
    percentage: Math.round(percentage * 100) / 100
  };
};

/**
 * 計算用戶留存率
 */
const calculateRetentionRate = (retainedUsers, totalUsers) => {
  if (totalUsers === 0) return 0;
  return Math.round((retainedUsers / totalUsers) * 100 * 100) / 100;
};

/**
 * 計算庫存週轉率
 */
const calculateInventoryTurnover = (costOfGoodsSold, averageInventory) => {
  if (averageInventory === 0) return 0;
  return Math.round((costOfGoodsSold / averageInventory) * 100) / 100;
};

/**
 * 計算利潤率
 */
const calculateProfitMargin = (revenue, costs) => {
  if (revenue === 0) return 0;
  return Math.round(((revenue - costs) / revenue) * 100 * 100) / 100;
};

/**
 * 計算平均訂單價值
 */
const calculateAverageOrderValue = (totalRevenue, totalOrders) => {
  if (totalOrders === 0) return 0;
  return Math.round((totalRevenue / totalOrders) * 100) / 100;
};

/**
 * 計算商品熱度分數
 */
const calculateProductHeatScore = (product) => {
  const { quantity, revenue, views = 0, rating = 0 } = product;
  
  // 綜合評分：銷量(40%) + 營收(30%) + 瀏覽量(20%) + 評分(10%)
  const quantityScore = (quantity / 100) * 0.4;
  const revenueScore = (revenue / 10000) * 0.3;
  const viewsScore = (views / 1000) * 0.2;
  const ratingScore = (rating / 5) * 0.1;
  
  return Math.round((quantityScore + revenueScore + viewsScore + ratingScore) * 100);
};

/**
 * 計算用戶價值分數 (RFM 模型)
 */
const calculateUserValueScore = (user) => {
  const { lastOrderDate, totalOrders, totalSpent } = user;
  
  const now = moment();
  const lastOrder = moment(lastOrderDate);
  const recency = now.diff(lastOrder, 'days');
  
  // R (Recency) 分數：最近購買時間
  let rScore = 0;
  if (recency <= 30) rScore = 5;
  else if (recency <= 60) rScore = 4;
  else if (recency <= 90) rScore = 3;
  else if (recency <= 180) rScore = 2;
  else rScore = 1;
  
  // F (Frequency) 分數：購買頻率
  let fScore = 0;
  if (totalOrders >= 10) fScore = 5;
  else if (totalOrders >= 5) fScore = 4;
  else if (totalOrders >= 3) fScore = 3;
  else if (totalOrders >= 2) fScore = 2;
  else fScore = 1;
  
  // M (Monetary) 分數：購買金額
  let mScore = 0;
  if (totalSpent >= 10000) mScore = 5;
  else if (totalSpent >= 5000) mScore = 4;
  else if (totalSpent >= 2000) mScore = 3;
  else if (totalSpent >= 1000) mScore = 2;
  else mScore = 1;
  
  // 綜合分數 (R*0.5 + F*0.3 + M*0.2)
  const totalScore = (rScore * 0.5) + (fScore * 0.3) + (mScore * 0.2);
  
  return {
    score: Math.round(totalScore * 100) / 100,
    rScore,
    fScore,
    mScore,
    segment: getRFMSegment(totalScore)
  };
};

/**
 * 根據 RFM 分數取得用戶分群
 */
const getRFMSegment = (score) => {
  if (score >= 4.5) return 'VIP';
  if (score >= 3.5) return '高價值';
  if (score >= 2.5) return '中價值';
  if (score >= 1.5) return '低價值';
  return '流失';
};

/**
 * 計算預測值 (簡單線性回歸)
 */
const calculateForecast = (data, periods = 7) => {
  if (data.length < 2) return null;
  
  const n = data.length;
  const xValues = Array.from({ length: n }, (_, i) => i);
  const yValues = data.map(d => d.value || d.totalRevenue || d.totalOrders || 0);
  
  // 計算平均值
  const xMean = xValues.reduce((a, b) => a + b, 0) / n;
  const yMean = yValues.reduce((a, b) => a + b, 0) / n;
  
  // 計算斜率
  let numerator = 0;
  let denominator = 0;
  
  for (let i = 0; i < n; i++) {
    numerator += (xValues[i] - xMean) * (yValues[i] - yMean);
    denominator += Math.pow(xValues[i] - xMean, 2);
  }
  
  const slope = denominator === 0 ? 0 : numerator / denominator;
  const intercept = yMean - slope * xMean;
  
  // 預測未來值
  const forecast = [];
  for (let i = 1; i <= periods; i++) {
    const predictedValue = slope * (n + i - 1) + intercept;
    forecast.push(Math.max(0, Math.round(predictedValue * 100) / 100));
  }
  
  return {
    slope: Math.round(slope * 100) / 100,
    intercept: Math.round(intercept * 100) / 100,
    forecast,
    trend: slope > 0 ? '上升' : slope < 0 ? '下降' : '穩定'
  };
};

/**
 * 格式化數字
 */
const formatNumber = (num, decimals = 2) => {
  if (num === null || num === undefined) return '0';
  return Number(num).toLocaleString('zh-TW', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

/**
 * 格式化貨幣
 */
const formatCurrency = (amount, currency = 'TWD') => {
  if (amount === null || amount === undefined) return 'NT$ 0';
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

/**
 * 格式化百分比
 */
const formatPercentage = (value, decimals = 2) => {
  if (value === null || value === undefined) return '0%';
  return `${(value * 100).toFixed(decimals)}%`;
};

/**
 * 取得顏色配置
 */
const getChartColors = () => {
  return {
    primary: '#3B82F6',
    secondary: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#06B6D4',
    success: '#22C55E',
    purple: '#8B5CF6',
    pink: '#EC4899'
  };
};

module.exports = {
  getDateRange,
  calculateSalesTrend,
  calculateRetentionRate,
  calculateInventoryTurnover,
  calculateProfitMargin,
  calculateAverageOrderValue,
  calculateProductHeatScore,
  calculateUserValueScore,
  getRFMSegment,
  calculateForecast,
  formatNumber,
  formatCurrency,
  formatPercentage,
  getChartColors
};
