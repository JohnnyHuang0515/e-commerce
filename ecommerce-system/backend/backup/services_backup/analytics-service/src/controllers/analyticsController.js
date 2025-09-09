const {
  SalesAnalytics,
  UserAnalytics,
  ProductAnalytics,
  RevenueAnalytics,
  InventoryAnalytics
} = require('../models/Analytics');

const {
  getDateRange,
  calculateSalesTrend,
  calculateRetentionRate,
  calculateInventoryTurnover,
  calculateProfitMargin,
  calculateAverageOrderValue,
  calculateProductHeatScore,
  calculateUserValueScore,
  calculateForecast,
  formatNumber,
  formatCurrency,
  formatPercentage
} = require('../utils/analyticsHelper');

class AnalyticsController {
  /**
   * 取得銷售分析
   */
  async getSalesAnalytics(req, res) {
    try {
      const { period = '7d', startDate, endDate } = req.query;
      
      let dateRange;
      if (startDate && endDate) {
        dateRange = {
          startDate: new Date(startDate),
          endDate: new Date(endDate)
        };
      } else {
        dateRange = getDateRange(period);
      }

      // 取得銷售分析資料
      const salesData = await SalesAnalytics.getDateRange(
        dateRange.startDate,
        dateRange.endDate
      );

      // 計算總計
      const totals = salesData.reduce((acc, data) => {
        acc.totalOrders += data.totalOrders || 0;
        acc.totalRevenue += data.totalRevenue || 0;
        acc.totalItems += data.totalItems || 0;
        return acc;
      }, { totalOrders: 0, totalRevenue: 0, totalItems: 0 });

      // 計算平均訂單價值
      totals.averageOrderValue = calculateAverageOrderValue(
        totals.totalRevenue,
        totals.totalOrders
      );

      // 計算狀態統計
      const statusCounts = salesData.reduce((acc, data) => {
        Object.keys(data.orderStatusCounts || {}).forEach(status => {
          acc[status] = (acc[status] || 0) + (data.orderStatusCounts[status] || 0);
        });
        return acc;
      }, {});

      // 取得熱銷商品
      const topProducts = salesData
        .flatMap(data => data.topProducts || [])
        .reduce((acc, product) => {
          const existing = acc.find(p => p.productId === product.productId);
          if (existing) {
            existing.quantity += product.quantity || 0;
            existing.revenue += product.revenue || 0;
          } else {
            acc.push({ ...product });
          }
          return acc;
        }, [])
        .sort((a, b) => (b.revenue || 0) - (a.revenue || 0))
        .slice(0, 10);

      // 計算趨勢
      const currentPeriod = salesData.slice(-7);
      const previousPeriod = salesData.slice(-14, -7);
      
      const currentTotal = currentPeriod.reduce((sum, data) => sum + (data.totalRevenue || 0), 0);
      const previousTotal = previousPeriod.reduce((sum, data) => sum + (data.totalRevenue || 0), 0);
      
      const trend = calculateSalesTrend(
        { totalRevenue: currentTotal },
        { totalRevenue: previousTotal }
      );

      // 計算預測
      const forecastData = salesData.map(data => ({
        date: data.date,
        value: data.totalRevenue
      }));
      const forecast = calculateForecast(forecastData, 7);

      res.json({
        success: true,
        data: {
          period: {
            startDate: dateRange.startDate,
            endDate: dateRange.endDate
          },
          totals: {
            ...totals,
            totalRevenueFormatted: formatCurrency(totals.totalRevenue),
            averageOrderValueFormatted: formatCurrency(totals.averageOrderValue)
          },
          statusCounts,
          topProducts: topProducts.map(product => ({
            ...product,
            revenueFormatted: formatCurrency(product.revenue),
            heatScore: calculateProductHeatScore(product)
          })),
          trend,
          forecast,
          dailyData: salesData.map(data => ({
            date: data.date,
            totalOrders: data.totalOrders,
            totalRevenue: data.totalRevenue,
            totalItems: data.totalItems,
            averageOrderValue: calculateAverageOrderValue(data.totalRevenue, data.totalOrders)
          }))
        }
      });
    } catch (error) {
      console.error('取得銷售分析錯誤:', error);
      res.status(500).json({
        success: false,
        message: '取得銷售分析失敗',
        error: error.message
      });
    }
  }

  /**
   * 取得用戶分析
   */
  async getUserAnalytics(req, res) {
    try {
      const { period = '30d' } = req.query;
      const dateRange = getDateRange(period);

      // 取得用戶分析資料
      const userData = await UserAnalytics.getDateRange(
        dateRange.startDate,
        dateRange.endDate
      );

      // 計算總計
      const totals = userData.reduce((acc, data) => {
        acc.newUsers += data.newUsers || 0;
        acc.activeUsers += data.activeUsers || 0;
        acc.totalUsers += data.totalUsers || 0;
        return acc;
      }, { newUsers: 0, activeUsers: 0, totalUsers: 0 });

      // 計算用戶分群統計
      const segments = userData.reduce((acc, data) => {
        Object.keys(data.userSegments || {}).forEach(segment => {
          acc[segment] = (acc[segment] || 0) + (data.userSegments[segment] || 0);
        });
        return acc;
      }, {});

      // 計算留存率
      const retentionRate = calculateRetentionRate(
        totals.activeUsers,
        totals.totalUsers
      );

      // 取得高價值用戶
      const topUsers = userData
        .flatMap(data => data.topUsers || [])
        .reduce((acc, user) => {
          const existing = acc.find(u => u.userId === user.userId);
          if (existing) {
            existing.totalOrders += user.totalOrders || 0;
            existing.totalSpent += user.totalSpent || 0;
          } else {
            acc.push({ ...user });
          }
          return acc;
        }, [])
        .map(user => ({
          ...user,
          valueScore: calculateUserValueScore(user),
          totalSpentFormatted: formatCurrency(user.totalSpent)
        }))
        .sort((a, b) => b.valueScore.score - a.valueScore.score)
        .slice(0, 10);

      // 計算趨勢
      const currentPeriod = userData.slice(-7);
      const previousPeriod = userData.slice(-14, -7);
      
      const currentActive = currentPeriod.reduce((sum, data) => sum + (data.activeUsers || 0), 0);
      const previousActive = previousPeriod.reduce((sum, data) => sum + (data.activeUsers || 0), 0);
      
      const trend = calculateSalesTrend(
        { totalRevenue: currentActive },
        { totalRevenue: previousActive }
      );

      res.json({
        success: true,
        data: {
          period: {
            startDate: dateRange.startDate,
            endDate: dateRange.endDate
          },
          totals: {
            ...totals,
            retentionRate: formatPercentage(retentionRate / 100)
          },
          segments,
          topUsers,
          trend,
          dailyData: userData.map(data => ({
            date: data.date,
            newUsers: data.newUsers,
            activeUsers: data.activeUsers,
            totalUsers: data.totalUsers,
            retentionRate: calculateRetentionRate(data.activeUsers, data.totalUsers)
          }))
        }
      });
    } catch (error) {
      console.error('取得用戶分析錯誤:', error);
      res.status(500).json({
        success: false,
        message: '取得用戶分析失敗',
        error: error.message
      });
    }
  }

  /**
   * 取得商品分析
   */
  async getProductAnalytics(req, res) {
    try {
      const { period = '30d' } = req.query;
      const dateRange = getDateRange(period);

      // 取得商品分析資料
      const productData = await ProductAnalytics.getDateRange(
        dateRange.startDate,
        dateRange.endDate
      );

      // 計算總計
      const totals = productData.reduce((acc, data) => {
        acc.totalProducts += data.totalProducts || 0;
        acc.activeProducts += data.activeProducts || 0;
        acc.lowStockProducts += data.lowStockProducts || 0;
        acc.outOfStockProducts += data.outOfStockProducts || 0;
        return acc;
      }, { 
        totalProducts: 0, 
        activeProducts: 0, 
        lowStockProducts: 0, 
        outOfStockProducts: 0 
      });

      // 取得熱銷商品
      const topSellingProducts = productData
        .flatMap(data => data.topSellingProducts || [])
        .reduce((acc, product) => {
          const existing = acc.find(p => p.productId === product.productId);
          if (existing) {
            existing.quantity += product.quantity || 0;
            existing.revenue += product.revenue || 0;
            existing.profit += product.profit || 0;
          } else {
            acc.push({ ...product });
          }
          return acc;
        }, [])
        .map(product => ({
          ...product,
          revenueFormatted: formatCurrency(product.revenue),
          profitFormatted: formatCurrency(product.profit),
          heatScore: calculateProductHeatScore(product)
        }))
        .sort((a, b) => (b.revenue || 0) - (a.revenue || 0))
        .slice(0, 10);

      // 計算分類表現
      const categoryPerformance = productData
        .flatMap(data => data.categoryPerformance || [])
        .reduce((acc, category) => {
          const existing = acc.find(c => c.categoryId === category.categoryId);
          if (existing) {
            existing.productCount += category.productCount || 0;
            existing.totalRevenue += category.totalRevenue || 0;
          } else {
            acc.push({ ...category });
          }
          return acc;
        }, [])
        .map(category => ({
          ...category,
          totalRevenueFormatted: formatCurrency(category.totalRevenue),
          averagePriceFormatted: formatCurrency(category.averagePrice)
        }))
        .sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0));

      res.json({
        success: true,
        data: {
          period: {
            startDate: dateRange.startDate,
            endDate: dateRange.endDate
          },
          totals,
          topSellingProducts,
          categoryPerformance,
          dailyData: productData.map(data => ({
            date: data.date,
            totalProducts: data.totalProducts,
            activeProducts: data.activeProducts,
            lowStockProducts: data.lowStockProducts,
            outOfStockProducts: data.outOfStockProducts
          }))
        }
      });
    } catch (error) {
      console.error('取得商品分析錯誤:', error);
      res.status(500).json({
        success: false,
        message: '取得商品分析失敗',
        error: error.message
      });
    }
  }

  /**
   * 取得營收分析
   */
  async getRevenueAnalytics(req, res) {
    try {
      const { period = '30d' } = req.query;
      const dateRange = getDateRange(period);

      // 取得營收分析資料
      const revenueData = await RevenueAnalytics.getDateRange(
        dateRange.startDate,
        dateRange.endDate
      );

      // 計算總計
      const totals = revenueData.reduce((acc, data) => {
        acc.grossRevenue += data.grossRevenue || 0;
        acc.netRevenue += data.netRevenue || 0;
        acc.totalCosts += data.totalCosts || 0;
        acc.grossProfit += data.grossProfit || 0;
        acc.netProfit += data.netProfit || 0;
        return acc;
      }, { 
        grossRevenue: 0, 
        netRevenue: 0, 
        totalCosts: 0, 
        grossProfit: 0, 
        netProfit: 0 
      });

      // 計算利潤率
      totals.profitMargin = calculateProfitMargin(totals.netRevenue, totals.totalCosts);

      // 計算付款方式統計
      const paymentMethods = revenueData
        .flatMap(data => data.revenueByPaymentMethod || [])
        .reduce((acc, method) => {
          const existing = acc.find(m => m.method === method.method);
          if (existing) {
            existing.amount += method.amount || 0;
            existing.count += method.count || 0;
          } else {
            acc.push({ ...method });
          }
          return acc;
        }, [])
        .map(method => ({
          ...method,
          amountFormatted: formatCurrency(method.amount)
        }))
        .sort((a, b) => (b.amount || 0) - (a.amount || 0));

      // 計算退款統計
      const refunds = revenueData.reduce((acc, data) => {
        acc.totalAmount += data.refunds?.totalAmount || 0;
        acc.count += data.refunds?.count || 0;
        return acc;
      }, { totalAmount: 0, count: 0 });

      refunds.rate = totals.grossRevenue > 0 ? (refunds.totalAmount / totals.grossRevenue) * 100 : 0;

      res.json({
        success: true,
        data: {
          period: {
            startDate: dateRange.startDate,
            endDate: dateRange.endDate
          },
          totals: {
            ...totals,
            grossRevenueFormatted: formatCurrency(totals.grossRevenue),
            netRevenueFormatted: formatCurrency(totals.netRevenue),
            totalCostsFormatted: formatCurrency(totals.totalCosts),
            grossProfitFormatted: formatCurrency(totals.grossProfit),
            netProfitFormatted: formatCurrency(totals.netProfit),
            profitMarginFormatted: formatPercentage(totals.profitMargin / 100)
          },
          paymentMethods,
          refunds: {
            ...refunds,
            totalAmountFormatted: formatCurrency(refunds.totalAmount),
            rateFormatted: formatPercentage(refunds.rate / 100)
          },
          dailyData: revenueData.map(data => ({
            date: data.date,
            grossRevenue: data.grossRevenue,
            netRevenue: data.netRevenue,
            grossProfit: data.grossProfit,
            netProfit: data.netProfit,
            profitMargin: calculateProfitMargin(data.netRevenue, data.totalCosts)
          }))
        }
      });
    } catch (error) {
      console.error('取得營收分析錯誤:', error);
      res.status(500).json({
        success: false,
        message: '取得營收分析失敗',
        error: error.message
      });
    }
  }

  /**
   * 取得庫存分析
   */
  async getInventoryAnalytics(req, res) {
    try {
      const { period = '30d' } = req.query;
      const dateRange = getDateRange(period);

      // 取得庫存分析資料
      const inventoryData = await InventoryAnalytics.getDateRange(
        dateRange.startDate,
        dateRange.endDate
      );

      // 計算總計
      const totals = inventoryData.reduce((acc, data) => {
        acc.totalInventoryValue += data.totalInventoryValue || 0;
        acc.totalStockQuantity += data.totalStockQuantity || 0;
        acc.lowStockItems += data.lowStockItems || 0;
        acc.outOfStockItems += data.outOfStockItems || 0;
        return acc;
      }, { 
        totalInventoryValue: 0, 
        totalStockQuantity: 0, 
        lowStockItems: 0, 
        outOfStockItems: 0 
      });

      // 計算庫存週轉率
      const averageInventory = totals.totalInventoryValue / Math.max(inventoryData.length, 1);
      const inventoryTurnover = calculateInventoryTurnover(totals.totalInventoryValue, averageInventory);

      // 計算缺貨率
      const stockoutRate = totals.totalStockQuantity > 0 ? 
        (totals.outOfStockItems / totals.totalStockQuantity) * 100 : 0;

      // 取得庫存警告
      const stockAlerts = inventoryData
        .flatMap(data => data.stockAlerts || [])
        .filter(alert => alert.alertType === 'low_stock' || alert.alertType === 'out_of_stock')
        .sort((a, b) => {
          if (a.alertType === 'out_of_stock' && b.alertType !== 'out_of_stock') return -1;
          if (a.alertType !== 'out_of_stock' && b.alertType === 'out_of_stock') return 1;
          return (a.currentStock / a.minStock) - (b.currentStock / b.minStock);
        })
        .slice(0, 10);

      res.json({
        success: true,
        data: {
          period: {
            startDate: dateRange.startDate,
            endDate: dateRange.endDate
          },
          totals: {
            ...totals,
            totalInventoryValueFormatted: formatCurrency(totals.totalInventoryValue),
            inventoryTurnover: formatNumber(inventoryTurnover),
            stockoutRate: formatPercentage(stockoutRate / 100)
          },
          stockAlerts,
          dailyData: inventoryData.map(data => ({
            date: data.date,
            totalInventoryValue: data.totalInventoryValue,
            totalStockQuantity: data.totalStockQuantity,
            lowStockItems: data.lowStockItems,
            outOfStockItems: data.outOfStockItems,
            inventoryTurnover: data.inventoryTurnover,
            stockoutRate: data.stockoutRate
          }))
        }
      });
    } catch (error) {
      console.error('取得庫存分析錯誤:', error);
      res.status(500).json({
        success: false,
        message: '取得庫存分析失敗',
        error: error.message
      });
    }
  }
}

module.exports = new AnalyticsController();
