const { SystemLog } = require('../models');
const fs = require('fs-extra');
const path = require('path');
const moment = require('moment');

// 獲取系統日誌
const getLogs = async (req, res) => {
  try {
    const { level, service, user_id, start_date, end_date, page = 1, limit = 50 } = req.query;
    
    const matchConditions = {};
    if (level) {
      matchConditions.level = level;
    }
    if (service) {
      matchConditions.service = service;
    }
    if (user_id) {
      matchConditions.user_id = user_id;
    }
    if (start_date && end_date) {
      matchConditions.created_at = {
        $gte: new Date(start_date),
        $lte: new Date(end_date)
      };
    }

    const logs = await SystemLog.find(matchConditions)
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const total = await SystemLog.countDocuments(matchConditions);

    res.json({
      success: true,
      data: {
        logs: logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('獲取系統日誌錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取系統日誌時發生錯誤'
    });
  }
};

// 記錄系統日誌
const createLog = async (req, res) => {
  try {
    const { level, message, service, module, user_id, request_id, metadata, stack_trace } = req.body;
    
    const log = new SystemLog({
      level,
      message,
      service,
      module,
      user_id,
      request_id,
      metadata,
      stack_trace,
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    await log.save();

    res.status(201).json({
      success: true,
      message: '日誌記錄成功',
      data: log
    });
  } catch (error) {
    console.error('記錄系統日誌錯誤:', error);
    res.status(500).json({
      success: false,
      message: '記錄系統日誌時發生錯誤'
    });
  }
};

// 導出日誌
const exportLogs = async (req, res) => {
  try {
    const { level, service, start_date, end_date, format = 'json' } = req.body;
    
    const matchConditions = {};
    if (level) {
      matchConditions.level = level;
    }
    if (service) {
      matchConditions.service = service;
    }
    if (start_date && end_date) {
      matchConditions.created_at = {
        $gte: new Date(start_date),
        $lte: new Date(end_date)
      };
    }

    const logs = await SystemLog.find(matchConditions)
      .sort({ created_at: -1 })
      .lean();

    const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
    const filename = `logs_export_${timestamp}.${format}`;
    const filePath = path.join('exports', filename);

    // 確保導出目錄存在
    await fs.ensureDir('exports');

    let content = '';
    switch (format) {
      case 'json':
        content = JSON.stringify(logs, null, 2);
        break;
      case 'csv':
        if (logs.length > 0) {
          const headers = Object.keys(logs[0]).join(',');
          const rows = logs.map(log => Object.values(log).map(val => 
            typeof val === 'object' ? JSON.stringify(val) : val
          ).join(','));
          content = [headers, ...rows].join('\n');
        }
        break;
      case 'txt':
        content = logs.map(log => 
          `[${log.created_at}] ${log.level.toUpperCase()} ${log.service}: ${log.message}`
        ).join('\n');
        break;
    }

    await fs.writeFile(filePath, content);

    res.json({
      success: true,
      message: '日誌導出成功',
      data: {
        filename: filename,
        file_path: filePath,
        record_count: logs.length,
        format: format
      }
    });
  } catch (error) {
    console.error('導出日誌錯誤:', error);
    res.status(500).json({
      success: false,
      message: '導出日誌時發生錯誤'
    });
  }
};

// 獲取日誌統計
const getLogStats = async (req, res) => {
  try {
    const { start_date, end_date, group_by = 'level' } = req.query;
    
    const matchConditions = {};
    if (start_date && end_date) {
      matchConditions.created_at = {
        $gte: new Date(start_date),
        $lte: new Date(end_date)
      };
    }

    let groupField = '';
    switch (group_by) {
      case 'level':
        groupField = '$level';
        break;
      case 'service':
        groupField = '$service';
        break;
      case 'hour':
        groupField = { $hour: '$created_at' };
        break;
      case 'day':
        groupField = { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } };
        break;
      default:
        groupField = '$level';
    }

    const stats = await SystemLog.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: groupField,
          count: { $sum: 1 },
          error_count: { $sum: { $cond: [{ $eq: ['$level', 'error'] }, 1, 0] } },
          warn_count: { $sum: { $cond: [{ $eq: ['$level', 'warn'] }, 1, 0] } },
          info_count: { $sum: { $cond: [{ $eq: ['$level', 'info'] }, 1, 0] } },
          debug_count: { $sum: { $cond: [{ $eq: ['$level', 'debug'] }, 1, 0] } }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    const totalLogs = await SystemLog.countDocuments(matchConditions);

    res.json({
      success: true,
      data: {
        period: {
          start_date: start_date,
          end_date: end_date
        },
        group_by: group_by,
        total_logs: totalLogs,
        stats: stats
      }
    });
  } catch (error) {
    console.error('獲取日誌統計錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取日誌統計時發生錯誤'
    });
  }
};

// 清理日誌
const cleanupLogs = async (req, res) => {
  try {
    const { older_than_days = 30, level, service } = req.body;
    
    const cutoffDate = moment().subtract(older_than_days, 'days').toDate();
    
    const matchConditions = {
      created_at: { $lt: cutoffDate }
    };
    
    if (level) {
      matchConditions.level = level;
    }
    if (service) {
      matchConditions.service = service;
    }

    const result = await SystemLog.deleteMany(matchConditions);

    res.json({
      success: true,
      message: '日誌清理成功',
      data: {
        older_than_days: older_than_days,
        level: level,
        service: service,
        deleted_count: result.deletedCount
      }
    });
  } catch (error) {
    console.error('清理日誌錯誤:', error);
    res.status(500).json({
      success: false,
      message: '清理日誌時發生錯誤'
    });
  }
};

// 實時日誌流
const getRealTimeLogs = async (req, res) => {
  try {
    const { service, level } = req.query;
    
    // 設置 SSE 響應頭
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // 發送初始連接消息
    res.write(`data: ${JSON.stringify({
      type: 'connected',
      message: '實時日誌流已連接',
      timestamp: new Date().toISOString()
    })}\n\n`);

    // 設置定時器發送模擬日誌
    const interval = setInterval(async () => {
      try {
        const matchConditions = {};
        if (service) {
          matchConditions.service = service;
        }
        if (level) {
          matchConditions.level = level;
        }

        const recentLogs = await SystemLog.find(matchConditions)
          .sort({ created_at: -1 })
          .limit(5)
          .lean();

        if (recentLogs.length > 0) {
          res.write(`data: ${JSON.stringify({
            type: 'log',
            logs: recentLogs,
            timestamp: new Date().toISOString()
          })}\n\n`);
        }
      } catch (error) {
        console.error('實時日誌流錯誤:', error);
        res.write(`data: ${JSON.stringify({
          type: 'error',
          message: '獲取日誌時發生錯誤',
          timestamp: new Date().toISOString()
        })}\n\n`);
      }
    }, 5000); // 每5秒發送一次

    // 處理客戶端斷開連接
    req.on('close', () => {
      clearInterval(interval);
      res.end();
    });

    req.on('error', () => {
      clearInterval(interval);
      res.end();
    });

  } catch (error) {
    console.error('實時日誌流錯誤:', error);
    res.status(500).json({
      success: false,
      message: '實時日誌流時發生錯誤'
    });
  }
};

module.exports = {
  getLogs,
  createLog,
  exportLogs,
  getLogStats,
  cleanupLogs,
  getRealTimeLogs
};
