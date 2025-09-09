const { SystemMetric } = require('../models');
const os = require('os');

// 獲取系統指標
const getMetrics = async (req, res) => {
  try {
    const { service, metric_name, start_time, end_time, limit = 100 } = req.query;
    
    const matchConditions = {};
    if (service) {
      matchConditions.service = service;
    }
    if (metric_name) {
      matchConditions.metric_name = metric_name;
    }
    if (start_time && end_time) {
      matchConditions.timestamp = {
        $gte: new Date(start_time),
        $lte: new Date(end_time)
      };
    }

    const metrics = await SystemMetric.find(matchConditions)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .lean();

    res.json({
      success: true,
      data: {
        metrics: metrics,
        total: metrics.length
      }
    });
  } catch (error) {
    console.error('獲取系統指標錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取系統指標時發生錯誤'
    });
  }
};

// 記錄系統指標
const recordMetric = async (req, res) => {
  try {
    const { metric_name, metric_type, value, labels = {}, service } = req.body;

    const metric = new SystemMetric({
      metric_name,
      metric_type,
      value,
      labels,
      service
    });

    await metric.save();

    res.status(201).json({
      success: true,
      message: '指標記錄成功',
      data: metric
    });
  } catch (error) {
    console.error('記錄系統指標錯誤:', error);
    res.status(500).json({
      success: false,
      message: '記錄系統指標時發生錯誤'
    });
  }
};

// 獲取監控儀表板數據
const getDashboard = async (req, res) => {
  try {
    const { period = 'day' } = req.query;
    
    const periodMap = {
      hour: 1,
      day: 24,
      week: 168,
      month: 720
    };
    
    const hours = periodMap[period] || 24;
    const startTime = new Date();
    startTime.setHours(startTime.getHours() - hours);

    const [
      systemMetrics,
      performanceMetrics,
      errorMetrics
    ] = await Promise.all([
      getSystemMetrics(startTime),
      getPerformanceMetrics(startTime),
      getErrorMetrics(startTime)
    ]);

    res.json({
      success: true,
      data: {
        period: period,
        system: systemMetrics,
        performance: performanceMetrics,
        errors: errorMetrics
      }
    });
  } catch (error) {
    console.error('獲取監控儀表板錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取監控儀表板時發生錯誤'
    });
  }
};

// 獲取系統警報
const getAlerts = async (req, res) => {
  try {
    const { status, severity } = req.query;
    
    // 模擬警報數據
    const alerts = [
      {
        id: '1',
        title: '高CPU使用率',
        message: 'CPU使用率超過80%',
        severity: 'high',
        status: 'active',
        service: 'system-service',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '2',
        title: '內存不足',
        message: '可用內存低於1GB',
        severity: 'critical',
        status: 'active',
        service: 'system-service',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '3',
        title: '數據庫連接超時',
        message: 'MongoDB連接超時',
        severity: 'medium',
        status: 'resolved',
        service: 'system-service',
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    let filteredAlerts = alerts;
    if (status) {
      filteredAlerts = filteredAlerts.filter(alert => alert.status === status);
    }
    if (severity) {
      filteredAlerts = filteredAlerts.filter(alert => alert.severity === severity);
    }

    res.json({
      success: true,
      data: {
        alerts: filteredAlerts,
        total: filteredAlerts.length
      }
    });
  } catch (error) {
    console.error('獲取系統警報錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取系統警報時發生錯誤'
    });
  }
};

// 獲取服務健康狀態
const getServiceHealth = async (req, res) => {
  try {
    const services = [
      {
        name: 'auth-service',
        status: 'healthy',
        url: 'http://localhost:3001/health',
        response_time: 45,
        last_check: new Date()
      },
      {
        name: 'product-service',
        status: 'healthy',
        url: 'http://localhost:3002/health',
        response_time: 32,
        last_check: new Date()
      },
      {
        name: 'order-service',
        status: 'healthy',
        url: 'http://localhost:3003/health',
        response_time: 28,
        last_check: new Date()
      },
      {
        name: 'ai-service',
        status: 'healthy',
        url: 'http://localhost:3004/health',
        response_time: 67,
        last_check: new Date()
      },
      {
        name: 'system-service',
        status: 'healthy',
        url: 'http://localhost:3005/health',
        response_time: 15,
        last_check: new Date()
      }
    ];

    res.json({
      success: true,
      data: {
        services: services,
        overall_status: 'healthy',
        total_services: services.length,
        healthy_services: services.filter(s => s.status === 'healthy').length
      }
    });
  } catch (error) {
    console.error('獲取服務健康狀態錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取服務健康狀態時發生錯誤'
    });
  }
};

// 獲取性能指標
const getPerformance = async (req, res) => {
  try {
    const { period = 'day' } = req.query;
    
    const periodMap = {
      hour: 1,
      day: 24,
      week: 168,
      month: 720
    };
    
    const hours = periodMap[period] || 24;
    const startTime = new Date();
    startTime.setHours(startTime.getHours() - hours);

    // 獲取性能指標
    const performanceData = await SystemMetric.aggregate([
      {
        $match: {
          timestamp: { $gte: startTime },
          metric_name: { $in: ['response_time', 'throughput', 'error_rate'] }
        }
      },
      {
        $group: {
          _id: {
            metric_name: '$metric_name',
            hour: { $hour: '$timestamp' }
          },
          avg_value: { $avg: '$value' },
          max_value: { $max: '$value' },
          min_value: { $min: '$value' }
        }
      },
      {
        $sort: { '_id.hour': 1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        period: period,
        performance: performanceData
      }
    });
  } catch (error) {
    console.error('獲取性能指標錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取性能指標時發生錯誤'
    });
  }
};

// 輔助函數：獲取系統指標
const getSystemMetrics = async (startTime) => {
  try {
    const metrics = await SystemMetric.aggregate([
      {
        $match: {
          timestamp: { $gte: startTime },
          metric_name: { $in: ['cpu_usage', 'memory_usage', 'disk_usage'] }
        }
      },
      {
        $group: {
          _id: '$metric_name',
          current: { $last: '$value' },
          average: { $avg: '$value' },
          maximum: { $max: '$value' },
          minimum: { $min: '$value' }
        }
      }
    ]);

    return metrics;
  } catch (error) {
    console.error('獲取系統指標錯誤:', error);
    return [];
  }
};

// 輔助函數：獲取性能指標
const getPerformanceMetrics = async (startTime) => {
  try {
    const metrics = await SystemMetric.aggregate([
      {
        $match: {
          timestamp: { $gte: startTime },
          metric_name: { $in: ['response_time', 'throughput', 'concurrent_users'] }
        }
      },
      {
        $group: {
          _id: '$metric_name',
          current: { $last: '$value' },
          average: { $avg: '$value' },
          maximum: { $max: '$value' },
          minimum: { $min: '$value' }
        }
      }
    ]);

    return metrics;
  } catch (error) {
    console.error('獲取性能指標錯誤:', error);
    return [];
  }
};

// 輔助函數：獲取錯誤指標
const getErrorMetrics = async (startTime) => {
  try {
    const metrics = await SystemMetric.aggregate([
      {
        $match: {
          timestamp: { $gte: startTime },
          metric_name: { $in: ['error_count', 'error_rate', 'exception_count'] }
        }
      },
      {
        $group: {
          _id: '$metric_name',
          current: { $last: '$value' },
          total: { $sum: '$value' },
          average: { $avg: '$value' }
        }
      }
    ]);

    return metrics;
  } catch (error) {
    console.error('獲取錯誤指標錯誤:', error);
    return [];
  }
};

module.exports = {
  getMetrics,
  recordMetric,
  getDashboard,
  getAlerts,
  getServiceHealth,
  getPerformance
};
