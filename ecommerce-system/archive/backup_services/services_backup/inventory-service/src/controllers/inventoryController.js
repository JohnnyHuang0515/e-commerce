const { Inventory, InventoryTransaction } = require('../models');

/**
 * 取得庫存列表
 */
const getInventories = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, lowStock, search, sortBy = 'updated_at', sortOrder = 'DESC' } = req.query;

    const where = {};
    
    // 狀態篩選
    if (status) {
      where.status = status;
    }
    
    // 低庫存篩選
    if (lowStock === 'true') {
      where.quantity_available = {
        [require('sequelize').Op.lte]: parseInt(process.env.LOW_STOCK_THRESHOLD) || 10
      };
    }
    
    // 搜尋篩選
    if (search) {
      where[require('sequelize').Op.or] = [
        { sku: { [require('sequelize').Op.iLike]: `%${search}%` } }
      ];
    }

    // 排序
    const order = [[sortBy, sortOrder.toUpperCase()]];

    const offset = (page - 1) * limit;
    const { count, rows: inventories } = await Inventory.findAndCountAll({
      where,
      order,
      limit: parseInt(limit),
      offset: offset,
    });

    res.json({
      success: true,
      data: {
        inventories,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    console.error('取得庫存列表失敗:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤',
      error: error.message,
    });
  }
};

/**
 * 取得庫存詳情
 */
const getInventory = async (req, res) => {
  try {
    const { id } = req.params;

    const inventory = await Inventory.findByPk(id, {
      include: [{
        model: InventoryTransaction,
        as: 'transactions',
        limit: 10,
        order: [['created_at', 'DESC']]
      }]
    });

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: '庫存記錄不存在',
      });
    }

    res.json({
      success: true,
      data: inventory,
    });
  } catch (error) {
    console.error('取得庫存詳情失敗:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤',
      error: error.message,
    });
  }
};

/**
 * 建立庫存記錄
 */
const createInventory = async (req, res) => {
  try {
    const {
      productId,
      sku,
      quantityAvailable = 0,
      reorderPoint = 0,
      maxStockLevel,
      lastRestockedAt
    } = req.body;

    // 驗證輸入
    if (!productId || !sku) {
      return res.status(400).json({
        success: false,
        message: '缺少必要參數',
      });
    }

    // 檢查 SKU 是否已存在
    const existingInventory = await Inventory.findOne({
      where: { sku }
    });

    if (existingInventory) {
      return res.status(400).json({
        success: false,
        message: 'SKU 已存在',
      });
    }

    const inventory = await Inventory.create({
      product_id: productId,
      sku,
      quantity_available: quantityAvailable,
      reorder_point: reorderPoint,
      max_stock_level: maxStockLevel,
      last_restocked_at: lastRestockedAt
    });

    console.log(`庫存記錄建立成功: ${sku}`, { productId, quantityAvailable });

    res.status(201).json({
      success: true,
      message: '庫存記錄建立成功',
      data: inventory,
    });
  } catch (error) {
    console.error('建立庫存記錄失敗:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤',
      error: error.message,
    });
  }
};

/**
 * 更新庫存
 */
const updateInventory = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      quantityAvailable,
      reorderPoint,
      maxStockLevel,
      lastRestockedAt
    } = req.body;

    const inventory = await Inventory.findByPk(id);
    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: '庫存記錄不存在',
      });
    }

    // 更新庫存
    if (quantityAvailable !== undefined) {
      inventory.quantity_available = quantityAvailable;
    }
    if (reorderPoint !== undefined) {
      inventory.reorder_point = reorderPoint;
    }
    if (maxStockLevel !== undefined) {
      inventory.max_stock_level = maxStockLevel;
    }
    if (lastRestockedAt !== undefined) {
      inventory.last_restocked_at = lastRestockedAt;
    }

    await inventory.save();

    console.log(`庫存更新成功: ${inventory.sku}`, { id, quantityAvailable });

    res.json({
      success: true,
      message: '庫存更新成功',
      data: inventory,
    });
  } catch (error) {
    console.error('更新庫存失敗:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤',
      error: error.message,
    });
  }
};

/**
 * 調整庫存
 */
const adjustStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { newQuantity, reason, createdBy } = req.body;

    if (newQuantity === undefined || newQuantity < 0) {
      return res.status(400).json({
        success: false,
        message: '無效的庫存數量',
      });
    }

    const inventory = await Inventory.findByPk(id);
    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: '庫存記錄不存在',
      });
    }

    const transaction = await inventory.adjustStock(newQuantity, reason || '手動調整', createdBy);

    console.log(`庫存調整成功: ${inventory.sku}`, { id, newQuantity, reason });

    res.json({
      success: true,
      message: '庫存調整成功',
      data: {
        inventory,
        transaction
      },
    });
  } catch (error) {
    console.error('調整庫存失敗:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤',
      error: error.message,
    });
  }
};

/**
 * 預留庫存
 */
const reserveStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, orderId, createdBy } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: '無效的預留數量',
      });
    }

    const inventory = await Inventory.findByPk(id);
    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: '庫存記錄不存在',
      });
    }

    const transaction = await inventory.reserveStock(quantity, orderId, createdBy);

    console.log(`庫存預留成功: ${inventory.sku}`, { id, quantity, orderId });

    res.json({
      success: true,
      message: '庫存預留成功',
      data: {
        inventory,
        transaction
      },
    });
  } catch (error) {
    console.error('預留庫存失敗:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤',
      error: error.message,
    });
  }
};

/**
 * 釋放預留庫存
 */
const releaseReservedStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, orderId, createdBy } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: '無效的釋放數量',
      });
    }

    const inventory = await Inventory.findByPk(id);
    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: '庫存記錄不存在',
      });
    }

    const transaction = await inventory.releaseReservedStock(quantity, orderId, createdBy);

    console.log(`預留庫存釋放成功: ${inventory.sku}`, { id, quantity, orderId });

    res.json({
      success: true,
      message: '預留庫存釋放成功',
      data: {
        inventory,
        transaction
      },
    });
  } catch (error) {
    console.error('釋放預留庫存失敗:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤',
      error: error.message,
    });
  }
};

/**
 * 確認出庫
 */
const confirmShipment = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, orderId, createdBy } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: '無效的出庫數量',
      });
    }

    const inventory = await Inventory.findByPk(id);
    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: '庫存記錄不存在',
      });
    }

    const transaction = await inventory.confirmShipment(quantity, orderId, createdBy);

    console.log(`出庫確認成功: ${inventory.sku}`, { id, quantity, orderId });

    res.json({
      success: true,
      message: '出庫確認成功',
      data: {
        inventory,
        transaction
      },
    });
  } catch (error) {
    console.error('確認出庫失敗:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤',
      error: error.message,
    });
  }
};

/**
 * 取得庫存交易記錄
 */
const getInventoryTransactions = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, transactionType, startDate, endDate } = req.query;

    const where = { inventory_id: id };
    
    if (transactionType) {
      where.transaction_type = transactionType;
    }
    
    if (startDate && endDate) {
      where.created_at = {
        [require('sequelize').Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const offset = (page - 1) * limit;
    const { count, rows: transactions } = await InventoryTransaction.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: offset,
    });

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    console.error('取得庫存交易記錄失敗:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤',
      error: error.message,
    });
  }
};

/**
 * 取得庫存統計
 */
const getInventoryStats = async (req, res) => {
  try {
    const { period = 'month', startDate, endDate } = req.query;

    let whereClause = {};
    
    if (startDate && endDate) {
      whereClause.created_at = {
        [require('sequelize').Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else {
      // 根據週期設定日期範圍
      const now = new Date();
      let start;
      
      switch (period) {
        case 'day':
          start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          start = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          start = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          start = new Date(now.getFullYear(), now.getMonth(), 1);
      }
      
      whereClause.created_at = {
        [require('sequelize').Op.gte]: start
      };
    }

    // 統計總庫存數量
    const totalInventory = await Inventory.count();

    // 統計低庫存數量
    const lowStockCount = await Inventory.count({
      where: {
        quantity_available: {
          [require('sequelize').Op.lte]: require('sequelize').col('reorder_point')
        }
      }
    });

    // 統計缺貨數量
    const outOfStockCount = await Inventory.count({
      where: {
        quantity_available: 0
      }
    });

    // 統計交易類型
    const transactionStats = await InventoryTransaction.findAll({
      where: whereClause,
      attributes: [
        'transaction_type',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      group: ['transaction_type'],
      raw: true
    });

    res.json({
      success: true,
      data: {
        period,
        totalInventory,
        lowStockCount,
        outOfStockCount,
        transactionStats: transactionStats.reduce((acc, item) => {
          acc[item.transaction_type] = parseInt(item.count);
          return acc;
        }, {}),
        dateRange: {
          start: startDate || (whereClause.created_at && whereClause.created_at[require('sequelize').Op.gte]),
          end: endDate || new Date()
        }
      }
    });
  } catch (error) {
    console.error('取得庫存統計失敗:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤',
      error: error.message,
    });
  }
};

/**
 * 批量更新庫存
 */
const bulkUpdateInventory = async (req, res) => {
  try {
    const { updates } = req.body;

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: '缺少更新數據',
      });
    }

    const results = [];
    const errors = [];

    for (const update of updates) {
      try {
        const { id, quantityAvailable, reorderPoint, maxStockLevel } = update;
        
        if (!id) {
          errors.push({ id, error: '缺少庫存 ID' });
          continue;
        }

        const inventory = await Inventory.findByPk(id);
        if (!inventory) {
          errors.push({ id, error: '庫存記錄不存在' });
          continue;
        }

        // 更新庫存
        if (quantityAvailable !== undefined) {
          inventory.quantity_available = quantityAvailable;
        }
        if (reorderPoint !== undefined) {
          inventory.reorder_point = reorderPoint;
        }
        if (maxStockLevel !== undefined) {
          inventory.max_stock_level = maxStockLevel;
        }

        await inventory.save();
        results.push({ id, success: true, inventory });
      } catch (error) {
        errors.push({ id: update.id, error: error.message });
      }
    }

    console.log(`批量更新庫存完成: ${results.length} 成功, ${errors.length} 失敗`);

    res.json({
      success: true,
      message: '批量更新完成',
      data: {
        results,
        errors,
        summary: {
          total: updates.length,
          success: results.length,
          failed: errors.length
        }
      },
    });
  } catch (error) {
    console.error('批量更新庫存失敗:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤',
      error: error.message,
    });
  }
};

/**
 * 取得低庫存警報
 */
const getLowStockAlerts = async (req, res) => {
  try {
    console.log('getLowStockAlerts 被調用');
    const { threshold } = req.query;
    const lowStockThreshold = threshold ? parseInt(threshold) : parseInt(process.env.LOW_STOCK_THRESHOLD) || 10;

    console.log('查詢低庫存項目，閾值:', lowStockThreshold);
    const lowStockItems = await Inventory.findAll({
      where: {
        quantity_available: {
          [require('sequelize').Op.lte]: lowStockThreshold
        }
      },
      order: [['quantity_available', 'ASC']]
    });

    console.log('找到低庫存項目數量:', lowStockItems.length);
    res.json({
      success: true,
      data: {
        alerts: lowStockItems,
        threshold: lowStockThreshold,
        count: lowStockItems.length
      },
    });
  } catch (error) {
    console.error('取得低庫存警報失敗:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤',
      error: error.message,
    });
  }
};

module.exports = {
  getInventories,
  getInventory,
  createInventory,
  updateInventory,
  bulkUpdateInventory,
  adjustStock,
  reserveStock,
  releaseReservedStock,
  confirmShipment,
  getInventoryTransactions,
  getInventoryStats,
  getLowStockAlerts,
};