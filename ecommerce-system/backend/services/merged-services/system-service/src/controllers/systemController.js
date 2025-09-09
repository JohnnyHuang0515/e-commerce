const { SystemConfig } = require('../models');
const os = require('os');
const fs = require('fs');
const path = require('path');

// 獲取系統配置列表
const getConfigs = async (req, res) => {
  try {
    const { category, is_public, page = 1, limit = 10 } = req.query;
    
    const matchConditions = {};
    if (category) {
      matchConditions.category = category;
    }
    if (is_public !== undefined) {
      matchConditions.is_public = is_public === 'true';
    }

    const configs = await SystemConfig.find(matchConditions)
      .sort({ category: 1, key: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const total = await SystemConfig.countDocuments(matchConditions);

    res.json({
      success: true,
      data: {
        configs: configs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('獲取系統配置錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取系統配置時發生錯誤'
    });
  }
};

// 創建系統配置
const createConfig = async (req, res) => {
  try {
    const { key, value, type = 'string', description, category = 'general', is_public = false } = req.body;

    // 檢查配置鍵是否已存在
    const existingConfig = await SystemConfig.findOne({ key });
    if (existingConfig) {
      return res.status(400).json({
        success: false,
        message: '配置鍵已存在'
      });
    }

    const config = new SystemConfig({
      key,
      value,
      type,
      description,
      category,
      is_public
    });

    await config.save();

    res.status(201).json({
      success: true,
      message: '配置創建成功',
      data: config
    });
  } catch (error) {
    console.error('創建系統配置錯誤:', error);
    res.status(500).json({
      success: false,
      message: '創建系統配置時發生錯誤'
    });
  }
};

// 獲取系統配置詳情
const getConfig = async (req, res) => {
  try {
    const { key } = req.params;
    
    const config = await SystemConfig.findOne({ key });
    if (!config) {
      return res.status(404).json({
        success: false,
        message: '配置不存在'
      });
    }

    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('獲取系統配置詳情錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取系統配置詳情時發生錯誤'
    });
  }
};

// 更新系統配置
const updateConfig = async (req, res) => {
  try {
    const { key } = req.params;
    const { value, description, is_public } = req.body;
    
    const config = await SystemConfig.findOne({ key });
    if (!config) {
      return res.status(404).json({
        success: false,
        message: '配置不存在'
      });
    }

    const updateData = {};
    if (value !== undefined) updateData.value = value;
    if (description !== undefined) updateData.description = description;
    if (is_public !== undefined) updateData.is_public = is_public;

    const updatedConfig = await SystemConfig.findByIdAndUpdate(
      config._id,
      updateData,
      { new: true }
    );

    res.json({
      success: true,
      message: '配置更新成功',
      data: updatedConfig
    });
  } catch (error) {
    console.error('更新系統配置錯誤:', error);
    res.status(500).json({
      success: false,
      message: '更新系統配置時發生錯誤'
    });
  }
};

// 刪除系統配置
const deleteConfig = async (req, res) => {
  try {
    const { key } = req.params;
    
    const config = await SystemConfig.findOne({ key });
    if (!config) {
      return res.status(404).json({
        success: false,
        message: '配置不存在'
      });
    }

    await SystemConfig.findByIdAndDelete(config._id);

    res.json({
      success: true,
      message: '配置刪除成功'
    });
  } catch (error) {
    console.error('刪除系統配置錯誤:', error);
    res.status(500).json({
      success: false,
      message: '刪除系統配置時發生錯誤'
    });
  }
};

// 獲取系統狀態
const getSystemStatus = async (req, res) => {
  try {
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    const systemInfo = {
      uptime: {
        seconds: Math.floor(uptime),
        human_readable: formatUptime(uptime)
      },
      memory: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024) + ' MB',
        heap_total: Math.round(memoryUsage.heapTotal / 1024 / 1024) + ' MB',
        heap_used: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB',
        external: Math.round(memoryUsage.external / 1024 / 1024) + ' MB'
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      platform: {
        os: os.platform(),
        arch: os.arch(),
        release: os.release(),
        hostname: os.hostname()
      },
      node: {
        version: process.version,
        pid: process.pid
      }
    };

    res.json({
      success: true,
      data: systemInfo
    });
  } catch (error) {
    console.error('獲取系統狀態錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取系統狀態時發生錯誤'
    });
  }
};

// 獲取系統信息
const getSystemInfo = async (req, res) => {
  try {
    const systemInfo = {
      service: {
        name: 'System Service',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      },
      server: {
        platform: os.platform(),
        arch: os.arch(),
        release: os.release(),
        hostname: os.hostname(),
        uptime: os.uptime(),
        load_average: os.loadavg(),
        total_memory: Math.round(os.totalmem() / 1024 / 1024 / 1024) + ' GB',
        free_memory: Math.round(os.freemem() / 1024 / 1024 / 1024) + ' GB',
        cpu_count: os.cpus().length,
        cpu_model: os.cpus()[0]?.model || 'Unknown'
      },
      process: {
        node_version: process.version,
        pid: process.pid,
        uptime: process.uptime(),
        memory_usage: process.memoryUsage(),
        cpu_usage: process.cpuUsage()
      },
      network: {
        interfaces: os.networkInterfaces()
      }
    };

    res.json({
      success: true,
      data: systemInfo
    });
  } catch (error) {
    console.error('獲取系統信息錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取系統信息時發生錯誤'
    });
  }
};

// 輔助函數：格式化運行時間
const formatUptime = (seconds) => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  let result = '';
  if (days > 0) result += `${days}天 `;
  if (hours > 0) result += `${hours}小時 `;
  if (minutes > 0) result += `${minutes}分鐘 `;
  result += `${secs}秒`;

  return result.trim();
};

module.exports = {
  getConfigs,
  createConfig,
  getConfig,
  updateConfig,
  deleteConfig,
  getSystemStatus,
  getSystemInfo
};
