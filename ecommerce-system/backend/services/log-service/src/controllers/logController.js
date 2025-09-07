const { Log, LOG_LEVELS, LOG_TYPES } = require('../models/Log');
const moment = require('moment');
const _ = require('lodash');

class LogController {
  // 創建日誌
  async createLog(req, res) {
    try {
      const logData = {
        ...req.body,
        timestamp: req.body.timestamp || new Date(),
        date: moment().format('YYYY-MM-DD'),
        hour: moment().hour()
      };

      // 驗證必要欄位
      if (!logData.level || !logData.type || !logData.message || !logData.service) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: level, type, message, service'
        });
      }

      // 驗證枚舉值
      if (!Object.values(LOG_LEVELS).includes(logData.level)) {
        return res.status(400).json({
          success: false,
          message: `Invalid log level. Must be one of: ${Object.values(LOG_LEVELS).join(', ')}`
        });
      }

      if (!Object.values(LOG_TYPES).includes(logData.type)) {
        return res.status(400).json({
          success: false,
          message: `Invalid log type. Must be one of: ${Object.values(LOG_TYPES).join(', ')}`
        });
      }

      const log = new Log(logData);
      await log.save();

      res.status(201).json({
        success: true,
        data: log.toSafeObject(),
        message: 'Log created successfully'
      });
    } catch (error) {
      console.error('Create log error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create log',
        error: error.message
      });
    }
  }

  // 查詢日誌
  async getLogs(req, res) {
    try {
      const {
        page = 1,
        limit = 50,
        service,
        level,
        type,
        startDate,
        endDate,
        userId,
        search,
        sortBy = 'timestamp',
        sortOrder = 'desc'
      } = req.query;

      // 構建查詢條件
      const query = {};

      if (service) {
        query.service = { $regex: service, $options: 'i' };
      }

      if (level) {
        query.level = level;
      }

      if (type) {
        query.type = type;
      }

      if (userId) {
        query.userId = userId;
      }

      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) {
          query.timestamp.$gte = new Date(startDate);
        }
        if (endDate) {
          query.timestamp.$lte = new Date(endDate);
        }
      }

      if (search) {
        query.$or = [
          { message: { $regex: search, $options: 'i' } },
          { service: { $regex: search, $options: 'i' } },
          { url: { $regex: search, $options: 'i' } }
        ];
      }

      // 排序
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // 分頁
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const logs = await Log.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      const total = await Log.countDocuments(query);

      res.json({
        success: true,
        data: logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        },
        message: `Found ${logs.length} logs`
      });
    } catch (error) {
      console.error('Get logs error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get logs',
        error: error.message
      });
    }
  }

  // 獲取單一日誌
  async getLogById(req, res) {
    try {
      const { id } = req.params;
      const log = await Log.findById(id);

      if (!log) {
        return res.status(404).json({
          success: false,
          message: 'Log not found'
        });
      }

      res.json({
        success: true,
        data: log.toSafeObject(),
        message: 'Log retrieved successfully'
      });
    } catch (error) {
      console.error('Get log by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get log',
        error: error.message
      });
    }
  }

  // 刪除日誌
  async deleteLog(req, res) {
    try {
      const { id } = req.params;
      const log = await Log.findByIdAndDelete(id);

      if (!log) {
        return res.status(404).json({
          success: false,
          message: 'Log not found'
        });
      }

      res.json({
        success: true,
        message: 'Log deleted successfully'
      });
    } catch (error) {
      console.error('Delete log error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete log',
        error: error.message
      });
    }
  }

  // 獲取日誌統計
  async getLogStats(req, res) {
    try {
      const { startDate, endDate } = req.query;
      
      const start = startDate ? new Date(startDate) : moment().subtract(7, 'days').toDate();
      const end = endDate ? new Date(endDate) : new Date();

      // 總體統計
      const totalLogs = await Log.countDocuments({
        timestamp: { $gte: start, $lte: end }
      });

      const errorLogs = await Log.countDocuments({
        level: LOG_LEVELS.ERROR,
        timestamp: { $gte: start, $lte: end }
      });

      const warningLogs = await Log.countDocuments({
        level: LOG_LEVELS.WARN,
        timestamp: { $gte: start, $lte: end }
      });

      // 按服務統計
      const serviceStats = await Log.getStatsByService(start, end);

      // 按級別統計
      const levelStats = await Log.getStatsByLevel(start, end);

      // 按小時統計
      const hourlyStats = await Log.aggregate([
        {
          $match: {
            timestamp: { $gte: start, $lte: end }
          }
        },
        {
          $group: {
            _id: { $hour: '$timestamp' },
            count: { $sum: 1 },
            errors: {
              $sum: { $cond: [{ $eq: ['$level', LOG_LEVELS.ERROR] }, 1, 0] }
            }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ]);

      res.json({
        success: true,
        data: {
          summary: {
            totalLogs,
            errorLogs,
            warningLogs,
            errorRate: totalLogs > 0 ? (errorLogs / totalLogs * 100).toFixed(2) : 0
          },
          serviceStats,
          levelStats,
          hourlyStats,
          dateRange: {
            start: start.toISOString(),
            end: end.toISOString()
          }
        },
        message: 'Log statistics retrieved successfully'
      });
    } catch (error) {
      console.error('Get log stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get log statistics',
        error: error.message
      });
    }
  }

  // 清理過期日誌
  async cleanupLogs(req, res) {
    try {
      const { days = 30 } = req.query;
      const cutoffDate = moment().subtract(parseInt(days), 'days').toDate();

      const result = await Log.deleteMany({
        timestamp: { $lt: cutoffDate }
      });

      res.json({
        success: true,
        data: {
          deletedCount: result.deletedCount,
          cutoffDate: cutoffDate.toISOString()
        },
        message: `Cleaned up ${result.deletedCount} logs older than ${days} days`
      });
    } catch (error) {
      console.error('Cleanup logs error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cleanup logs',
        error: error.message
      });
    }
  }

  // 批量創建日誌
  async createBatchLogs(req, res) {
    try {
      const { logs } = req.body;

      if (!Array.isArray(logs) || logs.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Logs array is required and cannot be empty'
        });
      }

      // 驗證每個日誌
      const validatedLogs = logs.map(logData => {
        const log = {
          ...logData,
          timestamp: logData.timestamp || new Date(),
          date: moment().format('YYYY-MM-DD'),
          hour: moment().hour()
        };

        if (!log.level || !log.type || !log.message || !log.service) {
          throw new Error('Missing required fields: level, type, message, service');
        }

        return log;
      });

      const createdLogs = await Log.insertMany(validatedLogs);

      res.status(201).json({
        success: true,
        data: createdLogs,
        message: `Created ${createdLogs.length} logs successfully`
      });
    } catch (error) {
      console.error('Create batch logs error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create batch logs',
        error: error.message
      });
    }
  }
}

module.exports = new LogController();
