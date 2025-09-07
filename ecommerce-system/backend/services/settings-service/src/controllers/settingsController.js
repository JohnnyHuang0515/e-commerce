const { Setting, UserSetting } = require('../models');

/**
 * 取得所有設定
 */
const getAllSettings = async (req, res) => {
  try {
    const { category, publicOnly = false } = req.query;
    
    let where = {};
    if (category) {
      where.category = category;
    }
    if (publicOnly === 'true') {
      where.is_public = true;
    }

    const settings = await Setting.findAll({
      where,
      order: [['category', 'ASC'], ['key', 'ASC']]
    });

    // 處理敏感資訊
    const processedSettings = settings.map(setting => {
      const settingObj = setting.toJSON();
      if (isSensitiveSetting(setting.category, setting.key)) {
        settingObj.value = maskSensitiveValue(settingObj.value);
      }
      return settingObj;
    });

    res.json({
      success: true,
      data: {
        settings: processedSettings,
        total: processedSettings.length,
        categories: [...new Set(processedSettings.map(s => s.category))]
      }
    });
  } catch (error) {
    console.error('取得設定錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤',
      error: error.message,
    });
  }
};

/**
 * 取得單一設定
 */
const getSetting = async (req, res) => {
  try {
    const { key } = req.params;

    const setting = await Setting.getByKey(key);
    if (!setting) {
      return res.status(404).json({
        success: false,
        message: '設定不存在',
      });
    }

    // 處理敏感資訊
    let settingObj = setting.toJSON();
    if (isSensitiveSetting(setting.category, setting.key)) {
      settingObj.value = maskSensitiveValue(settingObj.value);
    }

    res.json({
      success: true,
      data: settingObj,
    });
  } catch (error) {
    console.error('取得設定錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤',
      error: error.message,
    });
  }
};

/**
 * 更新設定
 */
const updateSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const { value, description } = req.body;

    if (!value) {
      return res.status(400).json({
        success: false,
        message: '缺少設定值',
      });
    }

    // 驗證設定值
    const validationResult = validateSetting(key, value);
    if (!validationResult.valid) {
      return res.status(400).json({
        success: false,
        message: '設定值無效',
        errors: validationResult.errors,
      });
    }

    const setting = await Setting.updateSetting(key, value);
    
    if (description !== undefined) {
      setting.description = description;
      await setting.save();
    }

    console.log(`設定更新成功: ${key}`);

    res.json({
      success: true,
      message: '設定更新成功',
      data: setting.toJSON(),
    });
  } catch (error) {
    console.error('更新設定錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤',
      error: error.message,
    });
  }
};

/**
 * 批量更新設定
 */
const updateMultipleSettings = async (req, res) => {
  try {
    const { settings } = req.body;

    if (!settings || !Array.isArray(settings)) {
      return res.status(400).json({
        success: false,
        message: '缺少設定數據',
      });
    }

    const results = [];
    const errors = [];

    for (const settingData of settings) {
      try {
        const { key, value, description } = settingData;
        
        if (!key || value === undefined) {
          errors.push({ key, error: '缺少必要參數' });
          continue;
        }

        // 驗證設定值
        const validationResult = validateSetting(key, value);
        if (!validationResult.valid) {
          errors.push({ key, error: validationResult.errors.join(', ') });
          continue;
        }

        const setting = await Setting.updateSetting(key, value);
        
        if (description !== undefined) {
          setting.description = description;
          await setting.save();
        }

        results.push({ key, success: true, setting: setting.toJSON() });
      } catch (error) {
        errors.push({ key: settingData.key, error: error.message });
      }
    }

    console.log(`批量更新設定完成: ${results.length} 成功, ${errors.length} 失敗`);

    res.json({
      success: true,
      message: '批量更新完成',
      data: {
        results,
        errors,
        summary: {
          total: settings.length,
          success: results.length,
          failed: errors.length
        }
      },
    });
  } catch (error) {
    console.error('批量更新設定錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤',
      error: error.message,
    });
  }
};

/**
 * 取得公開設定
 */
const getPublicSettings = async (req, res) => {
  try {
    const settings = await Setting.getPublicSettings();

    res.json({
      success: true,
      data: {
        settings: settings.map(s => s.toJSON()),
        total: settings.length
      }
    });
  } catch (error) {
    console.error('取得公開設定錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤',
      error: error.message,
    });
  }
};

/**
 * 重置設定為預設值
 */
const resetToDefaults = async (req, res) => {
  try {
    const { key } = req.params;

    const defaultSetting = defaultSettings.find(s => s.key === key);
    if (!defaultSetting) {
      return res.status(404).json({
        success: false,
        message: '找不到預設設定',
      });
    }

    const setting = await Setting.updateSetting(key, defaultSetting.value);
    
    if (defaultSetting.description) {
      setting.description = defaultSetting.description;
      await setting.save();
    }

    console.log(`設定重置為預設值: ${key}`);

    res.json({
      success: true,
      message: '設定已重置為預設值',
      data: setting.toJSON(),
    });
  } catch (error) {
    console.error('重置設定錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤',
      error: error.message,
    });
  }
};

/**
 * 初始化預設設定
 */
const initializeDefaults = async (req, res) => {
  try {
    await Setting.initializeDefaults();

    res.json({
      success: true,
      message: '預設設定初始化完成',
    });
  } catch (error) {
    console.error('初始化預設設定錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤',
      error: error.message,
    });
  }
};

/**
 * 取得用戶設定
 */
const getUserSettings = async (req, res) => {
  try {
    const { userId } = req.params;

    const settings = await UserSetting.getUserSettings(userId);

    res.json({
      success: true,
      data: {
        settings: settings.map(s => s.toJSON()),
        total: settings.length
      }
    });
  } catch (error) {
    console.error('取得用戶設定錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤',
      error: error.message,
    });
  }
};

/**
 * 更新用戶設定
 */
const updateUserSetting = async (req, res) => {
  try {
    const { userId } = req.params;
    const { key, value } = req.body;

    if (!key || value === undefined) {
      return res.status(400).json({
        success: false,
        message: '缺少必要參數',
      });
    }

    const setting = await UserSetting.updateUserSetting(userId, key, value);

    console.log(`用戶設定更新成功: ${userId} - ${key}`);

    res.json({
      success: true,
      message: '用戶設定更新成功',
      data: setting.toJSON(),
    });
  } catch (error) {
    console.error('更新用戶設定錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤',
      error: error.message,
    });
  }
};

// 輔助函數
const isSensitiveSetting = (category, key) => {
  const sensitiveKeys = [
    'stripeSecretKey',
    'paypalSecret',
    'smtpPassword',
    'apiKey',
    'apiSecret'
  ];
  return sensitiveKeys.includes(key);
};

const maskSensitiveValue = (value) => {
  if (typeof value === 'string') {
    return value.length > 4 ? '*'.repeat(value.length - 4) + value.slice(-4) : '****';
  }
  if (typeof value === 'object' && value !== null) {
    const masked = { ...value };
    for (const key in masked) {
      if (isSensitiveSetting('', key)) {
        masked[key] = maskSensitiveValue(masked[key]);
      }
    }
    return masked;
  }
  return '****';
};

const validateSetting = (key, value) => {
  const errors = [];
  
  // 基本驗證
  if (value === null || value === undefined) {
    errors.push('設定值不能為空');
  }
  
  // 特定設定的驗證
  switch (key) {
    case 'siteInfo':
      if (typeof value !== 'object') {
        errors.push('網站資訊必須是物件');
      }
      break;
    case 'maintenance':
      if (typeof value !== 'object') {
        errors.push('維護設定必須是物件');
      }
      break;
    default:
      break;
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

// 導入預設設定
const { defaultSettings } = require('../models/SettingSequelize');

/**
 * 取得設定分類
 */
const getCategories = async (req, res) => {
  try {
    const settings = await Setting.findAll({
      attributes: ['category'],
      group: ['category']
    });

    const categories = settings.map(s => s.category).filter(Boolean);

    res.json({
      success: true,
      data: categories.map(category => ({
        name: category,
        description: getCategoryDescription(category)
      }))
    });
  } catch (error) {
    console.error('取得設定分類錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤',
      error: error.message,
    });
  }
};

/**
 * 創建設定
 */
const createSetting = async (req, res) => {
  try {
    const { key, value, description, category, isPublic = false } = req.body;

    if (!key || value === undefined) {
      return res.status(400).json({
        success: false,
        message: '缺少必要參數',
      });
    }

    // 驗證設定值
    const validationResult = validateSetting(key, value);
    if (!validationResult.valid) {
      return res.status(400).json({
        success: false,
        message: '設定值無效',
        errors: validationResult.errors,
      });
    }

    const setting = await Setting.create({
      key,
      value,
      description,
      category,
      is_public: isPublic
    });

    console.log(`設定創建成功: ${key}`);

    res.status(201).json({
      success: true,
      message: '設定創建成功',
      data: setting.toJSON(),
    });
  } catch (error) {
    console.error('創建設定錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤',
      error: error.message,
    });
  }
};

/**
 * 刪除設定
 */
const deleteSetting = async (req, res) => {
  try {
    const { key } = req.params;

    const setting = await Setting.getByKey(key);
    if (!setting) {
      return res.status(404).json({
        success: false,
        message: '設定不存在',
      });
    }

    await setting.destroy();

    console.log(`設定刪除成功: ${key}`);

    res.json({
      success: true,
      message: '設定刪除成功',
    });
  } catch (error) {
    console.error('刪除設定錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤',
      error: error.message,
    });
  }
};

/**
 * 重置為預設值
 */
const resetToDefault = async (req, res) => {
  try {
    const { key } = req.params;

    const defaultSetting = defaultSettings.find(s => s.key === key);
    if (!defaultSetting) {
      return res.status(404).json({
        success: false,
        message: '找不到預設設定',
      });
    }

    const setting = await Setting.updateSetting(key, defaultSetting.value);
    
    if (defaultSetting.description) {
      setting.description = defaultSetting.description;
      await setting.save();
    }

    console.log(`設定重置為預設值: ${key}`);

    res.json({
      success: true,
      message: '設定已重置為預設值',
      data: setting.toJSON(),
    });
  } catch (error) {
    console.error('重置設定錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤',
      error: error.message,
    });
  }
};

/**
 * 導出設定
 */
const exportSettings = async (req, res) => {
  try {
    const { category } = req.query;
    
    let where = {};
    if (category) {
      where.category = category;
    }

    const settings = await Setting.findAll({ where });

    const exportData = settings.map(setting => ({
      key: setting.key,
      value: setting.value,
      description: setting.description,
      category: setting.category,
      isPublic: setting.is_public,
      createdAt: setting.created_at,
      updatedAt: setting.updated_at
    }));

    res.json({
      success: true,
      data: {
        settings: exportData,
        total: exportData.length,
        exportedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('導出設定錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤',
      error: error.message,
    });
  }
};

// 輔助函數
const getCategoryDescription = (category) => {
  const descriptions = {
    'system': '系統設定',
    'payment': '支付設定',
    'shipping': '物流設定',
    'notification': '通知設定',
    'security': '安全設定',
    'general': '一般設定'
  };
  return descriptions[category] || '未知分類';
};

module.exports = {
  getAllSettings,
  getSetting,
  updateSetting,
  updateMultipleSettings,
  getPublicSettings,
  resetToDefaults,
  initializeDefaults,
  getUserSettings,
  updateUserSetting,
  getCategories,
  createSetting,
  deleteSetting,
  resetToDefault,
  exportSettings,
};